# TaskFlow Lite - Architecture Diagrams

## 📊 Visual Architecture Overview

This document contains visual representations of the TaskFlow Lite architecture, including component diagrams, data flow charts, and interaction patterns.

---

## 🏗️ System Architecture Diagram

```mermaid
graph TB
    subgraph "Browser Environment"
        subgraph "User Interface Layer"
            HTML[HTML Structure]
            CSS[CSS Styling]
            UI[User Interactions]
        end
        
        subgraph "Application Logic Layer"
            APP[app.js<br/>Main Controller]
            VALID[validation.js<br/>Input Validation]
            RENDER[render.js<br/>DOM Rendering]
        end
        
        subgraph "Data Layer"
            STORAGE[storage.js<br/>Data Abstraction]
            LOCAL[localStorage<br/>Browser Storage]
        end
        
        subgraph "PWA Layer"
            SW[Service Worker<br/>sw.js]
            MANIFEST[Web Manifest<br/>manifest.json]
            CACHE[Cache API<br/>Offline Storage]
        end
    end
    
    UI --> APP
    APP --> VALID
    APP --> RENDER
    APP --> STORAGE
    STORAGE --> LOCAL
    RENDER --> HTML
    CSS --> HTML
    SW --> CACHE
    MANIFEST --> SW
    
    style APP fill:#3b82f6,color:#fff
    style STORAGE fill:#10b981,color:#fff
    style RENDER fill:#f59e0b,color:#fff
    style VALID fill:#ef4444,color:#fff
```

---

## 🔄 Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant UI as User Interface
    participant App as Application Controller
    participant Valid as Validation Module
    participant Storage as Storage Module
    participant Render as Render Module
    
    User->>UI: Interact (click, type)
    UI->>App: Trigger event handler
    App->>Valid: Validate input
    Valid-->>App: Validation result
    
    alt Validation Success
        App->>App: Update application state
        App->>Storage: Persist data
        Storage-->>App: Confirm save
        App->>Render: Trigger re-render
        Render->>UI: Update DOM
        UI-->>User: Visual feedback
    else Validation Failed
        App->>UI: Show error message
        UI-->>User: Display error
    end
```

---

## 📦 Module Dependency Graph

```mermaid
graph LR
    subgraph "Main Application"
        APP[app.js]
    end
    
    subgraph "Core Modules"
        STORAGE[storage.js]
        RENDER[render.js] 
        VALID[validation.js]
    end
    
    subgraph "UI Files"
        HTML[index.html]
        CSS1[main.css]
        CSS2[utilities.css]
    end
    
    subgraph "PWA Files"
        SW[sw.js]
        MANIFEST[manifest.json]
    end
    
    APP --> STORAGE
    APP --> RENDER
    APP --> VALID
    HTML --> APP
    HTML --> CSS1
    HTML --> CSS2
    HTML --> MANIFEST
    HTML --> SW
    
    style APP fill:#3b82f6,color:#fff
    style STORAGE fill:#10b981,color:#fff
    style RENDER fill:#f59e0b,color:#fff
    style VALID fill:#ef4444,color:#fff
```

---

## 🎯 Event Flow Diagrams

### Task Creation Event Flow

```mermaid
flowchart TD
    A[User Types in Input] --> B[Real-time Validation<br/>Debounced 300ms]
    B --> C[Visual Feedback<br/>Error/Success]
    C --> D[User Submits Form<br/>Enter or Click +]
    D --> E[preventDefault<br/>Stop Default Action]
    E --> F[Final Validation]
    F --> G{Valid Input?}
    
    G -->|No| H[Show Error Notification]
    H --> I[Focus Input Field]
    
    G -->|Yes| J[Create Task Object]
    J --> K[Save State for Undo]
    K --> L[Add to Tasks Array]
    L --> M[Save to localStorage]
    M --> N[Re-render UI]
    N --> O[Show Success Toast]
    O --> P[Clear Input & Focus]
    
    style G fill:#f59e0b,color:#fff
    style H fill:#ef4444,color:#fff
    style O fill:#10b981,color:#fff
