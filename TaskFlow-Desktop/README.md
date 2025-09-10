# TaskFlow Desktop

A powerful desktop task management application built with Electron, featuring advanced productivity tools and seamless desktop integration.

## 🚀 Features

### Core Task Management
- ✅ Create, edit, and delete tasks
- 🏷️ Categorize tasks (Work, Personal, Shopping, etc.)
- ⚡ Priority levels (Low, Medium, High)
- 📅 Due dates and deadlines
- 📝 Rich task descriptions
- 🏷️ Custom tags

### Advanced Features
- 🔄 Drag-to-complete functionality
- ↩️ Undo after deletion
- 📊 Progress tracking and statistics
- 🎨 Dark/Light theme support
- 🔍 Advanced filtering and sorting
- 📤 Import/Export JSON
- 🗂️ Archive completed tasks

### Desktop Integration
- 🖥️ Native Windows application
- 🔔 System notifications
- 📋 System tray integration
- ⌨️ Keyboard shortcuts
- 🚀 Auto-start with Windows
- 💾 Persistent settings
- 🔄 Automatic data sync

### Multi-User Support
- 👥 User registration and login
- 🏢 Team collaboration
- 📤 Task sharing
- 🔐 Secure authentication

### Integrations
- 📅 Google Calendar sync
- 📧 Email notifications
- ☁️ Firebase synchronization

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Windows 10/11

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TaskFlow-Desktop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

### Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Create Windows installer**
   ```bash
   npm run dist
   ```

3. **Find the installer**
   - The installer will be created in the `dist/` folder
   - Look for `TaskFlow Setup.exe`

## 🎯 Usage

### Getting Started

1. **Launch TaskFlow Desktop**
   - Double-click the desktop shortcut
   - Or find it in your Start Menu

2. **Create your first task**
   - Click "Add Task" or press `Ctrl+N`
   - Fill in the task details
   - Click "Add Task" to save

3. **Manage tasks**
   - Drag tasks right to complete them
   - Use filters to organize your view
   - Export/import your data

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Task |
| `Ctrl+T` | Toggle Theme |
| `Ctrl+E` | Export Tasks |
| `Ctrl+I` | Import Tasks |
| `Ctrl+,` | Settings |
| `Esc` | Close Modal |

### System Tray

- **Right-click** the TaskFlow icon in the system tray
- **Double-click** to show the main window
- **Quick actions** available in the context menu

## ⚙️ Configuration

### Settings

Access settings through:
- Menu: `File > Settings`
- Keyboard: `Ctrl+,`
- Tray: Right-click > Settings

### Available Settings

- **Start with Windows**: Automatically launch TaskFlow when Windows starts
- **Minimize to Tray**: Close button minimizes to system tray instead of quitting
- **Show Notifications**: Enable desktop notifications for task reminders

## 🔧 Development

### Project Structure

```
TaskFlow-Desktop/
├── main.js                 # Electron main process
├── preload.js             # Preload script for security
├── package.json           # Dependencies and scripts
├── web/                   # Web application files
│   ├── index.html        # Main HTML file
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript modules
│   └── php/              # Backend API (if needed)
└── assets/               # Icons and resources
```

### Key Files

- **main.js**: Electron main process, handles window creation and system integration
- **preload.js**: Secure bridge between main and renderer processes
- **web/js/desktop-integration.js**: Desktop-specific features and Electron API integration
- **web/js/advanced-tasks.js**: Core task management functionality

### Adding Features

1. **Desktop Features**: Add to `desktop-integration.js`
2. **Task Management**: Modify `advanced-tasks.js`
3. **UI Components**: Update HTML and CSS files
4. **System Integration**: Extend `main.js` and `preload.js`

## 🐛 Troubleshooting

### Common Issues

**App won't start**
- Check if Node.js is installed
- Run `npm install` to ensure dependencies are installed
- Check console for error messages

**Notifications not working**
- Check Windows notification settings
- Ensure TaskFlow has notification permissions
- Verify settings in the app

**Tasks not saving**
- Check if the app has write permissions
- Verify database connection (if using external DB)
- Check console for API errors

### Getting Help

1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure Windows permissions are correct
4. Check the GitHub issues page

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🎉 Acknowledgments

- Built with [Electron](https://electronjs.org/)
- UI components with [Font Awesome](https://fontawesome.com/)
- Styling with modern CSS and glassmorphism effects
- Task management inspired by modern productivity apps

---

**TaskFlow Desktop** - Making productivity beautiful and efficient! 🚀
