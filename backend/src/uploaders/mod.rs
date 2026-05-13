pub mod immich;

use crate::steam::GameScreenshot;

#[async_trait]
pub trait Uploader: Sync + Send {
  fn name(&self) -> &'static str;
  async fn auth(&self) -> Result<(), anyhow::Error> {
    Ok(())
  }
  async fn upload<'a>(&'a self, screenshot: &'a GameScreenshot) -> Result<&'a GameScreenshot, anyhow::Error>;
}