```

### Task Interaction Event Flow

```mermaid
flowchart TD
    A[User Clicks in Task List] --> B[Event Bubbles to Task List]
    B --> C[Find Closest .task Element]
    C --> D{Task Element Found?}
    
    D -->|No| E[Ignore Click & Return]
    
    D -->|Yes| F[Extract Task ID from dataset]
    F --> G[Determine Action Type]
    G --> H{Which Action?}
    
    H -->|Checkbox| I[Toggle Task Completion]
    H -->|Edit Button| J[Show Edit Prompt]
    H -->|Delete Button| K[Show Delete Confirmation]
    
    I --> L[Save State & Update Task]
    J --> M[Validate New Text]
    K --> N{User Confirms?}
    
    M --> L
    N -->|Yes| O[Delete Task from Array]
    N -->|No| E
    O --> L
    
    L --> P[Save to localStorage]
    P --> Q[Re-render UI]
    Q --> R[Show Feedback Message]
    
    style H fill:#f59e0b,color:#fff
    style N fill:#ef4444,color:#fff
    style R fill:#10b981,color:#fff
```

---

## 🗄️ localStorage Schema Diagram

```mermaid
erDiagram
    STORAGE ||--o{ TASKS : contains
    STORAGE ||--|| SETTINGS : contains
    STORAGE ||--|| METADATA : contains
    
    TASKS {
        number id PK "Unique timestamp + random"
        string text "1-200 characters, sanitized"
        boolean completed "Default: false"
        string createdAt "ISO 8601 timestamp"
        string updatedAt "ISO 8601 timestamp"
    }
    
    SETTINGS {
        string theme "light|dark, default: light"
        string filter "all|active|completed, default: all"
        string sortBy "createdAt|updatedAt, default: createdAt"
        string sortOrder "asc|desc, default: desc"
    }
    
    METADATA {
        string version "Schema version for migrations"
        string lastModified "ISO 8601 timestamp"
        number taskCount "Total number of tasks"
    }
```

---

## ⚡ Performance Architecture

```mermaid
graph TB
    subgraph "Performance Optimizations"
        subgraph "DOM Optimization"
            FRAGMENT[DocumentFragment<br/>Batch Updates]
            DELEGATE[Event Delegation<br/>Single Listeners]
            CACHE[DOM Element<br/>Caching]
        end
        
        subgraph "JavaScript Optimization"
            DEBOUNCE[Debounced Validation<br/>300ms delay]
            IMMUTABLE[Immutable-style<br/>State Updates]
            CLEANUP[Memory Management<br/>Event Cleanup]
        end
        
        subgraph "Storage Optimization"
            LAZY[Lazy Loading<br/>Cached Results]
            BATCH[Batch Write<br/>Operations]
            COMPRESS[Data Compression<br/>JSON minification]
        end
        
        subgraph "Network Optimization"
            SW_CACHE[Service Worker<br/>Cache Strategy]
            PRELOAD[Resource<br/>Preloading]
            CDN[CDN Fonts<br/>External Resources]
        end
    end
    
    USER[User Interaction] --> DELEGATE
    DELEGATE --> DEBOUNCE
    DEBOUNCE --> IMMUTABLE
    IMMUTABLE --> BATCH
    BATCH --> FRAGMENT
    FRAGMENT --> USER
    
    style FRAGMENT fill:#3b82f6,color:#fff
    style DEBOUNCE fill:#10b981,color:#fff
    style SW_CACHE fill:#f59e0b,color:#fff
```

---

## 🔒 Security Architecture

```mermaid
flowchart TD
    INPUT[User Input] --> VALIDATE[Input Validation]
    VALIDATE --> LENGTH{Length Check<br/>≤ 200 chars}
    
    LENGTH -->|Fail| REJECT[Reject Input]
    LENGTH -->|Pass| CHARS{Character Filter<br/>Allowed chars only}
    
    CHARS -->|Fail| REJECT
    CHARS -->|Pass| ESCAPE[HTML Escaping<br/>&, <, >, ", ']
    
    ESCAPE --> TRIM[Trim & Normalize<br/>Remove extra spaces]
    TRIM --> STORE[Store Safely]
    
    STORE --> RENDER[Render with textContent<br/>Never innerHTML]
    RENDER --> DISPLAY[Safe Display]
    
    REJECT --> ERROR[Show Error Message]
    ERROR --> INPUT
    
    style VALIDATE fill:#ef4444,color:#fff
    style ESCAPE fill:#f59e0b,color:#fff
    style RENDER fill:#10b981,color:#fff
```

---

## 🎨 UI State Management

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Empty : No tasks found
    Loading --> Populated : Tasks loaded
    
    Empty --> Populated : Task added
    Populated --> Empty : All tasks deleted
    
    Populated --> Filtered : Filter applied
    Filtered --> Populated : Show all
    
    state Populated {
        [*] --> AllTasks
        AllTasks --> ActiveTasks : Filter active
        AllTasks --> CompletedTasks : Filter completed
        ActiveTasks --> AllTasks : Show all
        CompletedTasks --> AllTasks : Show all
        ActiveTasks --> CompletedTasks : Filter completed
        CompletedTasks --> ActiveTasks : Filter active
    }
    
    state Theme {
        [*] --> Light
        Light --> Dark : Toggle theme
        Dark --> Light : Toggle theme
    }
```

---

## 🔄 PWA Architecture

```mermaid
graph TB
    subgraph "PWA Components"
        MANIFEST[Web App Manifest<br/>manifest.json]
        SW[Service Worker<br/>sw.js]
        CACHE_API[Cache API]
        BACKGROUND[Background Sync]
        PUSH[Push Notifications]
    end
    
    subgraph "Browser APIs"
        INSTALL[Install Prompt]
        OFFLINE[Offline Detection]
        STORAGE_API[Storage API]
        NOTIFICATION[Notification API]
    end
    
    subgraph "App Features"
        OFFLINE_WORK[Offline Functionality]
        INSTALL_APP[App Installation]
        PUSH_MSG[Push Messages]
        BACKGROUND_SYNC[Background Sync]
    end
    
    MANIFEST --> INSTALL
    INSTALL --> INSTALL_APP
    
    SW --> CACHE_API
    CACHE_API --> OFFLINE_WORK
    
    SW --> BACKGROUND
    BACKGROUND --> BACKGROUND_SYNC
    
    SW --> PUSH
    PUSH --> NOTIFICATION
    NOTIFICATION --> PUSH_MSG
    
    style MANIFEST fill:#3b82f6,color:#fff
    style SW fill:#10b981,color:#fff
    style OFFLINE_WORK fill:#f59e0b,color:#fff
```

---

## 📱 Responsive Design Breakpoints

```
Mobile First Approach:

┌─────────────────────────────────────────────────────────────────┐
│                     Breakpoint Strategy                        │
├─────────────────────────────────────────────────────────────────┤
│ 320px+  │ Mobile Portrait  │ Single column, stacked layout   │
│ 480px+  │ Mobile Landscape │ Slightly wider, same layout     │
│ 768px+  │ Tablet Portrait  │ Two-column in some sections     │
│ 1024px+ │ Tablet Landscape │ Full desktop layout starts     │
│ 1280px+ │ Desktop          │ Centered layout, max-width      │
└─────────────────────────────────────────────────────────────────┘

Layout Adaptations:

Mobile (320px-767px):
┌─────────────────┐
│     Header      │
├─────────────────┤
│   Task Input    │
├─────────────────┤
│  Filter Buttons │
│  (Stacked)      │
├─────────────────┤
│   Task List     │
│   (Full width)  │
├─────────────────┤
│  Bulk Actions   │
│  (Stacked)      │
├─────────────────┤
│     Footer      │
└─────────────────┘

Tablet/Desktop (768px+):
┌─────────────────────────────────┐
│           Header                │
├─────────────────────────────────┤
│         Task Input              │
├─────────────────────────────────┤
│      Filter Buttons (Row)       │
├─────────────────────────────────┤
│         Task List               │
│       (Centered, Max-width)     │
├─────────────────────────────────┤
│     Bulk Actions (Row)          │
├─────────────────────────────────┤
│           Footer                │
└─────────────────────────────────┘
```

---

## 🧪 Testing Strategy Overview

```mermaid
graph TD
    subgraph "Testing Pyramid"
        E2E[End-to-End Tests<br/>Complete user workflows]
        INT[Integration Tests<br/>Module interactions]
        UNIT[Unit Tests<br/>Individual functions]
    end
    
    subgraph "Testing Types"
        FUNC[Functional Testing<br/>Feature validation]
        PERF[Performance Testing<br/>Load & speed tests]
        ACCESS[Accessibility Testing<br/>WCAG compliance]
        CROSS[Cross-browser Testing<br/>Browser compatibility]
    end
    
    subgraph "Testing Tools"
        MANUAL[Manual Testing<br/>Human verification]
        AUTO[Automated Testing<br/>Script-based tests]
        LIGHTHOUSE[Lighthouse Audits<br/>PWA & Performance]
    end
    
    UNIT --> INT
    INT --> E2E
    
    FUNC --> MANUAL
    PERF --> LIGHTHOUSE
    ACCESS --> AUTO
    CROSS --> MANUAL
    
    style E2E fill:#ef4444,color:#fff
    style INT fill:#f59e0b,color:#fff
    style UNIT fill:#10b981,color:#fff
```

---

## 🚀 Deployment Architecture

```mermaid
flowchart TB
    subgraph "Development"
        DEV[Local Development<br/>http-server / Live Server]
        TEST[Testing<br/>Manual & Automated]
    end
    
    subgraph "Build Process"
        LINT[Code Linting<br/>ESLint validation]
        MIN[Minification<br/>Optional CSS/JS compression]
        OPT[Optimization<br/>Image & asset optimization]
    end
    
    subgraph "Deployment Options"
        NETLIFY[Netlify<br/>Drag & drop deployment]
        VERCEL[Vercel<br/>CLI deployment]
        GITHUB[GitHub Pages<br/>Git-based deployment]
        CUSTOM[Custom Server<br/>Apache/Nginx]
    end
    
    subgraph "Production Features"
        HTTPS[HTTPS Enabled<br/>SSL certificate]
        CDN[CDN Assets<br/>Global distribution]
        COMPRESS[Gzip Compression<br/>Reduced file sizes]
        CACHE[Browser Caching<br/>Optimized headers]
    end
    
    DEV --> TEST
    TEST --> LINT
    LINT --> MIN
    MIN --> OPT
    OPT --> NETLIFY
    OPT --> VERCEL
    OPT --> GITHUB
    OPT --> CUSTOM
    
    NETLIFY --> HTTPS
    VERCEL --> CDN
    GITHUB --> COMPRESS
    CUSTOM --> CACHE
    
    style DEV fill:#3b82f6,color:#fff
    style NETLIFY fill:#10b981,color:#fff
    style HTTPS fill:#ef4444,color:#fff
```

---

## 🔧 Error Handling Flow

```mermaid
flowchart TD
    ERROR[Error Occurs] --> TYPE{Error Type}
    
    TYPE -->|Validation Error| VALID_ERR[Input Validation<br/>User-friendly message]
    TYPE -->|Storage Error| STORE_ERR[localStorage Failure<br/>Fallback to memory]
    TYPE -->|Network Error| NET_ERR[Service Worker<br/>Offline handling]
    TYPE -->|JavaScript Error| JS_ERR[Runtime Error<br/>Global error handler]
    
    VALID_ERR --> USER_FEEDBACK[Show Error Toast<br/>Highlight input field]
    STORE_ERR --> FALLBACK[Memory Storage<br/>Session-only data]
    NET_ERR --> OFFLINE[Offline Mode<br/>Cached resources]
    JS_ERR --> REPORT[Error Reporting<br/>Console logging]
    
    USER_FEEDBACK --> RECOVER[User Can Retry<br/>Clear error state]
    FALLBACK --> WARN[Storage Warning<br/>Inform user]
    OFFLINE --> SYNC[Background Sync<br/>When online]
    REPORT --> GRACEFUL[Graceful Degradation<br/>App continues]
    
    style ERROR fill:#ef4444,color:#fff
    style RECOVER fill:#10b981,color:#fff
    style GRACEFUL fill:#3b82f6,color:#fff
```

---

## 📊 Performance Metrics Dashboard

```
Performance Monitoring Points:

┌─────────────────────────────────────────────────────────────────┐
│                    Core Web Vitals                             │
├─────────────────────────────────────────────────────────────────┤
│ LCP (Largest Contentful Paint)  │ < 2.5s    │ Page load speed │
│ FID (First Input Delay)         │ < 100ms   │ Interactivity   │
│ CLS (Cumulative Layout Shift)   │ < 0.1     │ Visual stability│
├─────────────────────────────────────────────────────────────────┤
│                 Additional Metrics                              │
├─────────────────────────────────────────────────────────────────┤
│ TTI (Time to Interactive)       │ < 3.8s    │ App readiness   │
│ Speed Index                     │ < 3.4s    │ Visual progress │
│ First Contentful Paint          │ < 1.8s    │ Initial render  │
├─────────────────────────────────────────────────────────────────┤
│               Bundle Size Targets                               │
├─────────────────────────────────────────────────────────────────┤
│ Total JavaScript                │ < 50KB    │ Uncompressed    │
│ Total CSS                       │ < 30KB    │ Uncompressed    │
│ Critical Path Resources         │ < 14KB    │ Above-the-fold  │
└─────────────────────────────────────────────────────────────────┘

Memory Usage Tracking:

Application State: ~1-5KB
DOM Elements: ~10-50KB (depending on task count)
Event Listeners: ~1KB
Cache Storage: ~100KB-1MB (Service Worker cache)
localStorage: ~10-100KB (task data)
```

---

This comprehensive set of architecture diagrams provides visual representations of all key aspects of the TaskFlow Lite application, from high-level system architecture to detailed event flows and performance considerations. These diagrams complement the technical documentation and help developers understand the application's structure and behavior patterns.
