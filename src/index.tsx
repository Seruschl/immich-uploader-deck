import { callable, definePlugin } from "@decky/api";
import { ButtonItem, PanelSection, PanelSectionRow, TextField, ToggleField } from "@decky/ui";
import { useEffect, useState } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";

const isRunning = callable<[], boolean>("is_running");
const toggle = callable<[], void>("toggle");
const getConfig = callable<[], PluginConfig>("get_config");
const setConfig = callable<[PluginConfig], boolean>("set_config");
const listRecentScreenshots = callable<[], RecentScreenshot[]>("list_recent_screenshots");
const manualUpload = callable<[string], UploadResult>("manual_upload");

type RecentScreenshot = {
  name: string;
  path: string;
  mtime: number;
};

type UploadResult = {
  success: boolean;
  error?: string;
};

type PluginConfig = {
  enabled?: boolean;
  auto_upload?: boolean;
  retrier_interval?: number;
  screenshots_path?: string;
  uploader?: {
    kind?: "Immich";
    url?: string;
    api_key?: string;
  };
};

type ConfigFormState = {
  enabled: boolean;
  autoUpload: boolean;
  retrierInterval: string;
  screenshotsPath: string;
  immichUrl: string;
  apiKey: string;
};

const defaultFormState: ConfigFormState = {
  enabled: true,
  autoUpload: true,
  retrierInterval: "60",
  screenshotsPath: "/home/deck/.local/share/Steam/userdata",
  immichUrl: "https://YOUR_IMMICH_URL/api",  apiKey: "",
};

function configToFormState(config: PluginConfig | null | undefined): ConfigFormState {
  return {
    enabled: config?.enabled ?? true,
    autoUpload: config?.auto_upload ?? true,
    retrierInterval: String(config?.retrier_interval ?? 60),
    screenshotsPath: config?.screenshots_path ?? defaultFormState.screenshotsPath,
    immichUrl: config?.uploader?.url ?? defaultFormState.immichUrl,
    apiKey: config?.uploader?.api_key ?? "",
  };
}

function formStateToConfig(form: ConfigFormState): PluginConfig {
  const retrierInterval = Number.parseInt(form.retrierInterval, 10);

  return {
    enabled: form.enabled,
    auto_upload: form.autoUpload,
    retrier_interval: Number.isFinite(retrierInterval) && retrierInterval > 0 ? retrierInterval : 60,
    screenshots_path: form.screenshotsPath.trim() || defaultFormState.screenshotsPath,
    uploader: {
      kind: "Immich",
      url: form.immichUrl.trim(),
      api_key: form.apiKey.trim(),
    },
  };
}

