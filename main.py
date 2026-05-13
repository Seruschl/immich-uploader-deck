import asyncio
import os
import pathlib
import logging
import shutil
import subprocess
import sys
import glob

PLUGIN_DIR = pathlib.Path(__file__).parent.resolve()
CONFIG_DIR = pathlib.Path("/home/deck/.config/immichuploader")
CONFIG_FILE = CONFIG_DIR / "immichuploader.yml"
SCREENSHOTS_BASE = pathlib.Path("/home/deck/.local/share/Steam/userdata")

sys.path.insert(0, str(PLUGIN_DIR / "py_modules"))

import yaml


def log(message):
    logging.info(f"[immichuploader] {message}")


class Plugin:
    process = None

    async def _main(self):
        os.makedirs(CONFIG_DIR, exist_ok=True)

        if not os.path.exists(CONFIG_FILE):
            shutil.copyfile(PLUGIN_DIR / "immichuploader.yml", CONFIG_FILE)
            os.chmod(CONFIG_FILE, 0o0600)

        config = await self.get_config()

        if config and config.get("enabled", True):
            await self.start()

        while True:
            await asyncio.sleep(1)

    async def _unload(self):
        await self.stop()

    async def start(self):
        if not await self.is_running():
            log("starting backend service")
            try:
                self.process = subprocess.Popen(
                    [
                        str(PLUGIN_DIR / "bin" / "immichuploader"),
                        "-c",
                        str(CONFIG_FILE),
                    ],
                    cwd=str(PLUGIN_DIR),
                )
            except Exception as exc:
                log(f"failed to start backend service: {exc}")
                self.process = None

    async def stop(self):
        if await self.is_running():
            log("stopping backend service")
            self.process.terminate()

        self.process = None

    async def toggle(self):
        config = await self.get_config()
        config["enabled"] = not await self.is_running()

        await self.write_config(config)

        if await self.is_running():
            await self.stop()
        else:
            await self.start()

    async def is_running(self):
        if self.process is None:
            return False

        return self.process.poll() is None

    async def get_config(self):
        with open(CONFIG_FILE) as f:
            return yaml.safe_load(f) or {}

    async def set_config(self, config):
        await self.write_config(config)
        return True

    async def write_config(self, config):
        with open(CONFIG_FILE, "w") as fw:
            yaml.safe_dump(config, fw)

    async def list_recent_screenshots(self):
        """Find the 20 most recent screenshots across all Steam users/games."""
        search_path = str(SCREENSHOTS_BASE / "*" / "760" / "remote" / "*" / "screenshots" / "*.jpg")
        files = glob.glob(search_path)
        
        # Filter out thumbnails
        files = [f for f in files if "thumbnail" not in f]
        
        # Sort by mtime descending
        files.sort(key=os.path.getmtime, reverse=True)
        
        # Return last 20 with name and full path
        recent = []
        for f in files[:20]:
            recent.append({
                "name": os.path.basename(f),
                "path": f,
                "mtime": os.path.getmtime(f)
            })
        return recent

    async def manual_upload(self, path):
        """Manually trigger an upload for a specific file."""
        log(f"manually uploading: {path}")
        try:
            res = subprocess.run(
                [
                    str(PLUGIN_DIR / "bin" / "immichuploader"),
                    "-c",
                    str(CONFIG_FILE),
                    "upload",
                    path
                ],
                capture_output=True,
                text=True
            )
            if res.returncode == 0:
                log("manual upload successful")
                return {"success": True}
            else:
                log(f"manual upload failed: {res.stderr}")
                return {"success": False, "error": res.stderr}
        except Exception as e:
            log(f"manual upload error: {str(e)}")
            return {"success": False, "error": str(e)}
