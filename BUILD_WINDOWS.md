# Bauanleitung: ImmichUploader auf Windows kompilieren

Diese Anleitung beschreibt den funktionierenden Build-Ablauf auf Windows, um das Decky-Plugin fuer das Steam Deck zu erzeugen.

## 1. Voraussetzungen installieren

### A. Rust (Backend)
1. Installiere Rust ueber [rustup.rs](https://rustup.rs/).
2. Installiere die Visual Studio Build Tools mit `Desktop development with C++`.

### B. Node.js und pnpm (Frontend)
1. Installiere eine aktuelle Node.js-LTS-Version von [nodejs.org](https://nodejs.org/).
2. Installiere `pnpm`:
   ```powershell
   npm install -g pnpm
   ```

### C. Cross-Compilation fuer Linux
1. Installiere Zig mit `winget`:
   ```powershell
   winget install --id zig.zig --exact --accept-source-agreements --accept-package-agreements --scope user
   ```
2. Installiere `cargo-zigbuild`:
   ```powershell
   cargo install cargo-zigbuild
   ```
3. Installiere das Linux-Target fuer Rust:
   ```powershell
   rustup target add x86_64-unknown-linux-gnu
   ```

## 2. Wichtiger Hinweis zum Projektpfad

`cargo zigbuild` scheitert auf Windows leicht an Projektpfaden mit Leerzeichen. Liegt das Repo in einem Ordner wie `immich uploader`, baue ueber einen Alias ohne Leerzeichen.

Beispiel:
```powershell
New-Item -ItemType Junction `
  -Path C:\Users\<DEIN_USER>\Documents\Github\immich_uploader_build `
  -Target C:\Users\<DEIN_USER>\Documents\Github\immich uploader
```

Verwende fuer den Backend-Build danach den Junction-Pfad ohne Leerzeichen.

## 3. Build ausfuehren

### Schritt 1: Frontend bauen
Im Projektwurzelverzeichnis:
```powershell
pnpm install
pnpm run build
```

Ergebnis:
- `dist/index.js`

### Schritt 2: Backend fuer Steam Deck bauen
Im `backend`-Ordner des Pfads ohne Leerzeichen:
```powershell
cargo zigbuild --release --target x86_64-unknown-linux-gnu
```

Ergebnis:
- `backend/target/x86_64-unknown-linux-gnu/release/immichuploader`

## 4. Plugin fuer das Steam Deck vorbereiten

Decky benoetigt folgende Dateien im Plugin-Ordner:
- `plugin.json`
- `main.py`
- `dist/index.js`
- `bin/immichuploader`
- `py_modules/`
- `immichuploader.yml`

Die Datei `immichuploader.yml` und der Ordner `py_modules/` kommen aus `defaults/`.

Beispiel zum Vorbereiten im Projektordner:
```powershell
New-Item -ItemType Directory -Force bin
Copy-Item backend\target\x86_64-unknown-linux-gnu\release\immichuploader bin\immichuploader -Force

New-Item -ItemType Directory -Force steamdeck-package\immichuploader\dist
New-Item -ItemType Directory -Force steamdeck-package\immichuploader\bin

Copy-Item plugin.json steamdeck-package\immichuploader\plugin.json -Force
Copy-Item main.py steamdeck-package\immichuploader\main.py -Force
Copy-Item dist\index.js steamdeck-package\immichuploader\dist\index.js -Force
Copy-Item bin\immichuploader steamdeck-package\immichuploader\bin\immichuploader -Force
Copy-Item defaults\immichuploader.yml steamdeck-package\immichuploader\immichuploader.yml -Force
Copy-Item defaults\py_modules steamdeck-package\immichuploader\py_modules -Recurse -Force
```

## 5. Auf das Steam Deck kopieren

Kopiere den Ordner `steamdeck-package/immichuploader` nach:
`/home/deck/homebrew/plugins/immichuploader`

Danach:
1. Decky Loader neu starten oder das Steam Deck neu starten.
2. Plugin oeffnen.
3. In der UI Immich-URL und API-Key pruefen.
4. Plugin aktivieren und mit einem Test-Screenshot pruefen.
