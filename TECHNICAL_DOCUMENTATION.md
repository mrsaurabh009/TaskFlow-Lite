# TaskFlow Lite - Technical Documentation

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Architecture Decisions](#architecture-decisions)
3. [LocalStorage Schema](#localstorage-schema)
4. [Event Flow Diagrams](#event-flow-diagrams)
5. [Module Dependencies](#module-dependencies)
6. [Data Flow Architecture](#data-flow-architecture)
7. [Performance Considerations](#performance-considerations)
8. [Security Architecture](#security-architecture)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Browser Compatibility](#browser-compatibility)

---

## 🏗️ Architecture Overview

TaskFlow Lite follows a **modular, MVC-inspired architecture** built entirely with vanilla JavaScript. The application is designed as a **Single Page Application (SPA)** with **Progressive Web App (PWA)** capabilities.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │    HTML     │ │    CSS      │ │      JavaScript        │ │
│  │  Structure  │ │   Styling   │ │    Event Handlers      │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                 Application Logic Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │    App.js   │ │ Validation  │ │       Render           │ │
│  │ Controller  │ │   Module    │ │       Module           │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Data Persistence Layer                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Storage   │ │ localStorage│ │     Service Worker     │ │
│  │   Module    │ │   Browser   │ │      Caching          │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Core Design Principles

1. **Separation of Concerns**: Each module has a single responsibility
2. **Modularity**: ES6 modules for clean imports/exports
3. **Performance First**: Efficient DOM manipulation and state management
4. **Accessibility**: WCAG 2.1 compliance throughout
5. **Progressive Enhancement**: Works without JavaScript, enhanced with it
6. **Offline-First**: PWA capabilities with Service Worker caching

---

## 🧠 Architecture Decisions

### 1. Module Structure Decision

**Decision**: Adopted ES6 module system with functional architecture
**Rationale**: 
- Better code organization and reusability
- Tree-shaking capabilities for production builds
- Clear dependency management
- Easier testing and maintenance

```javascript
// Module Structure
app.js              // Main controller and application state
├── storage.js      // Data persistence abstraction
├── render.js       // DOM manipulation and rendering
└── validation.js   // Input validation and error handling
```

### 2. State Management Decision

**Decision**: Centralized state management with immutable operations
**Rationale**:
- Predictable state changes
- Easier debugging and testing
- History/undo functionality support
- Single source of truth

```javascript
class TaskFlowApp {
    constructor() {
        this.tasks = [];           // Main application state
        this.settings = {};        // User preferences
        this.history = [];         // State history for undo/redo
        this.currentFilter = 'all'; // UI state
    }
}
```

### 3. Event Handling Decision

**Decision**: Event delegation with centralized event management
**Rationale**:
- Better performance for dynamic content
- Memory efficiency
- Simplified event cleanup
- Consistent event handling patterns

```javascript
// Event delegation pattern
this.addEventHandler(this.elements.taskList, 'click', (e) => {
    const taskElement = e.target.closest('.task');
    if (!taskElement) return;
    
    if (e.target.classList.contains('delete-btn')) {
        this.confirmDeleteTask(parseInt(taskElement.dataset.id));
    }
});
```

### 4. Data Persistence Decision

**Decision**: localStorage with robust error handling and validation
**Rationale**:
- No server dependencies
- Instant data persistence
- Works offline
- User privacy (data stays local)
- Comprehensive error recovery

```javascript
export const saveTasks = (tasks) => {
    try {
        const validTasks = tasks.filter(isValidTask);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validTasks));
        return true;
    } catch (error) {
        console.error('Failed to save tasks:', error);
        return false;
    }
};
```

### 5. Validation Strategy Decision

**Decision**: Multi-layer validation with real-time feedback
**Rationale**:
- Better user experience
- Prevents invalid data entry
- Security through input sanitization
- Consistent validation rules

**Validation Layers**:
1. **Input Level**: Real-time validation as user types
2. **Form Level**: Validation on form submission
3. **Data Level**: Validation before storage
4. **Display Level**: Sanitization before rendering

### 6. Rendering Strategy Decision

**Decision**: Virtual DOM-like approach with DocumentFragment
**Rationale**:
- Minimal DOM manipulation for performance
- Batch updates to prevent layout thrashing
- Efficient re-rendering of large lists
- Memory-conscious rendering

```javascript
export const renderTaskList = (taskListElement, tasks) => {
    const fragment = document.createDocumentFragment();
    
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        fragment.appendChild(taskElement);
    });
    
    taskListElement.innerHTML = '';
    taskListElement.appendChild(fragment);
};
```

### 7. PWA Architecture Decision

**Decision**: Service Worker with cache-first strategy
**Rationale**:
- Offline functionality
- Faster subsequent loads
- App-like user experience
- Future-proof for mobile installation

---

## 🗄️ LocalStorage Schema

### Storage Keys Structure

```javascript
// Primary storage keys
const STORAGE_KEYS = {
    TASKS: 'taskflow_tasks',           // Main task data
    SETTINGS: 'taskflow_settings',     // User preferences
    METADATA: 'taskflow_tasks_meta'    // Storage metadata
};
```

### 1. Tasks Storage (`taskflow_tasks`)

**Data Type**: `Array<TaskObject>`

```javascript
// Task Object Schema
interface Task {
    id: number;              // Unique identifier (timestamp + random)
    text: string;            // Task description (1-200 characters)
    completed: boolean;      // Completion status
    createdAt: string;       // ISO 8601 timestamp
    updatedAt: string;       // ISO 8601 timestamp
    // Future extensions:
    // priority?: 'low' | 'medium' | 'high';
    // category?: string;
    // dueDate?: string;
    // tags?: string[];
}

// Example storage data
[
    {
        "id": 1700000000000.123,
        "text": "Complete TaskFlow Lite documentation",
        "completed": false,
        "createdAt": "2023-11-15T10:30:00.000Z",
        "updatedAt": "2023-11-15T10:30:00.000Z"
    },
    {
        "id": 1700000001000.456,
        "text": "Deploy application to production",
        "completed": true,
        "createdAt": "2023-11-15T11:00:00.000Z",
        "updatedAt": "2023-11-15T14:30:00.000Z"
    }
]
```

**Validation Rules**:
- `id`: Must be unique number, auto-generated
- `text`: String, 1-200 characters, sanitized for XSS
- `completed`: Boolean, defaults to `false`
- `createdAt`: ISO 8601 string, auto-generated
- `updatedAt`: ISO 8601 string, updated on modification

### 2. Settings Storage (`taskflow_settings`)

**Data Type**: `SettingsObject`

```javascript
// Settings Object Schema
interface Settings {
    theme: 'light' | 'dark';           // UI theme preference
    filter: 'all' | 'active' | 'completed'; // Default filter
    sortBy: 'createdAt' | 'updatedAt'; // Sort preference
    sortOrder: 'asc' | 'desc';         // Sort direction
    // Future extensions:
    // language?: string;
    // autoSave?: boolean;
    // notifications?: boolean;
    // compactMode?: boolean;
}

// Example storage data
{
    "theme": "dark",
    "filter": "all",
    "sortBy": "createdAt",
    "sortOrder": "desc"
}
```

**Default Values**:
```javascript
const DEFAULT_SETTINGS = {
    theme: 'light',
    filter: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
};
```

### 3. Metadata Storage (`taskflow_tasks_meta`)

**Data Type**: `MetadataObject`

```javascript
// Metadata Object Schema
interface Metadata {
    version: string;           // Schema version for migrations
    lastModified: string;      // ISO 8601 timestamp
    taskCount: number;         // Total number of tasks
    // Performance tracking:
    // lastBackup?: string;
    // syncStatus?: 'synced' | 'pending' | 'error';
}

// Example storage data
{
    "version": "1.0.0",
    "lastModified": "2023-11-15T14:30:00.000Z",
    "taskCount": 15
}
```

### Storage Size Management

```javascript
// Storage quota monitoring
export const getStorageStats = () => {
    const tasks = loadTasks();
    const tasksSize = new Blob([JSON.stringify(tasks)]).size;
    const settingsSize = new Blob([JSON.stringify(loadSettings())]).size;
    
    return {
        tasksCount: tasks.length,
        totalSize: tasksSize + settingsSize,
        availableQuota: getAvailableQuota(), // ~5-10MB typical
        utilizationPercent: ((tasksSize + settingsSize) / getAvailableQuota()) * 100
    };
};
```

### Data Migration Strategy

```javascript
// Version-based migration system
const MIGRATIONS = {
    '1.0.0': (data) => data, // Current version
    // Future migrations:
    // '1.1.0': (data) => addPriorityField(data),
    // '2.0.0': (data) => restructureForCategories(data)
};

export const migrateData = (data, fromVersion, toVersion) => {
    // Apply sequential migrations
    let currentData = data;
    const versions = Object.keys(MIGRATIONS).sort();
    
    for (const version of versions) {
        if (version > fromVersion && version <= toVersion) {
            currentData = MIGRATIONS[version](currentData);
        }
    }
    
    return currentData;
};
```

---

## 🔄 Event Flow Diagrams

### 1. Application Initialization Flow

```
┌─────────────────┐
│   Page Load     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ DOMContentLoaded│
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ new TaskFlowApp │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ app.init()      │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Cache DOM      │───▶│  Load Data      │───▶│ Setup Events    │
│  Elements       │    │ from Storage    │    │  & Listeners    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Initialize      │    │ Validate &      │    │ Setup Keyboard  │
│ Theme           │    │ Sanitize Data   │    │ Shortcuts       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Initial         │    │ Update State    │    │ Register SW     │
│ Render          │    │ Variables       │    │ (PWA Support)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                ▼
                    ┌─────────────────┐
                    │ App Ready       │
                    │ Show Success    │
                    │ Notification    │
                    └─────────────────┘
```

### 2. Task Creation Flow

```
┌─────────────────┐
│ User Types in   │
│ Input Field     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Real-time       │◀─── Debounced (300ms)
│ Validation      │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Visual Feedback │
│ (Error/Success) │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ User Submits    │
│ Form (Enter/+)  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ preventDefault()│
│ Stop Default    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Final           │
│ Validation      │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ Validation      │───▶│ Show Error      │
│ Failed?         │    │ Notification    │
└─────────────────┘    └─────────────────┘
         │ No                   │
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│ Create Task     │    │ Focus Input     │
│ Object          │    │ Field           │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Save State      │
│ (for Undo)      │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Add to Tasks    │
│ Array           │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Save to         │
│ localStorage    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Re-render UI    │
│ (DOM Update)    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Show Success    │
│ Notification    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Clear Input &   │
│ Focus for Next  │
└─────────────────┘
```

### 3. Task Interaction Flow (Click Events)

```
┌─────────────────┐
│ User Clicks     │
│ in Task List    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Event Bubbles   │
│ to Task List    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Find Closest    │
│ .task Element   │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ Extract Task ID │    │ Not a Task      │
│ from dataset    │    │ Element?        │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ Determine       │    │ Ignore Click    │
│ Action Type     │    │ & Return        │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Checkbox        │  │ Edit Button     │  │ Delete Button   │
│ Click?          │  │ Click?          │  │ Click?          │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Toggle Task     │  │ Show Edit       │  │ Show Delete     │
│ Completion      │  │ Prompt          │  │ Confirmation    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Save State      │  │ Validate Input  │  │ User Confirms?  │
│ Update Task     │  │ Update Task     │  │ Delete Task     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
                    ┌─────────────────┐
                    │ Save to Storage │
                    │ & Re-render UI  │
                    └─────────────────┘
```

### 4. Data Persistence Flow

```
┌─────────────────┐
│ State Change    │
│ Triggered       │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Validate Data   │
│ Integrity       │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ Data Valid?     │───▶│ Log Error &     │
└─────────────────┘ No │ Show Notification│
         │ Yes          └─────────────────┘
         ▼
┌─────────────────┐
│ Sanitize Data   │
│ for Storage     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Serialize to    │
│ JSON String     │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ localStorage    │───▶│ Storage Failed? │
│ setItem()       │    │ (Quota/Error)   │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼ Success                ▼ Yes
┌─────────────────┐    ┌─────────────────┐
│ Update Metadata │    │ Fallback to     │
│ (timestamp, etc)│    │ Memory Storage  │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ Broadcast       │    │ Show Storage    │
│ Storage Event   │    │ Warning         │
│ (Multi-tab)     │    │ to User         │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Update Success  │
│ Complete        │
└─────────────────┘
```

### 5. Filter & Render Flow

```
┌─────────────────┐
│ Filter Button   │
│ Clicked         │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Extract Filter  │
│ Type from       │
│ data-filter     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Update Current  │
│ Filter State    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Save Filter     │
│ Preference      │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Filter Tasks    │
│ Array by Status │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ All Tasks       │    │ Active Tasks    │    │ Completed Tasks │
│ filter='all'    │    │ filter='active' │    │ filter='completed'│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └─────────────────────── ▼ ──────────────────────┘
                    ┌─────────────────┐
                    │ Start Render    │
                    │ Performance     │
                    │ Timing          │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │ Filtered        │───▶│ Show Empty      │
                    │ Array Empty?    │    │ State Message   │
                    └─────────────────┘    └─────────────────┘
                             │ No
                             ▼
                    ┌─────────────────┐
                    │ Create Document │
                    │ Fragment        │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Loop Through    │
                    │ Filtered Tasks  │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Create Task     │
                    │ DOM Elements    │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Append to       │
                    │ Fragment        │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Replace Task    │
                    │ List Contents   │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Update Filter   │
                    │ Button States   │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Update Task     │
                    │ Counters        │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Log Render      │
                    │ Performance     │
                    └─────────────────┘
```

---

## 🔗 Module Dependencies

### Dependency Graph

```
app.js (Main Controller)
├── storage.js     (Data Persistence)
├── render.js      (DOM Manipulation)
├── validation.js  (Input Validation)
└── No external dependencies

index.html
├── styles/main.css
├── styles/utilities.css
├── manifest.json  (PWA)
└── sw.js         (Service Worker)
```

### Import/Export Structure

```javascript
// app.js (imports)
import { 
    loadTasks, saveTasks, saveSettings, loadSettings, isStorageAvailable 
} from './modules/storage.js';

import { 
    renderTaskList, updateTaskCounters, updateFilterButtons, 
    updateCharacterCount, showLoading 
} from './modules/render.js';

import { 
    validateTaskInput, validateInputRealtime, debounceValidation, sanitizeInput 
} from './modules/validation.js';

// storage.js (exports)
export const saveTasks = (tasks) => { /* ... */ };
export const loadTasks = () => { /* ... */ };
export const saveSettings = (settings) => { /* ... */ };
export const loadSettings = () => { /* ... */ };
export const isStorageAvailable = () => { /* ... */ };

// render.js (exports)  
export const renderTaskList = (element, tasks, filter) => { /* ... */ };
export const updateTaskCounters = (tasks) => { /* ... */ };
export const updateFilterButtons = (activeFilter) => { /* ... */ };
export const escapeHTML = (str) => { /* ... */ };

// validation.js (exports)
export const validateTaskInput = (input, existingTasks) => { /* ... */ };
export const validateInputRealtime = (element, existingTasks) => { /* ... */ };
export const debounceValidation = (fn, delay) => { /* ... */ };
export const sanitizeInput = (input) => { /* ... */ };
export class ValidationError extends Error { /* ... */ }
```

---

## 📊 Data Flow Architecture

### Unidirectional Data Flow

```
┌─────────────────┐
│   User Action   │ (Click, Type, Submit)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Event Handler   │ (app.js methods)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Validation    │ (validation.js)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ State Update    │ (app.js state)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Data Persistence│ (storage.js)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ UI Re-render    │ (render.js)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ User Feedback   │ (Visual updates)
└─────────────────┘
```

### State Management Pattern

```javascript
// State mutation pattern (Immutable-like operations)
class TaskFlowApp {
    // State is centralized
    constructor() {
        this.tasks = [];        // Single source of truth
        this.settings = {};     // User preferences
        this.history = [];      // For undo functionality
    }
    
    // All state changes go through controlled methods
    addTask(task) {
        this.saveState();                    // Save for undo
        this.tasks = [...this.tasks, task];  // Immutable-style update
        this.saveData();                     // Persist to storage
        this.render();                       // Update UI
    }
    
    // Never direct state manipulation
    // Always: Action → Validation → State → Storage → Render
}
```

---

## ⚡ Performance Considerations

### 1. DOM Manipulation Optimization

```javascript
// Batch DOM updates using DocumentFragment
const fragment = document.createDocumentFragment();
tasks.forEach(task => {
    fragment.appendChild(createTaskElement(task));
});
taskList.replaceChildren(...fragment.childNodes);

// Minimize reflows and repaints
element.style.display = 'none';  // Hide during updates
// ... make multiple changes ...
element.style.display = '';      // Show after updates
```

### 2. Event Handling Optimization

```javascript
// Event delegation instead of multiple listeners
taskList.addEventListener('click', (e) => {
    const taskElement = e.target.closest('.task');
    if (!taskElement) return;
    
    // Handle all task interactions with single listener
    handleTaskInteraction(e, taskElement);
});

// Debounced validation to prevent excessive calls
const debouncedValidation = debounceValidation(validateInput, 300);
```

### 3. Memory Management

```javascript
// Proper cleanup on app destroy
cleanup() {
    // Remove all event listeners
    this.eventHandlers.forEach((handlers, element) => {
        handlers.forEach(({ event, handler }) => {
            element.removeEventListener(event, handler);
        });
    });
    
    // Clear references
    this.eventHandlers.clear();
    this.elements = null;
}
```

### 4. Storage Optimization

```javascript
// Lazy loading and caching
let cachedTasks = null;
export const loadTasks = () => {
    if (cachedTasks) return cachedTasks;
    
    cachedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return cachedTasks;
};

// Batch storage operations
let pendingWrites = [];
const flushWrites = debounce(() => {
    // Write all pending changes at once
    pendingWrites.forEach(writeOperation => writeOperation());
    pendingWrites = [];
}, 100);
```

---

## 🔒 Security Architecture

### Input Sanitization Pipeline

```javascript
// Multi-layer security approach
const securityPipeline = (input) => {
    // 1. Length validation
    if (input.length > MAX_LENGTH) return null;
    
    // 2. Character filtering
    const allowedChars = /^[a-zA-Z0-9\s\-.,!?()[\]{}:;"'@#$%^&*+=_~`|\\/<>]*$/;
    if (!allowedChars.test(input)) return null;
    
    // 3. HTML escaping
    const escaped = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    // 4. Trim and normalize
    return escaped.trim().replace(/\s+/g, ' ');
};
```

### XSS Prevention Strategy

```javascript
// Always escape HTML before rendering
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

// Use textContent instead of innerHTML where possible
taskTextElement.textContent = task.text; // Safe
// taskTextElement.innerHTML = task.text; // Dangerous
```

### Content Security Policy

```html
<!-- Recommended CSP headers for production -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline' fonts.googleapis.com;
               font-src fonts.gstatic.com;
               connect-src 'self';">
```

---

## 🛠️ Error Handling Strategy

### Error Handling Hierarchy

```javascript
// 1. Module-level error handling
export const saveTasks = (tasks) => {
    try {
        // Operation logic
        return true;
    } catch (error) {
        console.error('Module error:', error);
        return false; // Graceful degradation
    }
};

// 2. Application-level error handling
handleTaskSubmit(e) {
    try {
        // Task creation logic
    } catch (error) {
        this.showNotification('Failed to add task', 'error');
        this.logError('TaskSubmit', error);
    }
}

// 3. Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Report to analytics/monitoring service
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent console logging
});
```

### Graceful Degradation Strategy

```javascript
// Feature detection and fallbacks
const features = {
    localStorage: (() => {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    })(),
    
    serviceWorker: 'serviceWorker' in navigator,
    
    es6Modules: typeof Symbol !== 'undefined'
};

// Fallback implementations
if (!features.localStorage) {
    // Use memory storage
    const memoryStorage = new Map();
    // Implement localStorage-like interface
}
```

---

## 🌐 Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Features Supported |
|---------|----------------|-------------------|
| Chrome | 60+ | Full PWA support |
| Firefox | 55+ | Full PWA support |
| Safari | 12+ | Limited PWA support |
| Edge | 79+ | Full PWA support |
| iOS Safari | 12+ | Add to homescreen |
| Chrome Mobile | 60+ | Full PWA support |

### Feature Detection Matrix

```javascript
const browserSupport = {
    // Core JavaScript features
    es6Modules: typeof Symbol !== 'undefined',
    es6Classes: (() => {
        try { eval('class Test {}'); return true; }
        catch (e) { return false; }
    })(),
    
    // Web APIs
    localStorage: typeof Storage !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    webAppManifest: 'onbeforeinstallprompt' in window,
    
    // CSS features
    cssCustomProperties: CSS.supports('--test', 'green'),
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex')
};

// Progressive enhancement based on support
if (browserSupport.serviceWorker) {
    registerServiceWorker();
} else {
    console.warn('Service Worker not supported');
}
```

### Polyfill Strategy

```javascript
// Load polyfills only when needed
const loadPolyfills = async () => {
    const polyfills = [];
    
    if (!browserSupport.es6Modules) {
        polyfills.push(import('es6-module-polyfill'));
    }
    
    if (!browserSupport.cssCustomProperties) {
        polyfills.push(import('css-vars-ponyfill'));
    }
    
    await Promise.all(polyfills);
};
```

---

## 🧪 Testing Architecture

### Testing Strategy Overview

```javascript
// Unit tests for pure functions
describe('Storage Module', () => {
    test('saveTasks should handle invalid input', () => {
        expect(saveTasks(null)).toBe(false);
        expect(saveTasks(undefined)).toBe(false);
        expect(saveTasks('invalid')).toBe(false);
    });
});

// Integration tests for module interactions
describe('Task Creation Flow', () => {
    test('should create and persist task', async () => {
        const app = new TaskFlowApp();
        await app.init();
        
        const taskCount = app.tasks.length;
        app.addTask(createTask('Test task'));
        
        expect(app.tasks.length).toBe(taskCount + 1);
        expect(loadTasks().length).toBe(taskCount + 1);
    });
});

// E2E tests for user workflows
describe('User Interactions', () => {
    test('should add task via form submission', async () => {
        // Simulate user typing and submitting
        const input = screen.getByPlaceholderText('What needs to be done?');
        fireEvent.change(input, { target: { value: 'New task' } });
        fireEvent.submit(screen.getByRole('form'));
        
        expect(screen.getByText('New task')).toBeInTheDocument();
    });
});
```

---

This technical documentation provides a comprehensive overview of the TaskFlow Lite architecture, covering all major design decisions, data structures, and interaction patterns. The modular design and clear separation of concerns make the application maintainable, testable, and extensible for future enhancements.
