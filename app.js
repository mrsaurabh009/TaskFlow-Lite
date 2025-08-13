/**
 * TaskFlow Lite - Main Application Entry Point
 * A production-ready task management application built with vanilla JavaScript
 */

import { loadTasks, saveTasks, saveSettings, loadSettings, isStorageAvailable } from './modules/storage.js';
import { renderTaskList, updateTaskCounters, updateFilterButtons, updateCharacterCount, showLoading } from './modules/render.js';
import { validateTaskInput, validateInputRealtime, debounceValidation, sanitizeInput } from './modules/validation.js';

/**
 * Application state management
 */
class TaskFlowApp {
    constructor() {
        this.tasks = [];
        this.settings = {
            theme: 'light',
            filter: 'all'
        };
        this.currentFilter = 'all';
        this.isInitialized = false;
        this.history = [];
        this.historyIndex = -1;
        
        // DOM elements cache
        this.elements = {};
        
        // Event handlers cache (for cleanup)
        this.eventHandlers = new Map();
        
        // Performance tracking
        this.performanceMetrics = {
            appStart: performance.now(),
            renderTimes: []
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing TaskFlow Lite...');
            showLoading(true);

            // Check storage availability
            if (!isStorageAvailable()) {
                this.showNotification('Storage not available. Data will not be saved.', 'warning');
            }

            // Cache DOM elements
            this.cacheElements();
            
            // Load data
            await this.loadAppData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup theme
            this.initializeTheme();
            
            // Initial render
            this.render();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            this.isInitialized = true;
            showLoading(false);
            
            const initTime = performance.now() - this.performanceMetrics.appStart;
            console.log(`✅ TaskFlow Lite initialized in ${initTime.toFixed(2)}ms`);
            
            this.showNotification('Welcome to TaskFlow Lite!', 'success');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            showLoading(false);
            this.showNotification('Failed to initialize application', 'error');
        }
    }

    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements = {
            taskForm: document.getElementById('task-form'),
            taskInput: document.getElementById('task-input'),
            taskList: document.getElementById('task-list'),
            themeToggle: document.getElementById('theme-toggle'),
            filterButtons: document.querySelectorAll('.filter-btn'),
            clearCompleted: document.getElementById('clear-completed'),
            selectAll: document.getElementById('select-all'),
            charCount: document.getElementById('char-count'),
            emptyState: document.getElementById('empty-state'),
            modalOverlay: document.getElementById('modal-overlay'),
            modalTitle: document.getElementById('modal-title'),
            modalMessage: document.getElementById('modal-message'),
            modalConfirm: document.getElementById('modal-confirm'),
            modalCancel: document.getElementById('modal-cancel')
        };
    }

    /**
     * Load application data from storage
     */
    async loadAppData() {
        try {
            this.tasks = loadTasks();
            this.settings = loadSettings();
            this.currentFilter = this.settings.filter || 'all';
            
            console.log(`Loaded ${this.tasks.length} tasks from storage`);
        } catch (error) {
            console.error('Failed to load app data:', error);
            this.tasks = [];
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Task form submission
        this.addEventHandler(this.elements.taskForm, 'submit', (e) => this.handleTaskSubmit(e));
        
        // Real-time input validation
        const debouncedValidation = debounceValidation((e) => this.handleInputValidation(e), 300);
        this.addEventHandler(this.elements.taskInput, 'input', debouncedValidation);
        this.addEventHandler(this.elements.taskInput, 'input', (e) => this.updateCharCount(e));
        
        // Task list interactions (using event delegation)
        this.addEventHandler(this.elements.taskList, 'click', (e) => this.handleTaskListClick(e));
        this.addEventHandler(this.elements.taskList, 'change', (e) => this.handleTaskListChange(e));
        
        // Filter buttons
        this.elements.filterButtons.forEach(btn => {
            this.addEventHandler(btn, 'click', (e) => this.handleFilterChange(e));
        });
        
        // Theme toggle
        this.addEventHandler(this.elements.themeToggle, 'click', () => this.toggleTheme());
        
        // Bulk actions
        this.addEventHandler(this.elements.clearCompleted, 'click', () => this.clearCompletedTasks());
        this.addEventHandler(this.elements.selectAll, 'click', () => this.toggleAllTasks());
        
        // Modal interactions
        this.addEventHandler(this.elements.modalCancel, 'click', () => this.hideModal());
        this.addEventHandler(this.elements.modalOverlay, 'click', (e) => {
            if (e.target === this.elements.modalOverlay) this.hideModal();
        });
        
        // Window events
        this.addEventHandler(window, 'beforeunload', () => this.cleanup());
        this.addEventHandler(window, 'resize', debounceValidation(() => this.handleResize(), 250));
        
        // Storage events (for multi-tab synchronization)
        this.addEventHandler(window, 'storage', (e) => this.handleStorageChange(e));
    }

    /**
     * Helper method to add event listeners with cleanup tracking
     */
    addEventHandler(element, event, handler) {
        if (!element) return;
        
        element.addEventListener(event, handler);
        
        // Store for cleanup
        if (!this.eventHandlers.has(element)) {
            this.eventHandlers.set(element, []);
        }
        this.eventHandlers.get(element).push({ event, handler });
    }

    /**
     * Handle task form submission
     */
    handleTaskSubmit(e) {
        e.preventDefault();
        
        const input = this.elements.taskInput;
        const validation = validateTaskInput(input.value, this.tasks);
        
        if (!validation.isValid) {
            this.showNotification(validation.errors[0].message, 'error');
            return;
        }
        
        const newTask = this.createTask(validation.cleaned);
        this.addTask(newTask);
        
        // Reset form
        input.value = '';
        this.updateCharCount({ target: input });
        
        // Focus back to input
        input.focus();
    }

    /**
     * Handle real-time input validation
     */
    handleInputValidation(e) {
        validateInputRealtime(e.target, this.tasks);
    }

    /**
     * Update character count display
     */
    updateCharCount(e) {
        const current = e.target.value.length;
        const max = 200;
        updateCharacterCount(current, max);
    }

    /**
     * Handle task list click events (event delegation)
     */
    handleTaskListClick(e) {
        const taskElement = e.target.closest('.task');
        if (!taskElement) return;
        
        const taskId = parseInt(taskElement.dataset.id);
        
        if (e.target.classList.contains('delete-btn')) {
            this.confirmDeleteTask(taskId);
        } else if (e.target.classList.contains('edit-btn')) {
            this.editTask(taskId);
        }
    }

    /**
     * Handle task list change events (checkboxes)
     */
    handleTaskListChange(e) {
        if (e.target.type === 'checkbox') {
            const taskElement = e.target.closest('.task');
            if (taskElement) {
                const taskId = parseInt(taskElement.dataset.id);
                this.toggleTask(taskId);
            }
        }
    }

    /**
     * Handle filter button changes
     */
    handleFilterChange(e) {
        const filter = e.target.getAttribute('data-filter');
        this.setFilter(filter);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Debounced resize handler for responsive adjustments
        this.render();
    }

    /**
     * Handle storage changes (multi-tab sync)
     */
    handleStorageChange(e) {
        if (e.key === 'taskflow_tasks') {
            console.log('Tasks updated in another tab, reloading...');
            this.loadAppData().then(() => this.render());
        }
    }

    /**
     * Create a new task object
     */
    createTask(text) {
        return {
            id: Date.now() + Math.random(), // Ensure uniqueness
            text: sanitizeInput(text),
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Add a new task
     */
    addTask(task) {
        this.saveState(); // For undo functionality
        this.tasks.unshift(task); // Add to beginning
        this.saveData();
        this.render();
        this.showNotification('Task added successfully!', 'success');
    }

    /**
     * Toggle task completion status
     */
    toggleTask(taskId) {
        this.saveState();
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            this.saveData();
            this.render();
            
            const status = task.completed ? 'completed' : 'reactivated';
            this.showNotification(`Task ${status}!`, 'success');
        }
    }

    /**
     * Delete a task
     */
    deleteTask(taskId) {
        this.saveState();
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks.splice(taskIndex, 1);
            this.saveData();
            this.render();
            this.showNotification('Task deleted!', 'success');
        }
    }

    /**
     * Edit a task (inline editing)
     */
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const newText = prompt('Edit task:', task.text);
        if (newText !== null && newText.trim() !== task.text) {
            const validation = validateTaskInput(newText, this.tasks.filter(t => t.id !== taskId));
            
            if (validation.isValid) {
                this.saveState();
                task.text = validation.cleaned;
                task.updatedAt = new Date().toISOString();
                this.saveData();
                this.render();
                this.showNotification('Task updated!', 'success');
            } else {
                this.showNotification(validation.errors[0].message, 'error');
            }
        }
    }

    /**
     * Show delete confirmation modal
     */
    confirmDeleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        this.showModal(
            'Delete Task',
            `Are you sure you want to delete "${task.text}"? This action cannot be undone.`,
            () => this.deleteTask(taskId)
        );
    }

    /**
     * Clear all completed tasks
     */
    clearCompletedTasks() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear', 'warning');
            return;
        }
        
        this.showModal(
            'Clear Completed Tasks',
            `Are you sure you want to delete all ${completedCount} completed tasks? This action cannot be undone.`,
            () => {
                this.saveState();
                this.tasks = this.tasks.filter(t => !t.completed);
                this.saveData();
                this.render();
                this.showNotification(`${completedCount} completed tasks cleared!`, 'success');
            }
        );
    }

    /**
     * Toggle all tasks completion status
     */
    toggleAllTasks() {
        const allCompleted = this.tasks.every(t => t.completed);
        
        this.saveState();
        this.tasks.forEach(task => {
            task.completed = !allCompleted;
            task.updatedAt = new Date().toISOString();
        });
        
        this.saveData();
        this.render();
        
        const action = allCompleted ? 'reactivated' : 'completed';
        this.showNotification(`All tasks ${action}!`, 'success');
    }

    /**
     * Set current filter
     */
    setFilter(filter) {
        this.currentFilter = filter;
        this.settings.filter = filter;
        this.saveSettings();
        this.render();
    }

    /**
     * Initialize theme from settings
     */
    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        this.updateThemeToggle();
    }

    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
        const newTheme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.settings.theme = newTheme;
        
        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeToggle();
        this.saveSettings();
        
        this.showNotification(`Switched to ${newTheme} theme`, 'success');
    }

    /**
     * Update theme toggle button
     */
    updateThemeToggle() {
        const themeIcon = this.elements.themeToggle.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.settings.theme === 'light' ? '🌙' : '☀️';
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to add task
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (this.elements.taskInput === document.activeElement) {
                    this.elements.taskForm.dispatchEvent(new Event('submit'));
                }
            }
            
            // Escape to focus input
            if (e.key === 'Escape') {
                this.elements.taskInput.focus();
                this.hideModal();
            }
            
            // Theme toggle shortcut (Ctrl/Cmd + D)
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor render performance
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.name.includes('task-render')) {
                    this.performanceMetrics.renderTimes.push(entry.duration);
                }
            });
        });
        
        if (typeof PerformanceObserver !== 'undefined') {
            observer.observe({ entryTypes: ['measure'] });
        }
    }

    /**
     * Save current state for undo functionality
     */
    saveState() {
        const currentState = JSON.stringify(this.tasks);
        this.history.push(currentState);
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
        }
        
        this.historyIndex = this.history.length - 1;
    }

    /**
     * Undo last action
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.tasks = JSON.parse(this.history[this.historyIndex]);
            this.saveData();
            this.render();
            this.showNotification('Action undone', 'success');
        }
    }

    /**
     * Save tasks data
     */
    saveData() {
        if (saveTasks(this.tasks)) {
            console.log(`Saved ${this.tasks.length} tasks`);
        } else {
            this.showNotification('Failed to save tasks', 'error');
        }
    }

    /**
     * Save application settings
     */
    saveSettings() {
        saveSettings(this.settings);
    }

    /**
     * Render the entire application
     */
    render() {
        const startTime = performance.now();
        
        // Update task list
        renderTaskList(this.elements.taskList, this.tasks, this.currentFilter);
        
        // Update counters and UI
        updateTaskCounters(this.tasks);
        updateFilterButtons(this.currentFilter);
        
        const renderTime = performance.now() - startTime;
        console.log(`Render completed in ${renderTime.toFixed(2)}ms`);
    }

    /**
     * Show modal dialog
     */
    showModal(title, message, confirmCallback) {
        this.elements.modalTitle.textContent = title;
        this.elements.modalMessage.textContent = message;
        this.elements.modalOverlay.classList.add('show');
        
        // Setup confirm handler
        const confirmHandler = () => {
            confirmCallback && confirmCallback();
            this.hideModal();
        };
        
        this.elements.modalConfirm.onclick = confirmHandler;
        
        // Focus on confirm button
        this.elements.modalConfirm.focus();
    }

    /**
     * Hide modal dialog
     */
    hideModal() {
        this.elements.modalOverlay.classList.remove('show');
        this.elements.modalConfirm.onclick = null;
    }

    /**
     * Show toast notification
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Cleanup resources when app is closing
     */
    cleanup() {
        console.log('Cleaning up TaskFlow Lite...');
        
        // Remove all event listeners
        this.eventHandlers.forEach((handlers, element) => {
            handlers.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        
        this.eventHandlers.clear();
        
        // Save final state
        this.saveData();
        this.saveSettings();
    }
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new TaskFlowApp();
    
    // Make app available globally for debugging
    window.TaskFlowApp = app;
    
    // Initialize the application
    app.init().catch(error => {
        console.error('Failed to start TaskFlow Lite:', error);
    });
});

/**
 * Handle unhandled errors gracefully
 */
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

export default TaskFlowApp;
