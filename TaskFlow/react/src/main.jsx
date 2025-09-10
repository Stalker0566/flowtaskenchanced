import React from 'react'
import ReactDOM from 'react-dom/client'
import TodoList from './components/TodoList.jsx'

// Initialize React components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize TodoList React component
  const todoContainer = document.getElementById('react-todo-container')
  if (todoContainer) {
    const root = ReactDOM.createRoot(todoContainer)
    root.render(<TodoList />)
  }
})

// Export components for global access
window.TaskFlowReact = {
  TodoList
}
