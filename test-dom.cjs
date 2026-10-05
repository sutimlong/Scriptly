const { app, BrowserWindow } = require('electron');
const path = require('path');
app.whenReady().then(() => {
  const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true, contextIsolation: false } });
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  win.webContents.on('did-finish-load', async () => {
    const html = await win.webContents.executeJavaScript('document.getElementById("root").innerHTML');
    console.log("ROOT_HTML:", html);
    app.quit();
  });
});
