use std::{path::PathBuf, sync::Arc};

use anyhow::Context;
use serde::Deserialize;

use crate::uploaders::{
  immich::{ImmichConfig, ImmichUploader},
  Uploader,
};

#[derive(Clone, Deserialize)]
#[serde(tag = "kind")]
pub enum UploaderKind {
  Immich(ImmichConfig),
}

#[derive(Clone, Deserialize)]
pub struct Config {
  #[serde(default = "default_immichuploader_path")]
  pub immichuploader_path: PathBuf,
  #[serde(default = "default_screenshot_path")]
  pub screenshots_path: PathBuf,
  pub uploader: UploaderKind,
  #[serde(default = "default_retrier_interval")]
  pub retrier_interval: u64,
  #[serde(default = "default_auto_upload")]
  pub auto_upload: bool,
}

fn default_immichuploader_path() -> PathBuf {
  "/home/deck/.config/immichuploader".into()
}

fn default_screenshot_path() -> PathBuf {
  "/home/deck/.local/share/Steam/userdata".into()
}

const fn default_retrier_interval() -> u64 {
  60
}

const fn default_auto_upload() -> bool {
  true
}

impl Config {
  pub async fn uploader(&self) -> Result<Arc<Box<dyn Uploader>>, anyhow::Error> {
    let uploader: Box<dyn Uploader> = match self.uploader {
      UploaderKind::Immich(ref config) => Box::new(ImmichUploader::build(config.clone())?),
    };

    Ok(Arc::new(uploader))
  }
}

pub fn read_config(path: Option<&PathBuf>) -> Result<Config, anyhow::Error> {
  let default = default_immichuploader_path().join("immichuploader.yml");
  let path = path.unwrap_or(&default);
  let file = std::fs::File::open(path).context(format!("could not open configuration file: {}", path.display()))?;

  serde_yaml::from_reader::<_, Config>(file).context(format!("could not parse configuration file: {}", path.display()))
}
