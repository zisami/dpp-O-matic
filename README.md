# dpp-O-matic

**Digitaler EU-Produktpass (DPP) – Beratungs- und Kalkulationsapp**

Eine SvelteKit-Anwendung zur Verwaltung und Analyse von digitalen EU-Produktpässen (DPP) mit KI-Unterstützung.

## Features

- 🇪🇺 **DPP Beratung** – Produktpässe erstellen, verwalten und EU-Konformität prüfen
- 🧮 **DPP Kalkulator** – Nachhaltigkeitsscore berechnen (lokal + KI-gestützt)
- 🤖 **KI-Assistent** – Chat-Bot für DPP-Fragen (powered by Google Gemini)
- 🔍 **KI-Recherche** – Automatische Produktrecherche und Konformitätsanalyse
- 📎 **Datei-Upload** – Dokumente und Zertifikate hochladen
- 🔒 **Authentifizierung** – Benutzerregistrierung & Anmeldung via PocketBase

## Technologien

- **Frontend:** [SvelteKit](https://kit.svelte.dev/) + TypeScript
- **Backend/DB:** [PocketBase](https://pocketbase.io/) (Auth, File Upload, Daten)
- **KI:** [Google Gemini](https://ai.google.dev/) (Gemini 1.5 Flash)

## Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Dann `.env` bearbeiten:

```env
# PocketBase URL
VITE_POCKETBASE_URL=http://127.0.0.1:8090

# Google Gemini API Key (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=ihr_api_key
VITE_GEMINI_API_KEY=ihr_api_key
```

### 3. PocketBase starten

PocketBase herunterladen von [pocketbase.io](https://pocketbase.io/docs/) und starten:

```bash
./pocketbase serve
```

PocketBase Admin-UI öffnen: http://127.0.0.1:8090/_/

**Collection `dpp_records` erstellen mit folgenden Feldern:**

- `name` (Text, required)
- `category` (Text)
- `manufacturer` (Text)
- `model` (Text)
- `serialNumber` (Text)
- `materials` (JSON)
- `sustainability` (JSON)
- `certifications` (JSON)
- `files` (File, multiple)
- `user` (Relation → users)

### 4. Entwicklungsserver starten

```bash
npm run dev
```

App öffnen: http://localhost:5173

### 5. Produktions-Build

```bash
npm run build
npm run preview
```

## EU-Produktpass Zeitplan

| Jahr | Anforderung |
|------|-------------|
| 2024 | EU-ESPR Verordnung in Kraft |
| 2026 | DPP für Batterien & Textilien |
| 2027 | DPP für Elektronik & Fahrzeuge |
| 2030 | DPP für alle regulierten Produkte |
