# 🚀 React Integration Setup Guide

This guide will help you integrate React.js into your existing TaskFlow project without breaking anything.

## 📋 Prerequisites

1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **WAMP/XAMPP** (already installed)
   - Your existing PHP + MySQL setup

## 🛠️ Installation Steps

### Step 1: Install Node.js Dependencies

```bash
# Navigate to the react folder
cd react

# Install React and build tools
npm install
```

### Step 2: Update Database Schema

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select your `taskflow` database
3. Go to **SQL** tab
4. Copy and paste the contents of `db/schema.sql`
5. Click **Go** to execute

This will create the `tasks` table for React integration.

### Step 3: Build React Components

```bash
# From the react folder
npm run build
```

This creates optimized React components in `js/react-build/`

### Step 4: Test the Integration

1. Open: `http://localhost/TaskFlow/react-demo.html`
2. You should see the React TodoList component working
3. Try adding, completing, and deleting tasks

## 🎯 How to Use React Components

### In Any HTML Page:

```html
<!-- Include React components -->
<script type="module" src="js/react-build/main.js"></script>

<!-- Container for React component -->
<div id="react-todo-container"></div>
```

### Available Components:

- **TodoList**: Full-featured task management
- More components can be added to `react/src/components/`

## 🔧 Development Workflow

### For Development:
```bash
cd react
npm run dev
```
- Starts Vite dev server on `http://localhost:3000`
- Hot reload for instant updates
- Source maps for debugging

### For Production:
```bash
cd react
npm run build
```
- Creates optimized, minified files
- Ready for production deployment

## 📁 Project Structure

```
TaskFlow/
├── react/                    # React source code
│   ├── src/
│   │   ├── components/
│   │   │   └── TodoList.jsx  # React components
│   │   └── main.jsx          # Entry point
│   ├── package.json          # Dependencies
│   └── vite.config.js        # Build config
├── php/
│   └── tasks-api.php         # PHP API
├── js/
│   └── react-build/          # Built React files
├── react-demo.html           # Demo page
└── build-react.bat           # Windows build script
```

## 🔌 API Integration

### PHP API Endpoints:

- **GET** `/api/tasks.php` - Get all tasks
- **POST** `/api/tasks.php` - Add/update/delete tasks

### Example API Usage:

```javascript
// Get tasks
const response = await axios.get('/api/tasks.php');

// Add task
const response = await axios.post('/api/tasks.php', {
  action: 'add',
  title: 'New task'
});

// Toggle task
const response = await axios.post('/api/tasks.php', {
  action: 'toggle',
  id: taskId
});
```

## 🎨 Styling

React components use:
- **Styled JSX** for component-specific styles
- **Existing CSS** from your project
- **Responsive design** that works on all devices

## 🚨 Troubleshooting

### Common Issues:

1. **"npm not found"**
   - Install Node.js from https://nodejs.org/

2. **"Module not found"**
   - Run `npm install` in the react folder

3. **"API not working"**
   - Check that `tasks-api.php` is accessible
   - Verify database connection in `php/config.php`

4. **"React not loading"**
   - Make sure you ran `npm run build`
   - Check browser console for errors

### Debug Mode:

```bash
cd react
npm run dev
```
Then open `http://localhost:3000` for development with hot reload.

## 🎉 Next Steps

1. **Add More Components**: Create new React components in `react/src/components/`
2. **Extend API**: Add more endpoints in `php/tasks-api.php`
3. **Styling**: Customize component styles in the JSX files
4. **Testing**: Add unit tests for React components

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all prerequisites are installed
3. Make sure the database schema is updated
4. Ensure all files are in the correct locations

---

**Happy coding! 🚀**
