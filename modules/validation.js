/**
 * Validation Module - Form validation and error handling
 * Provides comprehensive validation with user-friendly error messages
 */

/**
 * Validation error class for structured error handling
 */
class ValidationError extends Error {
    constructor(message, field = null, code = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.code = code;
    }
}

/**
 * Validation rules configuration
 */
const VALIDATION_RULES = {
    task: {
        minLength: 1,
        maxLength: 200,
        required: true,
        allowedChars: /^[a-zA-Z0-9\s\-.,!?()[\]{}:;"'@#$%^&*+=_~`|\\/<>\u00C0-\u024F\u1E00-\u1EFF]*$/
    }
};

/**
 * Error messages for different validation scenarios
 */
const ERROR_MESSAGES = {
    REQUIRED: 'This field is required',
    TOO_SHORT: 'Task must be at least {min} character long',
    TOO_LONG: 'Task cannot exceed {max} characters',
    INVALID_CHARS: 'Task contains invalid characters',
    WHITESPACE_ONLY: 'Task cannot contain only whitespace',
    DUPLICATE: 'This task already exists',
    EMPTY_AFTER_TRIM: 'Task cannot be empty after removing extra spaces'
};

/**
 * Validate task input with comprehensive checks
 * @param {string} input - Task input string
 * @param {Array} existingTasks - Array of existing tasks (for duplicate check)
 * @returns {Object} - Validation result object
 */
export const validateTaskInput = (input, existingTasks = []) => {
    const result = {
        isValid: false,
        errors: [],
        warnings: [],
        cleaned: ''
    };

    try {
        // Convert input to string and handle null/undefined
        const value = String(input || '').trim();
        const rules = VALIDATION_RULES.task;

        // Required field check
        if (rules.required && !value) {
            result.errors.push({
                type: 'REQUIRED',
                message: ERROR_MESSAGES.REQUIRED,
                field: 'task'
            });
            return result;
        }

        // Empty after trim check
        if (value.length === 0 && input && input.length > 0) {
            result.errors.push({
                type: 'EMPTY_AFTER_TRIM',
                message: ERROR_MESSAGES.EMPTY_AFTER_TRIM,
                field: 'task'
            });
            return result;
        }

        // Length validation
        if (value.length < rules.minLength) {
            result.errors.push({
                type: 'TOO_SHORT',
                message: ERROR_MESSAGES.TOO_SHORT.replace('{min}', rules.minLength),
                field: 'task'
            });
        }

        if (value.length > rules.maxLength) {
            result.errors.push({
                type: 'TOO_LONG',
                message: ERROR_MESSAGES.TOO_LONG.replace('{max}', rules.maxLength),
                field: 'task'
            });
        }

        // Character validation
        if (!rules.allowedChars.test(value)) {
            result.errors.push({
                type: 'INVALID_CHARS',
                message: ERROR_MESSAGES.INVALID_CHARS,
                field: 'task'
            });
        }

        // Duplicate check
        if (existingTasks && existingTasks.length > 0) {
            const isDuplicate = existingTasks.some(task => 
                task.text.toLowerCase().trim() === value.toLowerCase()
            );
            
            if (isDuplicate) {
                result.errors.push({
                    type: 'DUPLICATE',
                    message: ERROR_MESSAGES.DUPLICATE,
                    field: 'task'
                });
            }
        }

        // Warnings for potential issues
        if (value.length > rules.maxLength * 0.8) {
            result.warnings.push({
                type: 'APPROACHING_LIMIT',
                message: `Approaching character limit (${value.length}/${rules.maxLength})`,
                field: 'task'
            });
        }

        // Check for excessive punctuation or special characters
        const specialCharCount = (value.match(/[^a-zA-Z0-9\s]/g) || []).length;
        const charRatio = specialCharCount / value.length;
        
        if (charRatio > 0.3 && value.length > 10) {
            result.warnings.push({
                type: 'MANY_SPECIAL_CHARS',
                message: 'Task contains many special characters',
                field: 'task'
            });
        }

        // Set cleaned value and validation status
        result.cleaned = value;
        result.isValid = result.errors.length === 0;

        return result;

    } catch (error) {
        result.errors.push({
            type: 'VALIDATION_ERROR',
            message: 'An error occurred during validation',
            field: 'task'
        });
        console.error('Validation error:', error);
        return result;
    }
};

/**
 * Real-time validation for input fields
 * @param {HTMLInputElement} inputElement - Input element to validate
 * @param {Array} existingTasks - Array of existing tasks
 * @returns {Object} - Validation result
 */
export const validateInputRealtime = (inputElement, existingTasks = []) => {
    if (!inputElement) {
        throw new ValidationError('Input element is required');
    }

    const result = validateTaskInput(inputElement.value, existingTasks);
    
    // Update visual feedback
    updateInputValidationUI(inputElement, result);
    
    return result;
};

/**
 * Update input validation UI with visual feedback
 * @param {HTMLInputElement} inputElement - Input element
 * @param {Object} validationResult - Validation result object
 */
const updateInputValidationUI = (inputElement, validationResult) => {
    const errorContainer = document.getElementById('input-error');
    const inputGroup = inputElement.closest('.input-group');
    
    // Reset states
    inputElement.classList.remove('error', 'warning');
    if (inputGroup) {
        inputGroup.classList.remove('error', 'warning');
    }
    
    // Clear previous error messages
    if (errorContainer) {
        errorContainer.innerHTML = '';
        errorContainer.classList.remove('show');
    }

    // Show errors
    if (validationResult.errors.length > 0) {
        inputElement.classList.add('error');
        if (inputGroup) {
            inputGroup.classList.add('error');
        }
        
        if (errorContainer) {
            const errorMessage = validationResult.errors[0].message;
            errorContainer.textContent = errorMessage;
            errorContainer.classList.add('show');
            
            // Add ARIA attributes for accessibility
            inputElement.setAttribute('aria-invalid', 'true');
            inputElement.setAttribute('aria-describedby', 'input-error');
        }
    } 
    // Show warnings
    else if (validationResult.warnings.length > 0) {
        inputElement.classList.add('warning');
        if (inputGroup) {
            inputGroup.classList.add('warning');
        }
        
        inputElement.setAttribute('aria-invalid', 'false');
        inputElement.removeAttribute('aria-describedby');
    }
    // Valid state
    else {
        inputElement.setAttribute('aria-invalid', 'false');
        inputElement.removeAttribute('aria-describedby');
    }
};

/**
 * Debounced validation function to prevent excessive validation calls
 * @param {Function} validationFn - Validation function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} - Debounced validation function
 */
export const debounceValidation = (validationFn, delay = 300) => {
    let timeoutId;
    
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => validationFn.apply(this, args), delay);
    };
};

