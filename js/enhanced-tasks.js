/**
 * Enhanced Tasks Manager
 * Features: Drag & Drop, Progress Bar, Animations, Categories, Priorities, Deadlines
 */

class EnhancedTaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentView = 'list';
        this.draggedElement = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadTasks();
        this.setupDragAndDrop();
    }
    
    setupEventListeners() {
        // Form submission - check for both form IDs
        const taskForm = document.getElementById('task-form') || document.getElementById('enhanced-task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
            console.log('Task form found and event listener added');
        } else {
            console.warn('Task form not found. Make sure the form has id="task-form" or id="enhanced-task-form"');
        }
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        // View buttons (removed since we deleted them from HTML)
        // document.querySelectorAll('.view-btn').forEach(btn => {
        //     btn.addEventListener('click', (e) => this.setView(e.target.dataset.view));
        // });
    }
    
    setupDragAndDrop() {
        const tasksList = document.getElementById('tasks-list');
        
        // Make tasks draggable
        tasksList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                this.draggedElement = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });
        
        tasksList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
                this.draggedElement = null;
            }
        });
        
        tasksList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = this.getDragAfterElement(tasksList, e.clientY);
            const dragging = document.querySelector('.dragging');
            
            if (afterElement == null) {
                tasksList.appendChild(dragging);
            } else {
                tasksList.insertBefore(dragging, afterElement);
            }
        });
        
        tasksList.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedElement) {
                this.updateTaskOrder();
            }
        });
    }
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    async loadTasks() {
        try {
            const response = await fetch('php/tasks-api.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.tasks = result.tasks || [];
                this.renderTasks();
                this.updateStatistics();
                this.updateProgressBar();
            } else {
                this.showError('Failed to load tasks: ' + result.message);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError('Failed to load tasks. Please check if the server is running.');
        }
    }
    
    async handleAddTask(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const title = formData.get('title');
        
        // Validate required fields
        if (!title || title.trim() === '') {
            this.showError('Task title is required!');
            return;
        }
        
        const taskData = {
            action: 'add',
            title: title.trim(),
            description: formData.get('description') || '',
            priority: formData.get('priority') || 'medium',
            category: formData.get('category') || 'general',
            due_date: formData.get('due_date') || null,
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag) : []
        };
        
        console.log('Adding task:', taskData);
        
        try {
            const response = await fetch('php/tasks-api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Add the new task to the beginning of the list
                if (result.task) {
                    this.tasks.unshift(result.task);
                }
                
                // Refresh the display
                this.renderTasks();
                this.updateStatistics();
                this.updateProgressBar();
                
                // Clear the form
                e.target.reset();
                
                // Show success message
                this.showSuccess('Task added successfully!');
                
                console.log('Task added successfully:', result.task);
            } else {
                this.showError('Failed to add task: ' + result.message);
            }
        } catch (error) {
            console.error('Error adding task:', error);
            this.showError('Failed to add task. Please check if the server is running.');
        }
    }
    
    async toggleTask(taskId) {
        try {
            const response = await fetch('php/tasks-api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'toggle',
                    id: taskId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const task = this.tasks.find(t => t.id == taskId);
                if (task) {
                    task.done = !task.done;
                    task.completed_at = task.done ? new Date().toISOString() : null;
                }
                this.renderTasks();
                this.updateStatistics();
                this.updateProgressBar();
            } else {
                this.showError('Failed to toggle task: ' + result.message);
            }
        } catch (error) {
            console.error('Error toggling task:', error);
            this.showError('Failed to toggle task');
        }
    }
    
    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
        
        try {
            const response = await fetch('php/tasks-api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    id: taskId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.tasks = this.tasks.filter(t => t.id != taskId);
                this.renderTasks();
                this.updateStatistics();
                this.updateProgressBar();
                this.showSuccess('Task deleted successfully!');
            } else {
                this.showError('Failed to delete task: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            this.showError('Failed to delete task');
        }
    }
    
    async updateTask(taskId, updates) {
        try {
            const response = await fetch('php/tasks-api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update',
                    id: taskId,
                    ...updates
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const taskIndex = this.tasks.findIndex(t => t.id == taskId);
                if (taskIndex !== -1) {
                    this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
                }
                this.renderTasks();
                this.updateStatistics();
                this.updateProgressBar();
                this.showSuccess('Task updated successfully!');
            } else {
                this.showError('Failed to update task: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating task:', error);
            this.showError('Failed to update task');
        }
    }
    
    async updateTaskOrder() {
        const taskItems = document.querySelectorAll('.task-item');
        const taskOrders = Array.from(taskItems).map((item, index) => ({
            id: parseInt(item.dataset.taskId),
            sort_order: index + 1
        }));
        
        try {
            const response = await fetch('php/tasks-api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'reorder',
                    task_orders: taskOrders
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update local task order
                taskOrders.forEach(order => {
                    const task = this.tasks.find(t => t.id == order.id);
                    if (task) {
                        task.sort_order = order.sort_order;
                    }
                });
                this.showSuccess('Tasks reordered successfully!');
            } else {
                this.showError('Failed to reorder tasks: ' + result.message);
            }
        } catch (error) {
            console.error('Error reordering tasks:', error);
            this.showError('Failed to reorder tasks');
        }
    }
    
    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        const emptyState = document.getElementById('empty-state');
        
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            tasksList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        tasksList.style.display = 'block';
        emptyState.style.display = 'none';
        
        // Sort tasks by sort_order
        const sortedTasks = [...filteredTasks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        
        tasksList.innerHTML = sortedTasks.map(task => this.createTaskHTML(task)).join('');
        
        // Add event listeners to new task items
        this.attachTaskEventListeners();
    }
    
    createTaskHTML(task) {
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.done;
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : null;
        
        return `
            <div class="task-item ${task.done ? 'completed' : ''} ${task.priority}-priority animate-in" 
                 data-task-id="${task.id}" 
                 draggable="true">
                <div class="task-header">
                    <input type="checkbox" 
                           class="task-checkbox" 
                           ${task.done ? 'checked' : ''} 
                           onchange="taskManager.toggleTask(${task.id})">
                    <div class="task-content">
                        <h3 class="task-title" contenteditable="true" 
                            onblur="taskManager.updateTask(${task.id}, {title: this.textContent})">
                            ${this.escapeHtml(task.title)}
                        </h3>
                        ${task.description ? `
                            <p class="task-description" contenteditable="true" 
                               onblur="taskManager.updateTask(${task.id}, {description: this.textContent})">
                                ${this.escapeHtml(task.description)}
                            </p>
                        ` : ''}
                        <div class="task-meta">
                            <span class="task-category">
                                <i class="fas fa-tag"></i>
                                ${this.escapeHtml(task.category)}
                            </span>
                            <span class="task-priority ${task.priority}">
                                <i class="fas fa-flag"></i>
                                ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                            ${dueDate ? `
                                <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                                    <i class="fas fa-calendar"></i>
                                    ${dueDate}
                                </span>
                            ` : ''}
                        </div>
                        ${task.tags && task.tags.length > 0 ? `
                            <div class="task-tags">
                                ${task.tags.map(tag => `
                                    <span class="task-tag">#${this.escapeHtml(tag)}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit" 
                            onclick="taskManager.editTask(${task.id})" 
                            title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn complete" 
                            onclick="taskManager.toggleTask(${task.id})" 
                            title="${task.done ? 'Mark as Incomplete' : 'Mark as Complete'}">
                        <i class="fas fa-${task.done ? 'undo' : 'check'}"></i>
                    </button>
                    <button class="task-action-btn delete" 
                            onclick="taskManager.deleteTask(${task.id})" 
                            title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    attachTaskEventListeners() {
        // Additional event listeners can be added here if needed
    }
    
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'pending':
                return this.tasks.filter(task => !task.done);
            case 'completed':
                return this.tasks.filter(task => task.done);
            case 'high':
                return this.tasks.filter(task => task.priority === 'high');
            default:
                return this.tasks;
        }
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }
    
    // setView method removed since we deleted the view buttons
    
    updateStatistics() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.done).length;
        const pendingTasks = totalTasks - completedTasks;
        const urgentTasks = this.tasks.filter(task => task.priority === 'high' && !task.done).length;
        
        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('pending-tasks').textContent = pendingTasks;
        document.getElementById('urgent-tasks').textContent = urgentTasks;
        
        // Update task counter
        document.getElementById('task-counter-text').textContent = 
            `${completedTasks} of ${totalTasks} tasks completed`;
    }
    
    updateProgressBar() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.done).length;
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        document.getElementById('progress-percentage').textContent = `${percentage}%`;
        document.getElementById('progress-fill').style.width = `${percentage}%`;
    }
    
    editTask(taskId) {
        // This could open a modal or inline editor
        // For now, we'll just focus on the title field
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const titleElement = taskElement.querySelector('.task-title');
        titleElement.focus();
        titleElement.select();
    }
    
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showMessage(message, type) {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        if (type === 'success') {
            messageEl.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        } else {
            messageEl.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        }
        
        document.body.appendChild(messageEl);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new EnhancedTaskManager();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
