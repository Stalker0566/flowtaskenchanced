const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
    
    // Notifications
    showNotification: (title, message) => ipcRenderer.invoke('show-notification', title, message),
    
    // Window controls
    minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
    showWindow: () => ipcRenderer.invoke('show-window'),
    
    // Menu events
    onMenuNewTask: (callback) => ipcRenderer.on('menu-new-task', callback),
    onMenuImportTasks: (callback) => ipcRenderer.on('menu-import-tasks', callback),
    onMenuExportTasks: (callback) => ipcRenderer.on('menu-export-tasks', callback),
    onMenuFilterTasks: (callback) => ipcRenderer.on('menu-filter-tasks', callback),
    onMenuToggleTheme: (callback) => ipcRenderer.on('menu-toggle-theme', callback),
    onMenuShowShortcuts: (callback) => ipcRenderer.on('menu-show-shortcuts', callback),
    
    // Tray events
    onTrayNewTask: (callback) => ipcRenderer.on('tray-new-task', callback),
    onTraySettings: (callback) => ipcRenderer.on('tray-settings', callback),
    
    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Desktop-specific enhancements
contextBridge.exposeInMainWorld('desktopAPI', {
    // Platform info
    platform: process.platform,
    isElectron: true,
    
    // Desktop features
    isOnline: () => navigator.onLine,
    
    // File system access (limited)
    openExternal: (url) => {
        // This will be handled by main process
        console.log('Opening external URL:', url);
    }
});
