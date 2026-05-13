# Immich Uploader for Steam Deck

[English](#english) | [Deutsch](#deutsch)

---

<a name="english"></a>
## English

Immich Uploader is a service for your Steam Deck that automatically uploads any screenshot taken directly to your Immich instance.

### Features
- **Automatic Upload:** Screenshots are uploaded as soon as they are taken.
- **Immich Integration:** Dedicated support for Immich using its official API.
- **Offline Support:** Maintains an internal database to retry failed uploads when you're back online.
- **Manual Upload UI:** Browse recent screenshots and trigger uploads from the Decky panel.

### Configuration
1. **Immich URL:** The API endpoint of your Immich instance (e.g., `http://192.168.1.10:2283/api`).
2. **API Key:** Your personal API key generated in Immich settings.

### Installation
This plugin is designed for [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader).
1. Ensure you have the Rust toolchain and Node.js installed.
2. Build the frontend: `pnpm install && pnpm run build`
3. Build the backend: `cargo zigbuild --release --target x86_64-unknown-linux-gnu` inside `backend/`.
4. Deploy to `/home/deck/homebrew/plugins/immichuploader`.

---

<a name="deutsch"></a>
## Deutsch

Immich Uploader ist ein Dienst für das Steam Deck, der automatisch jeden Screenshot direkt auf deine Immich-Instanz hochlädt.

### Funktionen
- **Automatischer Upload:** Screenshots werden sofort nach der Aufnahme hochgeladen.
- **Immich Integration:** Dedizierte Unterstützung für Immich über die offizielle API.
- **Offline-Unterstützung:** Verwendet eine interne Datenbank, um fehlgeschlagene Uploads zu wiederholen, sobald du wieder online bist.
- **Manuelle Upload-Oberfläche:** Durchsuche die neuesten Screenshots und starte Uploads direkt über das Decky-Panel.

### Konfiguration
1. **Immich-URL:** Der API-Endpunkt deiner Immich-Instanz (z. B. `http://192.168.1.10:2283/api`).
2. **API-Key:** Dein persönlicher API-Key, den du in den Immich-Einstellungen erstellt hast.

### Installation
Dieses Plugin wurde für den [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) entwickelt.
1. Stelle sicher, dass Rust und Node.js installiert sind.
2. Frontend bauen: `pnpm install && pnpm run build`
3. Backend bauen: `cargo zigbuild --release --target x86_64-unknown-linux-gnu` im Ordner `backend/`.
4. Installation unter `/home/deck/homebrew/plugins/immichuploader`.

---

## Credits
Built by **R. Schlensog + AI Support / KI Unterstützung**.

## License
MIT
