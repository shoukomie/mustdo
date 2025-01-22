const path = require("path");  // import path module, to work with directories
const {app, BrowserWindow} = require("electron");  // import electron module

const isMac = process.platform === "darwin";  // checks if macOS

function createWindow() {
    const win = new BrowserWindow({
        title: "MustDo",
        width: 460,
        maxWidth: 460,
        minWidth: 460,
        height: 600,
        minHeight: 190,
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,  // allows node.js integration; system files accessible
            contextIsolation: false
        }
    });

    win.loadFile("index.html");  // loading index.html
}


app.whenReady().then(() => {
    createWindow();  // creates window when promise [app is "ready"] is fulfilled

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();  // creates window if none exist when app is activated
        }
    });
});

app.on("window-all-closed", () => {
    if (!isMac) {
        app.quit();  // quits app when all windows are closed
    }
});
