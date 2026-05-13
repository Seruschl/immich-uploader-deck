# Build Instructions / Bauanleitung: Windows

[English](#english) | [Deutsch](#deutsch)

---

<a name="english"></a>
## English

This guide describes how to build the Immich Uploader for Steam Deck on a Windows machine.

### 1. Prerequisites
- **Rust:** Install via [rustup.rs](https://rustup.rs/). Install Visual Studio Build Tools with "Desktop development with C++".
- **Node.js & pnpm:** Install Node.js from [nodejs.org](https://nodejs.org/) and run `npm install -g pnpm`.
- **Cross-Compilation:**
  - Install Zig: `winget install zig.zig`
  - Install cargo-zigbuild: `cargo install cargo-zigbuild`
  - Add Linux target: `rustup target add x86_64-unknown-linux-gnu`

### 2. Important: Path Spaces
`cargo zigbuild` may fail if your project path contains spaces (e.g., `immich uploader`). Use a path without spaces or create a Directory Junction:
```powershell
New-Item -ItemType Junction -Path "C:\path\to\immich_uploader_build" -Target "C:\path\to\immich uploader"
```

### 3. Build Steps
1. **Frontend:**
   ```powershell
   pnpm install
   pnpm run build
   ```
2. **Backend:** (Inside the `backend` folder)
   ```powershell
   cargo zigbuild --release --target x86_64-unknown-linux-gnu
   ```

### 4. Preparation
Copy the resulting binaries and assets into your plugin structure as described in the README.

---

<a name="deutsch"></a>
## Deutsch

Diese Anleitung beschreibt, wie du den Immich Uploader für das Steam Deck auf Windows kompilierst.

### 1. Voraussetzungen
- **Rust:** Über [rustup.rs](https://rustup.rs/) installieren. Visual Studio Build Tools mit "Desktopentwicklung mit C++" hinzufügen.
- **Node.js & pnpm:** Node.js von [nodejs.org](https://nodejs.org/) laden und `npm install -g pnpm` ausführen.
- **Cross-Compilation:**
  - Zig installieren: `winget install zig.zig`
  - cargo-zigbuild installieren: `cargo install cargo-zigbuild`
  - Linux-Target hinzufügen: `rustup target add x86_64-unknown-linux-gnu`

### 2. Wichtig: Leerzeichen im Pfad
`cargo zigbuild` scheitert oft an Leerzeichen im Pfad (z. B. `immich uploader`). Nutze einen Pfad ohne Leerzeichen oder erstelle eine Verknüpfung (Junction):
```powershell
New-Item -ItemType Junction -Path "C:\pfad\zu\immich_uploader_build" -Target "C:\pfad\zu\immich uploader"
```

### 3. Build-Schritte
1. **Frontend:**
   ```powershell
   pnpm install
   pnpm run build
   ```
2. **Backend:** (Im `backend` Ordner)
   ```powershell
   cargo zigbuild --release --target x86_64-unknown-linux-gnu
   ```

### 4. Vorbereitung
Kopiere die fertigen Dateien in deine Plugin-Struktur, wie in der README beschrieben.

---
**Credits:** Built by R. Schlensog + AI Support / KI Unterstützung.