function Content() {
  const [status, setStatus] = useState("Checking backend status...");
  const [busy, setBusy] = useState(false);
  const [configStatus, setConfigStatus] = useState("Loading configuration...");
  const [configBusy, setConfigBusy] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [config, setConfigState] = useState<ConfigFormState>(defaultFormState);
  const [shots, setShots] = useState<RecentScreenshot[]>([]);
  const [shotsStatus, setShotsStatus] = useState("Loading recent screenshots...");
  const [shotsBusy, setShotsBusy] = useState(false);
  const [shotStatuses, setShotStatuses] = useState<Record<string, string>>({});

  const refreshStatus = async () => {
    try {
      const running = await isRunning();
      setStatus(running ? "Backend is running." : "Backend is stopped.");
    } catch (error) {
      setStatus(`Backend status failed: ${String(error)}`);
    }
  };

  const loadConfig = async () => {
    setConfigBusy(true);
    try {
      const backendConfig = await getConfig();
      setConfigState(configToFormState(backendConfig));
      setConfigStatus("Configuration loaded.");
      setConfigLoaded(true);
    } catch (error) {
      setConfigStatus(`Could not load configuration: ${String(error)}`);
      setConfigLoaded(false);
    } finally {
      setConfigBusy(false);
    }
  };

  const saveConfig = async () => {
    setConfigBusy(true);
    try {
      const saved = await setConfig(formStateToConfig(config));
      if (saved) {
        setConfigStatus("Configuration saved.");
      } else {
        setConfigStatus("Configuration save failed.");
      }
    } catch (error) {
      setConfigStatus(`Configuration save failed: ${String(error)}`);
    } finally {
      setConfigBusy(false);
    }
  };

  const refreshShots = async () => {
    setShotsBusy(true);
    try {
      const recent = await listRecentScreenshots();
      setShots(recent);
      setShotsStatus(recent.length ? "" : "No screenshots found.");
    } catch (error) {
      setShots([]);
      setShotsStatus(`Could not load screenshots: ${String(error)}`);
    } finally {
      setShotsBusy(false);
    }
  };

  const uploadShot = async (path: string) => {
    setShotStatuses((current) => ({ ...current, [path]: "Uploading..." }));
    setShotsStatus(`Uploading ${path}...`);
    try {
      const result = await manualUpload(path);
      if (result.success) {
        setShotStatuses((current) => ({ ...current, [path]: "Upload complete." }));
        setShotsStatus("Upload complete.");
      } else {
        const message = `Upload failed: ${result.error ?? "unknown error"}`;
        setShotStatuses((current) => ({ ...current, [path]: message }));
        setShotsStatus(message);
      }
    } catch (error) {
      const message = `Upload failed: ${String(error)}`;
      setShotStatuses((current) => ({ ...current, [path]: message }));
      setShotsStatus(message);
    } finally {
      await refreshShots();
    }
  };

  const toggleBackend = async () => {
    setBusy(true);
    try {
      await toggle();
    } catch (error) {
      setStatus(`Toggle failed: ${String(error)}`);
    } finally {
      await refreshStatus();
      setBusy(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    loadConfig();
    refreshShots();
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ fontWeight: 700, marginBottom: "8px" }}>Immich Uploader</div>
      <div style={{ marginBottom: "12px" }}>{status}</div>

      <PanelSection title="Backend">
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={busy} onClick={toggleBackend}>
            {busy ? "Working..." : "Toggle Backend"}
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={busy} onClick={refreshStatus}>
            Refresh Status
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Configuration">
        <PanelSectionRow>
          <div style={{ opacity: 0.8, marginBottom: "8px" }}>{configBusy ? "Loading..." : configStatus}</div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Enabled"
            checked={config.enabled}
            disabled={configBusy}
            onChange={(checked) => setConfigState((current) => ({ ...current, enabled: checked }))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Auto Upload"
            checked={config.autoUpload}
            disabled={configBusy}
            onChange={(checked) => setConfigState((current) => ({ ...current, autoUpload: checked }))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <TextField
            label="Immich URL"
            value={config.immichUrl}
            disabled={configBusy}
            mustBeURL
            onChange={(event) => setConfigState((current) => ({ ...current, immichUrl: event.target.value }))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <TextField
            label="API Key"
            value={config.apiKey}
            disabled={configBusy}
            bIsPassword
            bShowClearAction
            onChange={(event) => setConfigState((current) => ({ ...current, apiKey: event.target.value }))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <TextField
            label="Retrier Interval (seconds)"
            value={config.retrierInterval}
            disabled={configBusy}
            mustBeNumeric
            onChange={(event) => setConfigState((current) => ({ ...current, retrierInterval: event.target.value }))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <TextField
            label="Screenshot Path"
            value={config.screenshotsPath}
            disabled={configBusy}
            onChange={(event) => setConfigState((current) => ({ ...current, screenshotsPath: event.target.value }))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={configBusy || !configLoaded} onClick={saveConfig}>
            {configBusy ? "Saving..." : "Save Configuration"}
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={configBusy} onClick={loadConfig}>
            Reload Configuration
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Recent Screenshots">
        <PanelSectionRow>
          <div style={{ opacity: 0.8, marginBottom: "8px" }}>
            {shotsBusy ? "Loading..." : shotsStatus}
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={shotsBusy} onClick={refreshShots}>
            Refresh Screenshots
          </ButtonItem>
        </PanelSectionRow>
        {shots.map((shot) => (
          <PanelSectionRow key={shot.path}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
              <div style={{ fontWeight: 600 }}>{shot.name}</div>
              <div style={{ opacity: 0.7, fontSize: "12px", wordBreak: "break-all" }}>{shot.path}</div>
              <div style={{ opacity: 0.85, fontSize: "12px" }}>
                {shotStatuses[shot.path] ?? "Ready to upload."}
              </div>
              <ButtonItem layout="below" disabled={shotsBusy} onClick={() => uploadShot(shot.path)}>
                Upload Screenshot
              </ButtonItem>
            </div>
          </PanelSectionRow>
        ))}
      </PanelSection>
    </div>
  );
}

export default definePlugin(() => {
  return {
    name: "Immich Uploader",
    icon: <FaCloudUploadAlt />,
    content: <Content />,
    titleView: <div>Immich Uploader</div>,
  };
});
