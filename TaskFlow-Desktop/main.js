const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const notifier = require('node-notifier');

// Initialize electron store for settings
const store = new Store();

class TaskFlowApp {
    constructor() {
        this.mainWindow = null;
        this.tray = null;
        this.isQuitting = false;
        
        // App settings
        this.settings = {
            autoStart: store.get('autoStart', true),
            minimizeToTray: store.get('minimizeToTray', true),
            showNotifications: store.get('showNotifications', true),
            theme: store.get('theme', 'dark'),
            windowBounds: store.get('windowBounds', { width: 1200, height: 800 })
        };
    }

    async createWindow() {
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            width: this.settings.windowBounds.width,
            height: this.settings.windowBounds.height,
            minWidth: 800,
            minHeight: 600,
            icon: path.join(__dirname, 'assets', 'icon.png'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js'),
                webSecurity: false // Allow local file access
            },
            titleBarStyle: 'default',
            show: false, // Don't show until ready
            backgroundColor: '#1a1a2e'
        });

        // Load the app
        await this.mainWindow.loadFile('web/index.html');

        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            // Focus on the window
            if (this.mainWindow) {
                this.mainWindow.focus();
            }
        });

        // Handle window events
        this.mainWindow.on('close', (event) => {
            if (!this.isQuitting && this.settings.minimizeToTray) {
                event.preventDefault();
                this.mainWindow.hide();
                this.showTrayNotification('TaskFlow minimized to tray');
            }
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        this.mainWindow.on('resize', () => {
            if (this.mainWindow) {
                this.settings.windowBounds = this.mainWindow.getBounds();
                store.set('windowBounds', this.settings.windowBounds);
            }
        });

        this.mainWindow.on('move', () => {
            if (this.mainWindow) {
                this.settings.windowBounds = this.mainWindow.getBounds();
                store.set('windowBounds', this.settings.windowBounds);
            }
        });

        // Handle external links
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });

        // Create tray
        this.createTray();
        
        // Create menu
        this.createMenu();
    }

    createTray() {
        // Create tray icon
        const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray-icon.png'));
        this.tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show TaskFlow',
                click: () => {
                    this.showWindow();
                }
            },
            {
                label: 'New Task',
                click: () => {
                    this.showWindow();
                    // Send message to renderer to open new task form
                    this.mainWindow.webContents.send('tray-new-task');
                }
            },
            { type: 'separator' },
            {
                label: 'Settings',
                click: () => {
                    this.showWindow();
                    this.mainWindow.webContents.send('tray-settings');
                }
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => {
                    this.isQuitting = true;
                    app.quit();
                }
            }
        ]);

        this.tray.setContextMenu(contextMenu);
        this.tray.setToolTip('TaskFlow - Task Management');

        // Double click to show window
        this.tray.on('double-click', () => {
            this.showWindow();
        });
    }

    createMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Task',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => {
                            this.mainWindow.webContents.send('menu-new-task');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Import Tasks',
                        accelerator: 'CmdOrCtrl+I',
                        click: () => {
                            this.mainWindow.webContents.send('menu-import-tasks');
                        }
                    },
                    {
                        label: 'Export Tasks',
                        accelerator: 'CmdOrCtrl+E',
                        click: () => {
                            this.mainWindow.webContents.send('menu-export-tasks');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Exit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => {
                            this.isQuitting = true;
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Edit',
                submenu: [
                    { role: 'undo' },
                    { role: 'redo' },
                    { type: 'separator' },
                    { role: 'cut' },
                    { role: 'copy' },
                    { role: 'paste' },
                    { role: 'selectall' }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            },
            {
                label: 'Tasks',
                submenu: [
                    {
                        label: 'All Tasks',
                        accelerator: 'CmdOrCtrl+1',
                        click: () => {
                            this.mainWindow.webContents.send('menu-filter-tasks', 'all');
                        }
                    },
                    {
                        label: 'Pending Tasks',
                        accelerator: 'CmdOrCtrl+2',
                        click: () => {
                            this.mainWindow.webContents.send('menu-filter-tasks', 'pending');
                        }
                    },
                    {
                        label: 'Completed Tasks',
                        accelerator: 'CmdOrCtrl+3',
                        click: () => {
                            this.mainWindow.webContents.send('menu-filter-tasks', 'completed');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Toggle Theme',
                        accelerator: 'CmdOrCtrl+T',
                        click: () => {
                            this.mainWindow.webContents.send('menu-toggle-theme');
                        }
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About TaskFlow',
                        click: () => {
                            dialog.showMessageBox(this.mainWindow, {
                                type: 'info',
                                title: 'About TaskFlow',
                                message: 'TaskFlow Desktop v1.0.0',
                                detail: 'Advanced Task Management Application\n\nBuilt with Electron and modern web technologies.\n\n© 2024 TaskFlow Team'
                            });
                        }
                    },
                    {
                        label: 'Keyboard Shortcuts',
                        click: () => {
                            this.mainWindow.webContents.send('menu-show-shortcuts');
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    showWindow() {
        if (this.mainWindow) {
            if (this.mainWindow.isMinimized()) {
                this.mainWindow.restore();
            }
            this.mainWindow.show();
            this.mainWindow.focus();
        }
    }

    showTrayNotification(message) {
        if (this.settings.showNotifications) {
            notifier.notify({
                title: 'TaskFlow',
                message: message,
                icon: path.join(__dirname, 'assets', 'icon.png'),
                sound: false
            });
        }
    }

    // IPC handlers
    setupIPC() {
        ipcMain.handle('get-settings', () => {
            return this.settings;
        });

        ipcMain.handle('set-setting', (event, key, value) => {
            this.settings[key] = value;
            store.set(key, value);
            return true;
        });

        ipcMain.handle('show-notification', (event, title, message) => {
            this.showTrayNotification(message);
        });

        ipcMain.handle('minimize-to-tray', () => {
            this.mainWindow.hide();
        });

        ipcMain.handle('show-window', () => {
            this.showWindow();
        });
    }
}

// App instance
const taskFlowApp = new TaskFlowApp();

// App event handlers
app.whenReady().then(async () => {
    await taskFlowApp.createWindow();
    taskFlowApp.setupIPC();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            taskFlowApp.createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    taskFlowApp.isQuitting = true;
});

// Handle app protocol for deep linking (optional)
app.setAsDefaultProtocolClient('taskflow');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, focus our window instead
        if (taskFlowApp.mainWindow) {
            if (taskFlowApp.mainWindow.isMinimized()) {
                taskFlowApp.mainWindow.restore();
            }
            taskFlowApp.mainWindow.focus();
        }
    });
}
