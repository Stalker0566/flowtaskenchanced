import React, { useState, useEffect } from 'react'
import axios from 'axios'

const TodoList = () => {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, active, completed
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  // Load tasks from PHP API
  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/tasks.php')
      if (response.data.success) {
        setTasks(response.data.tasks || [])
      }
    } catch (err) {
      console.error('Error loading tasks:', err)
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  // Add new task
  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    try {
      setLoading(true)
      const response = await axios.post('/api/tasks.php', {
        action: 'add',
        title: newTask.trim()
      })

      if (response.data.success) {
        setTasks(prev => [...prev, response.data.task])
        setNewTask('')
        setError('')
      } else {
        setError(response.data.message || 'Failed to add task')
      }
    } catch (err) {
      console.error('Error adding task:', err)
      setError('Failed to add task')
    } finally {
      setLoading(false)
    }
  }

  // Toggle task completion
  const toggleTask = async (taskId) => {
    try {
      const response = await axios.post('/api/tasks.php', {
        action: 'toggle',
        id: taskId
      })

      if (response.data.success) {
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, done: !task.done }
            : task
        ))
      }
    } catch (err) {
      console.error('Error toggling task:', err)
      setError('Failed to update task')
    }
  }

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      const response = await axios.post('/api/tasks.php', {
        action: 'delete',
        id: taskId
      })

      if (response.data.success) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
      }
    } catch (err) {
      console.error('Error deleting task:', err)
      setError('Failed to delete task')
    }
  }

  // Clear all tasks
  const clearAllTasks = async () => {
    if (!window.confirm('Are you sure you want to clear all tasks?')) return

    try {
      const response = await axios.post('/api/tasks.php', {
        action: 'clear'
      })

      if (response.data.success) {
        setTasks([])
      }
    } catch (err) {
      console.error('Error clearing tasks:', err)
      setError('Failed to clear tasks')
    }
  }

  // Edit task
  const startEditing = (task) => {
    setEditingId(task.id)
    setEditText(task.title)
  }

  const saveEdit = async (taskId) => {
    if (!editText.trim()) return

    try {
      const response = await axios.post('/api/tasks.php', {
        action: 'edit',
        id: taskId,
        title: editText.trim()
      })

      if (response.data.success) {
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, title: editText.trim() }
            : task
        ))
        setEditingId(null)
        setEditText('')
      }
    } catch (err) {
      console.error('Error editing task:', err)
      setError('Failed to edit task')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'active':
        return !task.done
      case 'completed':
        return task.done
      default:
        return true
    }
  })

  // Clear completed tasks
  const clearCompleted = async () => {
    try {
      const response = await axios.post('/api/tasks.php', {
        action: 'clear_completed'
      })

      if (response.data.success) {
        setTasks(prev => prev.filter(task => !task.done))
      }
    } catch (err) {
      console.error('Error clearing completed tasks:', err)
      setError('Failed to clear completed tasks')
    }
  }

  // Load tasks on component mount
  useEffect(() => {
    loadTasks()
  }, [])

  // Calculate statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.done).length

  return (
    <div className="react-todo-container">
      <style jsx>{`
        .react-todo-container {
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Inter', sans-serif;
        }
        
        .todo-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          color: white;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        .todo-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .todo-subtitle {
          font-size: 16px;
          margin: 0;
          opacity: 0.9;
        }
        
        .todo-form {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .todo-input {
          flex: 1;
          padding: 16px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: #fafbfc;
        }
        
        .todo-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
          background: white;
        }
        
        .todo-button {
          padding: 16px 28px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        }
        
        .todo-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
        }
        
        .todo-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .todo-filters {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          justify-content: center;
        }
        
        .filter-button {
          padding: 10px 20px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #6b7280;
        }
        
        .filter-button.active {
          background: #4f46e5;
          border-color: #4f46e5;
          color: white;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        }
        
        .filter-button:hover {
          border-color: #4f46e5;
          color: #4f46e5;
        }
        
        .filter-button.active:hover {
          color: white;
        }
        
        .todo-stats {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 24px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        
        .todo-stats-text {
          color: #374151;
          font-size: 16px;
          margin: 0;
          font-weight: 500;
        }
        
        .todo-list {
          list-style: none;
          padding: 0;
          margin: 0 0 30px 0;
        }
        
        .todo-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          margin-bottom: 12px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .todo-item:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .todo-item.completed {
          opacity: 0.7;
          background: #f8fafc;
        }
        
        .todo-checkbox {
          width: 24px;
          height: 24px;
          accent-color: #4f46e5;
          cursor: pointer;
          border-radius: 6px;
        }
        
        .todo-text {
          flex: 1;
          color: #374151;
          font-size: 16px;
          margin: 0;
          line-height: 1.5;
        }
        
        .todo-item.completed .todo-text {
          text-decoration: line-through;
          color: #9ca3af;
        }
        
        .todo-edit-input {
          flex: 1;
          padding: 8px 12px;
          border: 2px solid #4f46e5;
          border-radius: 8px;
          font-size: 16px;
          background: white;
        }
        
        .todo-actions {
          display: flex;
          gap: 8px;
        }
        
        .todo-edit, .todo-save, .todo-cancel {
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }
        
        .todo-edit {
          background: #3b82f6;
          color: white;
        }
        
        .todo-edit:hover {
          background: #2563eb;
          transform: scale(1.05);
        }
        
        .todo-save {
          background: #10b981;
          color: white;
        }
        
        .todo-save:hover {
          background: #059669;
          transform: scale(1.05);
        }
        
        .todo-cancel {
          background: #6b7280;
          color: white;
        }
        
        .todo-cancel:hover {
          background: #4b5563;
          transform: scale(1.05);
        }
        
        .todo-delete {
          padding: 8px 12px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }
        
        .todo-delete:hover {
          background: #dc2626;
          transform: scale(1.05);
        }
        
        .todo-bottom-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .todo-clear, .todo-clear-completed {
          padding: 12px 24px;
          background: transparent;
          color: #6b7280;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .todo-clear:hover {
          border-color: #ef4444;
          color: #ef4444;
          transform: translateY(-2px);
        }
        
        .todo-clear-completed:hover {
          border-color: #3b82f6;
          color: #3b82f6;
          transform: translateY(-2px);
        }
        
        .todo-error {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          color: #dc2626;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          border: 1px solid #fecaca;
          text-align: center;
          font-weight: 500;
        }
        
        .todo-loading {
          text-align: center;
          color: #6b7280;
          padding: 40px 20px;
          font-size: 16px;
        }
        
        .todo-empty {
          text-align: center;
          color: #9ca3af;
          padding: 60px 20px;
          font-size: 18px;
          background: white;
          border-radius: 16px;
          border: 2px dashed #e5e7eb;
        }
        
        .todo-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        @media (max-width: 640px) {
          .todo-form {
            flex-direction: column;
          }
          
          .todo-filters {
            flex-wrap: wrap;
          }
          
          .todo-item {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          
          .todo-actions {
            justify-content: center;
          }
          
          .todo-bottom-actions {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>

      <div className="todo-header">
        <h1 className="todo-title">✨ Enhanced Todo List</h1>
        <p className="todo-subtitle">Modern React + PHP + MySQL Integration</p>
      </div>

      {error && (
        <div className="todo-error">
          {error}
        </div>
      )}

      <form onSubmit={addTask} className="todo-form">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="What needs to be done?"
          className="todo-input"
          disabled={loading}
        />
        <button 
          type="submit" 
          className="todo-button"
          disabled={loading || !newTask.trim()}
        >
          {loading ? 'Adding...' : '➕ Add Task'}
        </button>
      </form>

      {tasks.length > 0 && (
        <div className="todo-filters">
          <button 
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({totalTasks})
          </button>
          <button 
            className={`filter-button ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({totalTasks - completedTasks})
          </button>
          <button 
            className={`filter-button ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedTasks})
          </button>
        </div>
      )}

      <div className="todo-stats">
        <p className="todo-stats-text">
          📊 {totalTasks} total • ✅ {completedTasks} completed • ⏳ {totalTasks - completedTasks} active
        </p>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="todo-loading">
          🔄 Loading tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="todo-empty">
          <div className="todo-empty-icon">📝</div>
          {filter === 'all' ? 'No tasks yet. Add your first one above!' : 
           filter === 'active' ? 'No active tasks. Great job!' : 
           'No completed tasks yet.'}
        </div>
      ) : (
        <ul className="todo-list">
          {filteredTasks.map(task => (
            <li 
              key={task.id} 
              className={`todo-item ${task.done ? 'completed' : ''}`}
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className="todo-checkbox"
              />
              
              {editingId === task.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="todo-edit-input"
                  onKeyPress={(e) => e.key === 'Enter' && saveEdit(task.id)}
                  autoFocus
                />
              ) : (
                <p className="todo-text">{task.title}</p>
              )}
              
              <div className="todo-actions">
                {editingId === task.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(task.id)}
                      className="todo-save"
                    >
                      💾 Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="todo-cancel"
                    >
                      ❌ Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditing(task)}
                      className="todo-edit"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="todo-delete"
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {tasks.length > 0 && (
        <div className="todo-bottom-actions">
          {completedTasks > 0 && (
            <button 
              onClick={clearCompleted}
              className="todo-clear-completed"
              disabled={loading}
            >
              🧹 Clear Completed ({completedTasks})
            </button>
          )}
          <button 
            onClick={clearAllTasks}
            className="todo-clear"
            disabled={loading}
          >
            🗑️ Clear All Tasks
          </button>
        </div>
      )}
    </div>
  )
}

export default TodoList