/**
 * Sanitize input to prevent XSS and clean up formatting
 * @param {string} input - Raw input string
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    
    return input
        .trim()                           // Remove leading/trailing whitespace
        .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
        .replace(/[\r\n\t]/g, ' ')       // Replace line breaks and tabs with spaces
        .replace(/[<>]/g, '')            // Remove potential HTML tags
        .substring(0, VALIDATION_RULES.task.maxLength); // Enforce max length
};

/**
 * Validate form submission with comprehensive checks
 * @param {HTMLFormElement} formElement - Form element to validate
 * @param {Array} existingTasks - Array of existing tasks
 * @returns {Object} - Form validation result
 */
export const validateFormSubmission = (formElement, existingTasks = []) => {
    if (!formElement) {
        throw new ValidationError('Form element is required');
    }

    const result = {
        isValid: false,
        errors: [],
        data: {}
    };

    try {
        const formData = new FormData(formElement);
        const taskInput = formData.get('task') || formElement.querySelector('#task-input')?.value || '';
        
        const taskValidation = validateTaskInput(taskInput, existingTasks);
        
        if (!taskValidation.isValid) {
            result.errors.push(...taskValidation.errors);
        } else {
            result.data.task = taskValidation.cleaned;
            result.isValid = true;
        }

        return result;

    } catch (error) {
        result.errors.push({
            type: 'FORM_ERROR',
            message: 'Form validation failed',
            field: 'form'
        });
        console.error('Form validation error:', error);
        return result;
    }
};

/**
 * Create validation error message element
 * @param {Object} error - Error object
 * @returns {HTMLElement} - Error message element
 */
export const createErrorElement = (error) => {
    const errorElement = document.createElement('div');
    errorElement.className = 'validation-error';
    errorElement.textContent = error.message;
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    
    return errorElement;
};

/**
 * Show success validation feedback
 * @param {HTMLInputElement} inputElement - Input element
 */
export const showValidationSuccess = (inputElement) => {
    inputElement.classList.remove('error', 'warning');
    inputElement.classList.add('success');
    
    setTimeout(() => {
        inputElement.classList.remove('success');
    }, 2000);
};

/**
 * Get validation rules for a specific field
 * @param {string} fieldName - Name of the field
 * @returns {Object} - Validation rules object
 */
export const getValidationRules = (fieldName) => {
    return VALIDATION_RULES[fieldName] || {};
};

// Export ValidationError class for external error handling
export { ValidationError };
