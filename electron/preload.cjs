const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    invoke: (...args) => ipcRenderer.invoke(...args),
    on: (...args) => ipcRenderer.on(...args),
    send: (...args) => ipcRenderer.send(...args)
  },
  fs: {
    existsSync: fs.existsSync,
    readFileSync: fs.readFileSync,
    writeFileSync: fs.writeFileSync,
    unlinkSync: fs.unlinkSync
  }
});
