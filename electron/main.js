const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess = null;

function startBackend() {
  const isDev = process.env.NODE_ENV === 'development';
  let backendExecutable;

  if (isDev) {
    // In development, run python runner directly
    backendProcess = spawn('python', ['run_desktop.py'], {
      cwd: path.join(__dirname, '..', 'backend'),
      shell: true,
    });
  } else {
    // In production, execute the standalone PyInstaller binary
    backendExecutable = path.join(__dirname, '..', 'backend', 'dist', 'avis-core', 'avis-core.exe');
    backendProcess = spawn(backendExecutable, [], {
      cwd: path.join(__dirname, '..', 'backend', 'dist', 'avis-core'),
    });
  }

  backendProcess.stdout?.on('data', (data) => {
    console.log(`[Backend]: ${data}`);
  });

  backendProcess.stderr?.on('data', (data) => {
    console.error(`[Backend Error]: ${data}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'AviS - Private Compliance Assistant',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  // Load the built React static application
  const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  if (backendProcess) {
    console.log('Terminating embedded AviS backend process...');
    backendProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
