// TaskFlow Desktop Integration
// Handles desktop-specific features and Electron API integration

class TaskFlowDesktop {
    constructor() {
        this.isElectron = typeof window.electronAPI !== 'undefined';
        this.settings = {};
        this.init();
    }

    async init() {
        if (this.isElectron) {
            console.log('TaskFlow Desktop initialized');
            await this.loadSettings();
            this.setupDesktopFeatures();
            this.setupKeyboardShortcuts();
            this.setupMenuHandlers();
            this.setupTrayHandlers();
        } else {
            console.log('Running in browser mode');
        }
    }

    async loadSettings() {
        if (this.isElectron) {
            try {
                this.settings = await window.electronAPI.getSettings();
                console.log('Desktop settings loaded:', this.settings);
            } catch (error) {
                console.error('Failed to load desktop settings:', error);
            }
        }
    }

    setupDesktopFeatures() {
        // Add desktop-specific UI elements
        this.addDesktopIndicators();
        this.setupSystemNotifications();
        this.setupAutoStart();
    }

    addDesktopIndicators() {
        // Add desktop-specific indicators to the UI
        const header = document.querySelector('.tasks-title');
        if (header) {
            header.innerHTML = '<i class="fas fa-desktop"></i> TaskFlow Desktop';
        }

        // Add desktop feature badges
        this.addFeatureBadges();
    }

    addFeatureBadges() {
        const featuresContainer = document.querySelector('.desktop-features');
        if (featuresContainer) {
            const featureGrid = featuresContainer.querySelector('.feature-grid');
            if (featureGrid) {
                // Add feature cards dynamically
                const features = [
                    {
                        icon: 'fas fa-bell',
                        title: 'System Notifications',
                        description: 'Get notified about task deadlines and updates'
                    },
                    {
                        icon: 'fas fa-tray',
                        title: 'System Tray',
                        description: 'Minimize to tray and quick access'
                    },
                    {
                        icon: 'fas fa-keyboard',
                        title: 'Keyboard Shortcuts',
                        description: 'Powerful shortcuts for productivity'
                    },
                    {
                        icon: 'fas fa-sync',
                        title: 'Auto Sync',
                        description: 'Automatic data synchronization'
                    }
                ];

                features.forEach(feature => {
                    const card = document.createElement('div');
                    card.className = 'feature-card';
                    card.innerHTML = `
                        <i class="${feature.icon}"></i>
                        <h4>${feature.title}</h4>
                        <p>${feature.description}</p>
                    `;
                    featureGrid.appendChild(card);
                });
            }
        }
    }

    setupSystemNotifications() {
        // Override the existing notification system to use desktop notifications
        if (this.isElectron && window.electronAPI.showNotification) {
            // Store original notification function
            this.originalShowNotification = window.showNotification;
            
            // Override with desktop notifications
            window.showNotification = (title, message, type = 'info') => {
                this.showDesktopNotification(title, message, type);
            };
        }
    }

    async showDesktopNotification(title, message, type = 'info') {
        if (this.isElectron) {
            try {
                await window.electronAPI.showNotification(title, message);
            } catch (error) {
                console.error('Failed to show desktop notification:', error);
                // Fallback to browser notification
                this.showBrowserNotification(title, message, type);
            }
        } else {
            this.showBrowserNotification(title, message, type);
        }
    }

