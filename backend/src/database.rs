use std::sync::Arc;

use anyhow::Context;
use pickledb::{PickleDb, SerializationMethod};
use tokio::{
  fs::{create_dir_all, File},
  io::{AsyncReadExt, AsyncWriteExt},
  sync::Mutex,
};

use crate::config::Config;

pub type Db = Arc<Mutex<PickleDb>>;

pub fn init_db(config: &Config) -> Result<Db, anyhow::Error> {
  let mut db = match load_db(config) {
    Ok(db) => db,
    Err(_) => create_db(config),
  };

  if !db.lexists("screenshots") {
    db.lcreate("screenshots").context("could not create database list")?;
  }

  Ok(Arc::new(Mutex::new(db)))
}

fn create_db(config: &Config) -> PickleDb {
  PickleDb::new(
    config.immichuploader_path.join("immichuploader.db"),
    pickledb::PickleDbDumpPolicy::AutoDump,
    SerializationMethod::Bin,
  )
}

fn load_db(config: &Config) -> Result<PickleDb, anyhow::Error> {
  Ok(PickleDb::load(
    config.immichuploader_path.join("immichuploader.db"),
    pickledb::PickleDbDumpPolicy::AutoDump,
    SerializationMethod::Bin,
  )?)
}

pub async fn save_token(config: &Config, key: &str, value: &str) -> Result<(), anyhow::Error> {
  create_dir_all(config.immichuploader_path.join("credentials")).await?;

  let mut file = File::create(config.immichuploader_path.join("credentials").join(key)).await?;
  file.write_all(value.as_bytes()).await?;

  Ok(())
}

pub async fn load_token(config: &Config, key: &str) -> Result<String, anyhow::Error> {
  let mut file = File::open(config.immichuploader_path.join("credentials").join(key))
    .await
    .context("could not load token, did you run 'immichuploader auth'?")?;

  let mut value = String::new();

  file.read_to_string(&mut value).await?;

  Ok(value.trim().to_string())
}
