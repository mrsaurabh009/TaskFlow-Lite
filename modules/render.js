/**
 * Render Module - DOM rendering and manipulation functions
 * Handles efficient rendering with performance optimization
 */

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export const escapeHTML = (str) => {
    if (typeof str !== 'string') return '';
    
    return str.replace(/[&<>"']/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[tag]));
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
const formatDate = (dateString) => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return minutes <= 1 ? 'just now' : `${minutes} minutes ago`;
            }
            return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        }
        
        if (days === 1) return 'yesterday';
        if (days < 7) return `${days} days ago`;
        
        return date.toLocaleDateString();
    } catch (error) {
        return 'unknown';
    }
};

/**
 * Create task element HTML
 * @param {Object} task - Task object
 * @returns {string} - HTML string
 */
const createTaskHTML = (task) => {
    const escapedText = escapeHTML(task.text);
    const formattedDate = formatDate(task.createdAt);
    const completedClass = task.completed ? 'completed' : '';
    const checkedAttribute = task.completed ? 'checked' : '';
    
    return `
        <li class="task ${completedClass}" data-id="${task.id}">
            <label class="task-checkbox-label">
                <input type="checkbox" class="task-checkbox" ${checkedAttribute}>
                <span class="task-content">
                    <span class="task-text">${escapedText}</span>
                    <div class="task-meta">
                        <span class="task-date">${formattedDate}</span>
                    </div>
                </span>
            </label>
            <div class="task-actions">
                <button class="task-btn edit-btn" aria-label="Edit task" title="Edit task">
                    ✏️
                </button>
                <button class="task-btn delete-btn" aria-label="Delete task" title="Delete task">
                    🗑️
                </button>
            </div>
        </li>
    `;
};

/**
 * Render task list with performance optimization
 * @param {HTMLElement} taskListElement - Container element
 * @param {Array} tasks - Array of tasks to render
 * @param {string} currentFilter - Current filter ('all', 'active', 'completed')
 */
export const renderTaskList = (taskListElement, tasks, currentFilter = 'all') => {
    if (!taskListElement) {
        console.error('Task list element not found');
        return;
    }

    // Performance timing for development
    console.time('Rendering tasks');

    // Filter tasks based on current filter
    const filteredTasks = filterTasks(tasks, currentFilter);
    
    // Show/hide empty state
    const emptyState = document.getElementById('empty-state');
    if (filteredTasks.length === 0) {
        taskListElement.innerHTML = '';
        if (emptyState) {
            emptyState.classList.remove('hidden');
            updateEmptyStateMessage(emptyState, currentFilter, tasks.length);
        }
        console.timeEnd('Rendering tasks');
        return;
    }

    if (emptyState) {
        emptyState.classList.add('hidden');
    }

    // Use DocumentFragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();
    
    // Batch render tasks
    filteredTasks.forEach(task => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = createTaskHTML(task);
        fragment.appendChild(tempDiv.firstElementChild);
    });

    // Single DOM update
    taskListElement.innerHTML = '';
    taskListElement.appendChild(fragment);
    
    // Update accessibility attributes
    taskListElement.setAttribute('aria-label', `${filteredTasks.length} tasks`);
    
    console.timeEnd('Rendering tasks');
};

/**
 * Filter tasks based on status
 * @param {Array} tasks - Array of tasks
 * @param {string} filter - Filter type
 * @returns {Array} - Filtered tasks
 */
const filterTasks = (tasks, filter) => {
    switch (filter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        case 'all':
        default:
            return tasks;
    }
};

/**
 * Update empty state message based on filter
 * @param {HTMLElement} emptyState - Empty state element
 * @param {string} filter - Current filter
 * @param {number} totalTasks - Total number of tasks
 */
const updateEmptyStateMessage = (emptyState, filter, totalTasks) => {
    const title = emptyState.querySelector('.empty-title');
    const description = emptyState.querySelector('.empty-description');
    
    if (!title || !description) return;
    
    switch (filter) {
        case 'active':
            title.textContent = totalTasks === 0 ? 'No tasks yet' : 'All tasks completed!';
            description.textContent = totalTasks === 0 
                ? 'Add your first task above to get started!'
                : 'Great job! You\'ve completed all your tasks.';
            break;
        case 'completed':
            title.textContent = 'No completed tasks';
            description.textContent = 'Complete some tasks to see them here.';
            break;
        case 'all':
        default:
            title.textContent = 'No tasks yet';
            description.textContent = 'Add your first task above to get started!';
            break;
    }
};