    showBrowserNotification(title, message, type) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N - New Task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.focusNewTaskForm();
            }

            // Ctrl/Cmd + T - Toggle Theme
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }

            // Ctrl/Cmd + E - Export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportTasks();
            }

            // Ctrl/Cmd + I - Import
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.importTasks();
            }

            // Ctrl/Cmd + , - Settings
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                this.openSettings();
            }

            // Escape - Close modals
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    focusNewTaskForm() {
        const titleInput = document.getElementById('task-title');
        if (titleInput) {
            titleInput.focus();
            titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    toggleTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.click();
        }
    }

    exportTasks() {
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.click();
        }
    }

    importTasks() {
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.click();
        }
    }

    openSettings() {
        // Show desktop settings modal
        this.showDesktopSettings();
    }

    closeModals() {
        // Close any open modals
        const modals = document.querySelectorAll('.modal-overlay.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
    }

    setupMenuHandlers() {
        if (!this.isElectron) return;

        // Menu event handlers
        window.electronAPI.onMenuNewTask(() => {
            this.focusNewTaskForm();
        });

        window.electronAPI.onMenuImportTasks(() => {
            this.importTasks();
        });

        window.electronAPI.onMenuExportTasks(() => {
            this.exportTasks();
        });

        window.electronAPI.onMenuFilterTasks((event, filter) => {
            this.filterTasks(filter);
        });

        window.electronAPI.onMenuToggleTheme(() => {
            this.toggleTheme();
        });

        window.electronAPI.onMenuShowShortcuts(() => {
            this.showKeyboardShortcuts();
        });
    }

    setupTrayHandlers() {
        if (!this.isElectron) return;

        // Tray event handlers
        window.electronAPI.onTrayNewTask(() => {
            this.focusNewTaskForm();
        });

        window.electronAPI.onTraySettings(() => {
            this.openSettings();
        });
    }

    filterTasks(filter) {
        const filterBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (filterBtn) {
            filterBtn.click();
        }
    }

    showKeyboardShortcuts() {
        // Create shortcuts modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-icon">
                        <i class="fas fa-keyboard"></i>
                    </div>
                    <h3 class="modal-title">Keyboard Shortcuts</h3>
                </div>
                <div class="modal-description">
                    Here are all the available keyboard shortcuts for TaskFlow Desktop:
                </div>
                <div class="shortcuts-list">
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>N</kbd>
                        <span>New Task</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>T</kbd>
                        <span>Toggle Theme</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>E</kbd>
                        <span>Export Tasks</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>I</kbd>
                        <span>Import Tasks</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>,</kbd>
                        <span>Settings</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Esc</kbd>
                        <span>Close Modal</span>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button class="modal-btn modal-btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-check"></i> Got it!
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    showDesktopSettings() {
        // Create settings modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-icon">
                        <i class="fas fa-cog"></i>
                    </div>
                    <h3 class="modal-title">Desktop Settings</h3>
                </div>
                <div class="modal-description">
                    Configure TaskFlow Desktop preferences:
                </div>
                <div class="settings-form">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="autoStart" ${this.settings.autoStart ? 'checked' : ''}>
                            Start with Windows
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="minimizeToTray" ${this.settings.minimizeToTray ? 'checked' : ''}>
                            Minimize to System Tray
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="showNotifications" ${this.settings.showNotifications ? 'checked' : ''}>
                            Show Desktop Notifications
                        </label>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button class="modal-btn modal-btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="modal-btn modal-btn-primary" onclick="taskFlowDesktop.saveSettings()">
                        <i class="fas fa-save"></i> Save Settings
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async saveSettings() {
        if (!this.isElectron) return;

        const autoStart = document.getElementById('autoStart').checked;
        const minimizeToTray = document.getElementById('minimizeToTray').checked;
        const showNotifications = document.getElementById('showNotifications').checked;

        try {
            await window.electronAPI.setSetting('autoStart', autoStart);
            await window.electronAPI.setSetting('minimizeToTray', minimizeToTray);
            await window.electronAPI.setSetting('showNotifications', showNotifications);

            this.settings.autoStart = autoStart;
            this.settings.minimizeToTray = minimizeToTray;
            this.settings.showNotifications = showNotifications;

            this.showDesktopNotification('Settings', 'Settings saved successfully!', 'success');
            
            // Close modal
            const modal = document.querySelector('.modal-overlay.show');
            if (modal) {
                modal.remove();
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showDesktopNotification('Error', 'Failed to save settings', 'error');
        }
    }

    setupAutoStart() {
        // Check if app should start minimized
        if (this.settings.autoStart && this.isElectron) {
            // App started automatically, show notification
            setTimeout(() => {
                this.showDesktopNotification(
                    'TaskFlow Desktop',
                    'TaskFlow started automatically',
                    'info'
                );
            }, 1000);
        }
    }

    // Public methods for external access
    minimizeToTray() {
        if (this.isElectron && window.electronAPI.minimizeToTray) {
            window.electronAPI.minimizeToTray();
        }
    }

    showWindow() {
        if (this.isElectron && window.electronAPI.showWindow) {
            window.electronAPI.showWindow();
        }
    }
}

// Initialize desktop integration when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskFlowDesktop = new TaskFlowDesktop();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskFlowDesktop;
}
