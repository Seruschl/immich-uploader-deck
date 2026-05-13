use anyhow::Context;
use reqwest::multipart;
use serde::Deserialize;
use tokio::fs::File;
use tokio_util::io::ReaderStream;

use crate::steam::GameScreenshot;
use crate::uploaders::Uploader;

#[derive(Clone, Deserialize)]
pub struct ImmichConfig {
    pub url: String,
    pub api_key: String,
}

pub struct ImmichUploader {
    config: ImmichConfig,
    client: reqwest::Client,
}

impl ImmichUploader {
    pub fn build(config: ImmichConfig) -> Result<Self, anyhow::Error> {
        Ok(Self {
            config,
            client: reqwest::Client::new(),
        })
    }
}

#[async_trait]
impl Uploader for ImmichUploader {
    fn name(&self) -> &'static str {
        "Immich"
    }

    async fn upload<'a>(&'a self, screenshot: &'a GameScreenshot) -> Result<&'a GameScreenshot, anyhow::Error> {
        let file = File::open(&screenshot.path).await.context("could not open screenshot file")?;
        let metadata = file.metadata().await.context("could not get file metadata")?;
        let mtime = metadata.modified().context("could not get modification time")?;
        let iso_time = chrono::DateTime::<chrono::Utc>::from(mtime).to_rfc3339();

        let file_name = screenshot.file_name()?.to_string_lossy().to_string();
        let device_asset_id = format!("{}-{}", file_name, metadata.len());

        let stream = ReaderStream::new(file);
        let part = multipart::Part::stream(reqwest::Body::wrap_stream(stream))
            .file_name(file_name.clone())
            .mime_str("image/jpeg")?;

        let form = multipart::Form::new()
            .part("assetData", part)
            .text("deviceAssetId", device_asset_id)
            .text("deviceId", "SteamDeck")
            .text("fileCreatedAt", iso_time.clone())
            .text("fileModifiedAt", iso_time)
            .text("isFavorite", "false");

        let url = format!("{}/assets", self.config.url.trim_end_matches('/'));
        let response = self.client
            .post(url)
            .header("x-api-key", &self.config.api_key)
            .multipart(form)
            .send()
            .await
            .context("failed to send request to Immich")?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!("Immich upload failed with status {}: {}", status, text));
        }

        Ok(screenshot)
    }
}