/**
 * Update task counters in filter buttons
 * @param {Array} tasks - Array of all tasks
 */
export const updateTaskCounters = (tasks) => {
    const allCount = tasks.length;
    const activeCount = tasks.filter(task => !task.completed).length;
    const completedCount = tasks.filter(task => task.completed).length;
    
    // Update filter button counters
    const allCountEl = document.getElementById('all-count');
    const activeCountEl = document.getElementById('active-count');
    const completedCountEl = document.getElementById('completed-count');
    
    if (allCountEl) allCountEl.textContent = allCount;
    if (activeCountEl) activeCountEl.textContent = activeCount;
    if (completedCountEl) completedCountEl.textContent = completedCount;
    
    // Update main task counter
    const taskCounter = document.getElementById('task-counter');
    if (taskCounter) {
        const taskText = allCount === 1 ? 'task' : 'tasks';
        taskCounter.textContent = `${allCount} ${taskText}`;
    }
    
    // Update bulk actions visibility
    updateBulkActionsVisibility(completedCount > 0);
};

/**
 * Update bulk actions visibility
 * @param {boolean} hasCompletedTasks - Whether there are completed tasks
 */
const updateBulkActionsVisibility = (hasCompletedTasks) => {
    const clearCompletedBtn = document.getElementById('clear-completed');
    if (clearCompletedBtn) {
        clearCompletedBtn.style.display = hasCompletedTasks ? 'flex' : 'none';
    }
};

/**
 * Update filter button states
 * @param {string} activeFilter - Currently active filter
 */
export const updateFilterButtons = (activeFilter) => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        const filter = btn.getAttribute('data-filter');
        const isActive = filter === activeFilter;
        
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });
};

/**
 * Animate task addition
 * @param {HTMLElement} taskElement - Task element to animate
 */
export const animateTaskAdd = (taskElement) => {
    if (!taskElement) return;
    
    taskElement.style.opacity = '0';
    taskElement.style.transform = 'translateY(20px)';
    
    // Trigger animation
    requestAnimationFrame(() => {
        taskElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        taskElement.style.opacity = '1';
        taskElement.style.transform = 'translateY(0)';
    });
};

/**
 * Animate task removal
 * @param {HTMLElement} taskElement - Task element to animate
 * @param {Function} onComplete - Callback when animation completes
 */
export const animateTaskRemove = (taskElement, onComplete) => {
    if (!taskElement) {
        onComplete && onComplete();
        return;
    }
    
    taskElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    taskElement.style.opacity = '0';
    taskElement.style.transform = 'translateX(-100%)';
    
    setTimeout(() => {
        onComplete && onComplete();
    }, 300);
};

/**
 * Show loading state
 * @param {boolean} show - Whether to show loading
 */
export const showLoading = (show = true) => {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.toggle('hidden', !show);
    }
};

/**
 * Update character count display
 * @param {number} current - Current character count
 * @param {number} max - Maximum character limit
 */
export const updateCharacterCount = (current, max) => {
    const charCount = document.getElementById('char-count');
    const characterCount = document.querySelector('.character-count');
    
    if (charCount) {
        charCount.textContent = current;
    }
    
    if (characterCount) {
        const isNearLimit = current > max * 0.8;
        characterCount.classList.toggle('text-warning', isNearLimit);
    }
};

/**
 * Render performance metrics for development
 * @param {Array} tasks - Array of tasks
 * @param {number} renderTime - Time taken to render in ms
 */
export const logPerformanceMetrics = (tasks, renderTime) => {
    if (process.env.NODE_ENV === 'development') {
        console.group('Render Performance Metrics');
        console.log(`Tasks rendered: ${tasks.length}`);
        console.log(`Render time: ${renderTime}ms`);
        console.log(`Average per task: ${(renderTime / tasks.length).toFixed(2)}ms`);
        console.groupEnd();
    }
};
