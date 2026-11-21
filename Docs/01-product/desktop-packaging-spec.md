# Desktop Application Packaging Specification: AviS (Electron & PyInstaller)

## 1. Goal
Bundle the AviS React UI and embedded FastAPI core into a standalone, double-clickable desktop application (`AviS.exe`) for Windows without requiring users to install Python, Node.js, or Docker.

---

## 2. Architecture of the Standalone Package

```
┌────────────────────────────────────────────────────────┐
│                      AviS.exe                          │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Desktop Shell (Electron)                        │  │
│  │  - Manages native OS window                      │  │
│  │  - Serves compiled React frontend (`dist/`)      │  │
│  │  - Spawns & monitors embedded Python engine      │  │
│  │  - Auto-terminates engine on app close           │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │ Local Loopback (8000)      │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │  Embedded Core Binary (`avis-core.exe`)          │  │
│  │  - Packaged via PyInstaller                      │  │
│  │  - Standalone FastAPI + Uvicorn server           │  │
│  │  - Bundled PyPDF, Docx, SQLite (aiosqlite)       │  │
│  │  - Embedded Qdrant (persisted to %APPDATA%/AviS) │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 3. Bundling Steps

### Step 1: Package the Backend Core with PyInstaller
A standalone Python executable that bundles Uvicorn and FastAPI:
```bash
cd backend
pyinstaller --name "avis-core" --onedir --clean app/main.py
```

### Step 2: Configure Electron Wrapper (`electron/main.js`)
* **Spawns child process:** `spawn('resources/avis-core/avis-core.exe')`
* **Loads UI:** `mainWindow.loadFile('frontend/dist/index.html')`
* **Lifecycle hooks:** Ensures the background Python process is killed when the user closes the window.

### Step 3: Produce Single Installer (`electron-builder`)
* Generates `AviS-Setup-0.1.0.exe` for distribution to CA firms.
