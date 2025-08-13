/**
 * Storage Module - LocalStorage abstraction for task persistence
 * Handles all data operations with error handling and validation
 */

const STORAGE_KEY = 'taskflow_tasks';
const SETTINGS_KEY = 'taskflow_settings';

/**
 * Save tasks to localStorage with error handling
 * @param {Array} tasks - Array of task objects
 * @returns {boolean} - Success status
 */
export const saveTasks = (tasks) => {
    try {
        if (!Array.isArray(tasks)) {
            throw new Error('Tasks must be an array');
        }

        // Validate task objects
        const validTasks = tasks.filter(task => 
            task && 
            typeof task === 'object' && 
            typeof task.id === 'number' && 
            typeof task.text === 'string' &&
            typeof task.completed === 'boolean'
        );

        const serializedData = JSON.stringify(validTasks);
        localStorage.setItem(STORAGE_KEY, serializedData);
        
        // Store metadata
        const metadata = {
            lastModified: new Date().toISOString(),
            version: '1.0.0',
            taskCount: validTasks.length
        };
        localStorage.setItem(`${STORAGE_KEY}_meta`, JSON.stringify(metadata));
        
        return true;
    } catch (error) {
        console.error('Failed to save tasks:', error);
        return false;
    }
};

/**
 * Load tasks from localStorage with error handling
 * @returns {Array} - Array of task objects or empty array
 */
export const loadTasks = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return [];
        }

        const tasks = JSON.parse(stored);
        
        // Validate loaded data
        if (!Array.isArray(tasks)) {
            console.warn('Invalid task data format, returning empty array');
            return [];
        }

        // Ensure all tasks have required properties with defaults
        return tasks.map(task => ({
            id: task.id || Date.now(),
            text: task.text || '',
            completed: Boolean(task.completed),
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: task.updatedAt || task.createdAt || new Date().toISOString()
        }));
        
    } catch (error) {
        console.error('Failed to load tasks:', error);
        return [];
    }
};

/**
 * Save application settings
 * @param {Object} settings - Settings object
 * @returns {boolean} - Success status
 */
export const saveSettings = (settings) => {
    try {
        const serializedData = JSON.stringify(settings);
        localStorage.setItem(SETTINGS_KEY, serializedData);
        return true;
    } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
    }
};

/**
 * Load application settings
 * @returns {Object} - Settings object with defaults
 */
export const loadSettings = () => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) {
            return getDefaultSettings();
        }

        const settings = JSON.parse(stored);
        return { ...getDefaultSettings(), ...settings };
        
    } catch (error) {
        console.error('Failed to load settings:', error);
        return getDefaultSettings();
    }
};

/**
 * Get default settings
 * @returns {Object} - Default settings
 */
const getDefaultSettings = () => ({
    theme: 'light',
    filter: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
});

/**
 * Clear all stored data (for reset functionality)
 * @returns {boolean} - Success status
 */
export const clearStorage = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(`${STORAGE_KEY}_meta`);
        localStorage.removeItem(SETTINGS_KEY);
        return true;
    } catch (error) {
        console.error('Failed to clear storage:', error);
        return false;
    }
};

/**
 * Get storage statistics
 * @returns {Object} - Storage stats
 */
export const getStorageStats = () => {
    try {
        const tasks = loadTasks();
        const metaData = localStorage.getItem(`${STORAGE_KEY}_meta`);
        const meta = metaData ? JSON.parse(metaData) : {};
        
        // Calculate storage size
        const tasksSize = new Blob([localStorage.getItem(STORAGE_KEY) || '']).size;
        const settingsSize = new Blob([localStorage.getItem(SETTINGS_KEY) || '']).size;
        
        return {
            taskCount: tasks.length,
            completedCount: tasks.filter(task => task.completed).length,
            activeCount: tasks.filter(task => !task.completed).length,
            storageSize: tasksSize + settingsSize,
            lastModified: meta.lastModified || null,
            version: meta.version || '1.0.0'
        };
    } catch (error) {
        console.error('Failed to get storage stats:', error);
        return {
            taskCount: 0,
            completedCount: 0,
            activeCount: 0,
            storageSize: 0,
            lastModified: null,
            version: '1.0.0'
        };
    }
};

/**
 * Export tasks data for backup
 * @returns {Object} - Exportable data
 */
export const exportTasks = () => {
    try {
        const tasks = loadTasks();
        const settings = loadSettings();
        const stats = getStorageStats();
        
        return {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            tasks,
            settings,
            stats
        };
    } catch (error) {
        console.error('Failed to export tasks:', error);
        return null;
    }
};

/**
 * Import tasks data from backup
 * @param {Object} data - Import data object
 * @returns {boolean} - Success status
 */
export const importTasks = (data) => {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid import data');
        }

        if (data.tasks && Array.isArray(data.tasks)) {
            saveTasks(data.tasks);
        }

        if (data.settings && typeof data.settings === 'object') {
            saveSettings(data.settings);
        }

        return true;
    } catch (error) {
        console.error('Failed to import tasks:', error);
        return false;
    }
};

/**
 * Check if localStorage is available
 * @returns {boolean} - Availability status
 */
export const isStorageAvailable = () => {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        console.warn('localStorage is not available:', error);
        return false;
    }
};
