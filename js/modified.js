document.addEventListener('DOMContentLoaded', function() {
    // App state
    const state = {
        tasks: [],
        stats: {
            total: 0,
            completed: 0,
            active: 0,
            progressPercentage: 0
        },
        filter: 'all',
        category: '',
        sort: 'createdAt',
        editingTask: null
    };

    // DOM Elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskDescription = document.getElementById('task-description');
    const categorySelect = document.getElementById('category-select');
    const prioritySelect = document.getElementById('priority-select');
    const dueDateInput = document.getElementById('due-date');
    const colorInput = document.getElementById('color-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const updateTaskBtn = document.getElementById('update-task-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const tasksContainer = document.getElementById('tasks-container');
    const statusFilter = document.getElementById('status-filter');
    const categoryFilter = document.getElementById('category-filter');
    const sortSelect = document.getElementById('sort-select');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressBar = document.getElementById('progress-bar');
    const totalTasksCount = document.getElementById('total-tasks');
    const completedTasksCount = document.getElementById('completed-tasks');
    const activeTasksCount = document.getElementById('active-tasks');

    
  function validateTaskData(taskData) {
    if (!taskData.title.trim()) {
      alert("Nama tugas tidak boleh kosong.");
      return false;
    }
    if (!taskData.category || taskData.category.trim() === "") {
      alert("Silakan pilih kategori tugas.");
      return false;
    }
    if (!taskData.priority || taskData.priority.trim() === "") {
      alert("Silakan pilih prioritas tugas.");
      return false;
    }
    return true;
  }

  function toggleVisibility(el, show) {
    el.classList.toggle("hidden", !show);
  }

  // Initialize app
    function init() {
        fetchTasks();
        setupEventListeners();
    }

    // Event listeners
    function setupEventListeners() {
        // Form submission
        taskForm.addEventListener('submit', handleFormSubmit);
        
        // Filter and sorting
        statusFilter.addEventListener('change', handleStatusFilterChange);
        categoryFilter.addEventListener('change', handleCategoryFilterChange);
        sortSelect.addEventListener('change', handleSortChange);
        
        // Edit mode buttons
        updateTaskBtn.addEventListener('click', handleUpdateTask);
        cancelEditBtn.addEventListener('click', cancelEditMode);
    }

    // Handle form submission (create or update)
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // If in edit mode, the update button will handle it separately
        if (state.editingTask) return;
        
        // Gather form data
        const taskData = {
            title: taskInput.value.trim(),
            description: taskDescription.value.trim(),
            category: categorySelect.value,
            priority: prioritySelect.value,
            dueDate: dueDateInput.value,
            color: colorInput.value || 'gray'
        };
        
        // Validate title
        if (!taskData.title) {
            alert('Please enter a task title');
            return;
        }
        
        // Create task via API
        createTask(taskData);
    }

    // Handle status filter change
    function handleStatusFilterChange(e) {
        state.filter = e.target.value;
        fetchTasks();
    }

    // Handle category filter change
    function handleCategoryFilterChange(e) {
        state.category = e.target.value;
        fetchTasks();
    }

    // Handle sort change
    function handleSortChange(e) {
        state.sort = e.target.value;
        fetchTasks();
    }

    // Enter edit mode for a task
    function enterEditMode(task) {
        state.editingTask = task;
        
        // Fill form with task data
        taskInput.value = task.title;
        taskDescription.value = task.description || '';
        categorySelect.value = task.category || '';
        prioritySelect.value = task.priority || '';
        dueDateInput.value = task.dueDate || '';
        colorInput.value = task.color || 'gray';
        
        // Show update buttons, hide add button
        addTaskBtn.classList.add('hidden');
        updateTaskBtn.classList.remove('hidden');
        cancelEditBtn.classList.remove('hidden');
        
        // Scroll to form
        taskForm.scrollIntoView({ behavior: 'smooth' });
    }

    // Cancel edit mode
    function cancelEditMode() {
        state.editingTask = null;
        
        // Reset form
        taskForm.reset();
        
        // Hide update buttons, show add button
        addTaskBtn.classList.remove('hidden');
        updateTaskBtn.classList.add('hidden');
        cancelEditBtn.classList.add('hidden');
    }

    // Handle update task
    function handleUpdateTask(e) {
        e.preventDefault();
        
        if (!state.editingTask) return;
        
        // Gather form data
        const taskData = {
            id: state.editingTask.id,
            title: taskInput.value.trim(),
            description: taskDescription.value.trim(),
            category: categorySelect.value,
            priority: prioritySelect.value,
            dueDate: dueDateInput.value,
            color: colorInput.value || 'gray',
            completed: state.editingTask.completed
        };
        
        // Validate title
        if (!taskData.title) {
            alert('Please enter a task title');
            return;
        }
        
        // Update task via API
        updateTask(taskData);
        
        // Exit edit mode
        cancelEditMode();
    }

    // API Functions
    // Fetch tasks from API
    function fetchTasks() {
        // Show loading state
        tasksContainer.innerHTML = `
      <div class="text-center py-4">
        <svg class="animate-spin h-5 w-5 mx-auto text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        <p class="mt-2 text-sm text-gray-500">Memuat tugas...</p>
      </div>`;
        
        // Build API URL with filters and sorting
        const url = `api.php?action=read&filter=${state.filter}&category=${state.category}&sort=${state.sort}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.status) {
                    // Update state
                    state.tasks = data.data.tasks;
                    state.stats = data.data.stats;
                    
                    // Update UI
                    renderTasks();
                    updateStats();
                } else {
                    console.error('Error fetching tasks:', data.message);
                    tasksContainer.innerHTML = `<div class="text-center py-4 text-red-500">Error: ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('Error fetching tasks:', error);
                tasksContainer.innerHTML = `<div class="text-center py-4 text-red-500">Error: ${error.message}</div>`;
            });
    }

    // Create a new task
    function createTask(taskData) {
        fetch('api.php?action=create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status) {
                // Reset form
                taskForm.reset();
                
                // Refresh task list
                fetchTasks();
            } else {
                console.error('Error creating task:', data.message);
                alert(`Error creating task: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error creating task:', error);
            alert(`Error creating task: ${error.message}`);
        });
    }

    // Update an existing task
    function updateTask(taskData) {
        fetch('api.php?action=update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status) {
                // Refresh task list
                fetchTasks();
            } else {
                console.error('Error updating task:', data.message);
                alert(`Error updating task: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error updating task:', error);
            alert(`Error updating task: ${error.message}`);
        });
    }

    // Toggle task completion status
    function toggleTaskCompletion(taskId) {
        fetch('api.php?action=update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: taskId,
                toggleComplete: true
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status) {
                // Refresh task list
                fetchTasks();
            } else {
                console.error('Error toggling task completion:', data.message);
            }
        })
        .catch(error => {
            console.error('Error toggling task completion:', error);
        });
    }

    // Delete a task
    function deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
        
        fetch('api.php?action=delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: taskId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status) {
                // Refresh task list
                fetchTasks();
            } else {
                console.error('Error deleting task:', data.message);
                alert(`Error deleting task: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error deleting task:', error);
            alert(`Error deleting task: ${error.message}`);
        });
    }

    // UI Functions
    // Render tasks in the container
    function renderTasks() {
        if (state.tasks.length === 0) {
            tasksContainer.innerHTML = '<div class="text-center py-8 text-gray-500">No tasks found. Add a new task to get started!</div>';
            return;
        }
        
        // Clear container
        tasksContainer.innerHTML = '';
        
        // Create task elements
        state.tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            tasksContainer.appendChild(taskElement);
        });
    }

    // Create a single task element
    function createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-item p-4 mb-3 rounded-lg shadow border-l-4 ${task.completed ? 'bg-gray-50' : 'bg-white'}`;
        taskEl.style.borderLeftColor = task.color || 'gray';
        
        // Format due date if exists
        let dueDateFormatted = '';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            dueDateFormatted = dueDate.toLocaleDateString();
        }
        
        // Category label
        let categoryLabel = '';
        if (task.category) {
            const categoryColors = {
                'work': 'bg-blue-100 text-blue-800',
                'personal': 'bg-purple-100 text-purple-800',
                'shopping': 'bg-green-100 text-green-800',
                'health': 'bg-red-100 text-red-800'
            };
            
            const categoryColor = categoryColors[task.category] || 'bg-gray-100 text-gray-800';
            categoryLabel = `<span class="category-badge ${categoryColor} text-xs px-2 py-1 rounded-full mr-2">${task.category}</span>`;
        }
        
        // Priority label
        let priorityLabel = '';
        if (task.priority) {
            const priorityColors = {
                'high': 'bg-red-100 text-red-800',
                'medium': 'bg-yellow-100 text-yellow-800',
                'low': 'bg-green-100 text-green-800'
            };
            
            const priorityColor = priorityColors[task.priority] || 'bg-gray-100 text-gray-800';
            priorityLabel = `<span class="priority-badge ${priorityColor} text-xs px-2 py-1 rounded-full">${task.priority}</span>`;
        }
        
        // Task content HTML
        taskEl.innerHTML = `
            <div class="flex items-start">
                <div class="mr-3 pt-1">
                    <input type="checkbox" class="task-checkbox w-5 h-5 rounded" ${task.completed ? 'checked' : ''}>
                </div>
                <div class="flex-grow">
                    <h3 class="task-title text-lg font-medium ${task.completed ? 'line-through text-gray-500' : ''}">${task.title}</h3>
                    <p class="task-description text-gray-600 mt-1">${task.description || ''}</p>
                    <div class="flex flex-wrap items-center mt-2">
                        ${categoryLabel}
                        ${priorityLabel}
                        ${task.dueDate ? `<span class="due-date text-xs text-gray-500 ml-2">Due: ${dueDateFormatted}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions ml-4 flex space-x-2">
                    <button class="edit-task-btn p-1 text-blue-500 hover:text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button class="delete-task-btn p-1 text-red-500 hover:text-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const checkbox = taskEl.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => {
            toggleTaskCompletion(task.id);
        });
        
        const editBtn = taskEl.querySelector('.edit-task-btn');
        editBtn.addEventListener('click', () => {
            enterEditMode(task);
        });
        
        const deleteBtn = taskEl.querySelector('.delete-task-btn');
        deleteBtn.addEventListener('click', () => {
            deleteTask(task.id);
        });
        
        return taskEl;
    }

    // Update statistics display
    function updateStats() {
        const stats = state.stats;
        
        // Update counts
        totalTasksCount.textContent = stats.total;
        completedTasksCount.textContent = stats.completed;
        activeTasksCount.textContent = stats.active;
        
        // Update progress
        progressPercentage.textContent = `${stats.progressPercentage}%`;
        progressBar.style.width = `${stats.progressPercentage}%`;
        
        // Update progress circle (if using circle)
        const progressCircle = document.getElementById('progress-circle');
        if (progressCircle) {
            const radius = 60;
            const circumference = 2 * Math.PI * radius;
            const dashoffset = circumference * (1 - stats.progressPercentage / 100);
            progressCircle.style.strokeDasharray = circumference;
            progressCircle.style.strokeDashoffset = dashoffset;
        }
    }

    // Initialize the app
    init();
});
