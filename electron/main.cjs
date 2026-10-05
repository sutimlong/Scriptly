const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// 設定應用程式名稱 (在 Dock 上顯示的名稱)
if (process.platform === 'darwin') {
  app.name = 'Scriptly';
  try {
    if (!app.isPackaged) {
      // 開發者模式下，使用帶有齒輪的專屬開發版 icon
      const devIconPath = path.join(__dirname, '../public/icon-dev.png');
      const image = nativeImage.createFromPath(devIconPath);
      app.dock.setIcon(image);
    }
  } catch (e) {
    console.warn("Electron native load image warning:", e);
  }
}

ipcMain.handle('export-pdf', async (event, title, htmlContent) => {
  return new Promise((resolve) => {
    const tempHtmlPath = path.join(app.getPath('temp'), 'temp-pdf.html');
    fs.writeFileSync(tempHtmlPath, htmlContent);

    const pdfWin = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: path.join(__dirname, 'preload.cjs')
      }
    });

    pdfWin.loadFile(tempHtmlPath);

    pdfWin.webContents.on('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const data = await pdfWin.webContents.printToPDF({
            printBackground: true,
            pageSize: 'A4',
            displayHeaderFooter: true,
            headerTemplate: '<div></div>', // Empty header
            footerTemplate: '<div style="width: 100%; text-align: center; font-size: 11px; font-family: serif; color: #666; padding-bottom: 5mm;">- <span class="pageNumber"></span> -</div>'
          });
          
          const safeTitle = (title || '未命名劇本').replace(/[/\\]/g, '-');
          const tempPdfPath = path.join(app.getPath('temp'), `${safeTitle}.pdf`);
          fs.writeFileSync(tempPdfPath, data);
          
          const previewWin = new BrowserWindow({
            title: `預覽: ${safeTitle}`,
            width: 1000,
            height: 800,
            alwaysOnTop: true, // Keep it on top of the main window initially
            webPreferences: {
              plugins: true // Required for native PDF viewer
            }
          });
          
          // After showing, we can disable alwaysOnTop so it doesn't annoy the user if they switch apps
          previewWin.once('ready-to-show', () => {
            previewWin.show();
            previewWin.focus();
            setTimeout(() => {
              previewWin.setAlwaysOnTop(false);
            }, 500);
          });
          
          previewWin.setMenu(null);
          previewWin.loadFile(tempPdfPath);
          
          resolve({ success: true, previewed: true });
        } catch (error) {
          resolve({ success: false, error: error.message });
        } finally {
          pdfWin.close();
          try {
            fs.unlinkSync(tempHtmlPath);
          } catch (e) {}
        }
      }, 500);
    });
  });
});


ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), options);
  return result;
});

function createWindow() {
  let windowIcon;
  if (!app.isPackaged) {
    const devIconPath = path.join(__dirname, '../public/icon-dev.png');
    windowIcon = nativeImage.createFromPath(devIconPath);
  }

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hidden',
    title: "Scriptly - 未命名劇本",
    icon: windowIcon,
    show: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

    mainWindow.maximize();

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Browser Console]: ${message}`);
  });

  // In development, load the Vite dev server URL
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // In production, load the index.html from the dist folder
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'local-fonts') {
      callback(true);
      return;
    }
    callback(false);
  });

  createWindow();


  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
