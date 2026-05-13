# Deep Dive: Architecture & Implementation / Tiefer Einblick: Architektur & Implementierung

[English](#english) | [Deutsch](#deutsch)

---

<a name="english"></a>
## English: Detailed Architecture

Immich Uploader for Steam Deck is a hybrid application designed for efficiency, reliability, and low resource consumption. It utilizes a three-tier architecture to integrate seamlessly with Valve's SteamOS and the Decky Loader ecosystem.

### 1. The Components and their Roles

#### A. The UI Layer (Frontend)
- **Tech:** React, TypeScript, `@decky/ui`.
- **Location:** `src/`
- **Role:** Handles user interaction. It provides the settings form (URL, API Key) and the manual upload gallery.
- **Communication:** It communicates with the Python backend via the `Server` object provided by Decky's API. Every time you save settings or click "Manual Upload", a call is dispatched to a Python method in `main.py`.

#### B. The Bridge Layer (Python Middleware)
- **Tech:** Python 3.
- **Location:** `main.py`
- **Role:** Acts as the lifecycle manager and system bridge.
- **Responsibilities:**
    - **Initialization:** On boot, it ensures the config directory (`~/.config/immichuploader`) exists and seeds it with default values if necessary.
    - **Process Management:** It spawns and monitors the Rust binary as a subprocess. If you toggle the service in the UI, Python handles the `terminate()` and `Popen()` calls.
    - **Data Retrieval:** It performs heavy filesystem scans (e.g., finding the 20 most recent screenshots) in Python to keep the UI responsive.

#### C. The Service Layer (Native Backend)
- **Tech:** Rust, `tokio` (async runtime), `reqwest` (HTTP), `notify` (file watching).
- **Location:** `backend/`
- **Role:** The high-performance "Heart" of the tool.
- **Core Logic:**
    - **Real-time Monitoring:** Uses the Linux `inotify` API via the `notify` crate. It watches for `CloseWrite` events, ensuring it only starts an upload once Steam has finished writing the file to disk.
    - **State Persistence:** Uses `pickledb` (a lightweight Key-Value store) to track uploaded files. This prevents duplicate uploads if the service is restarted.
    - **Retry Logic:** An asynchronous background loop runs every X seconds (defined in `retrier_interval`). It scans the database for failed uploads and attempts to re-send them (crucial for offline play).

### 2. Data Flow & Communication

1.  **Event Capture:** User takes a screenshot -> Linux Kernel triggers an `inotify` event -> Rust Backend receives event.
2.  **Upload Pipeline:** Rust checks `pickledb` -> Validates file -> Sends Multipart-POST to Immich -> If successful, marks as uploaded.
3.  **UI Sync:** UI opens -> Calls Python `list_recent_screenshots()` -> Python returns JSON -> UI renders thumbnails.
4.  **Manual Trigger:** UI clicks "Upload" -> Python calls `bin/immichuploader upload <path>` -> The binary executes a one-shot upload and exits.

---

<a name="deutsch"></a>
## Deutsch: Detaillierte Architektur

Der Immich Uploader für das Steam Deck ist eine hybride Anwendung, die auf Effizienz, Zuverlässigkeit und geringen Ressourcenverbrauch optimiert ist. Er nutzt eine dreistufige Architektur, um sich nahtlos in Valve's SteamOS und das Decky Loader Ökosystem einzufügen.

### 1. Die Komponenten und ihre Rollen

#### A. Die UI-Schicht (Frontend)
- **Technik:** React, TypeScript, `@decky/ui`.
- **Ort:** `src/`
- **Rolle:** Übernimmt die Benutzerinteraktion. Sie stellt das Konfigurationsmenü (URL, API-Key) und die Galerie für manuelle Uploads bereit.
- **Kommunikation:** Kommuniziert mit dem Python-Backend über das `Server`-Objekt der Decky-API. Jede Einstellungsänderung oder jeder Klick auf "Manueller Upload" löst einen Aufruf einer Methode in der `main.py` aus.

#### B. Die Vermittlungsschicht (Python Middleware)
- **Technik:** Python 3.
- **Ort:** `main.py`
- **Rolle:** Fungiert als Lifecycle-Manager und Systembrücke.
- **Aufgaben:**
    - **Initialisierung:** Stellt beim Start sicher, dass das Konfigurationsverzeichnis (`~/.config/immichuploader`) existiert und legt Standardwerte fest.
    - **Prozessverwaltung:** Startet und überwacht das Rust-Binary als Subprozess. Wenn der Dienst in der UI umgeschaltet wird, übernimmt Python die `terminate()` und `Popen()` Aufrufe.
    - **Datenbeschaffung:** Führt rechenintensive Scans des Dateisystems durch (z. B. Suche nach den 20 neuesten Screenshots), um die UI flüssig zu halten.

#### C. Die Dienstschicht (Natives Backend)
- **Technik:** Rust, `tokio` (Async-Runtime), `reqwest` (HTTP), `notify` (Dateisystemüberwachung).
- **Ort:** `backend/`
- **Rolle:** Das Hochleistungs-"Herz" des Tools.
- **Kernlogik:**
    - **Echtzeit-Überwachung:** Nutzt die Linux-API `inotify` via Rust. Es wartet auf `CloseWrite`-Events, um sicherzustellen, dass ein Upload erst startet, wenn Steam die Datei vollständig auf die Festplatte geschrieben hat.
    - **Status-Speicherung:** Nutzt `pickledb` (ein leichtgewichtiger Key-Value-Speicher), um hochgeladene Dateien zu tracken. Dies verhindert doppelte Uploads bei einem Neustart des Dienstes.
    - **Wiederholungs-Logik:** Ein asynchroner Hintergrund-Loop läuft alle X Sekunden (definiert im `retrier_interval`). Er scannt die Datenbank nach fehlgeschlagenen Uploads und versucht, diese erneut zu senden (wichtig für den Offline-Modus).

### 2. Datenfluss & Kommunikation

1.  **Ereignis-Erfassung:** Nutzer macht einen Screenshot -> Linux Kernel löst ein `inotify`-Event aus -> Rust-Backend empfängt das Event.
2.  **Upload-Pipeline:** Rust prüft `pickledb` -> Validiert die Datei -> Sendet Multipart-POST an Immich -> Bei Erfolg: Markierung als hochgeladen.
3.  **UI-Synchronisation:** UI wird geöffnet -> Ruft Python `list_recent_screenshots()` auf -> Python liefert JSON zurück -> UI rendert Thumbnails.
4.  **Manueller Trigger:** UI klickt auf "Upload" -> Python startet `bin/immichuploader upload <pfad>` -> Das Binary führt einen einmaligen Upload aus und beendet sich wieder.

---
**Credits:** Built by R. Schlensog + AI Support / KI Unterstützung.
