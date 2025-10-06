/**
 * Toast notification system for authentication
 */

class ToastManager {
    constructor() {
        this.toastContainer = null;
        this.init();
        if (typeof console !== 'undefined') {
            console.log('[toast] ToastManager initialized');
        }
    }

    init() {
        // Create toast container if it doesn't exist
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds
     */
    show(message, type = 'info', duration = 5000) {
        if (typeof console !== 'undefined') {
            console.log(`[toast] show -> type=${type}, duration=${duration}, message=`, message);
        }
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Create icon based on type
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="fas fa-check-circle toast-icon"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-times-circle toast-icon"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle toast-icon"></i>';
                break;
            case 'info':
            default:
                icon = '<i class="fas fa-info-circle toast-icon"></i>';
                break;
        }

        // Set toast content
        toast.innerHTML = `
            <div class="toast-content">
                ${icon}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close notification">&times;</button>
            <div class="toast-progress">
                <div class="toast-progress-bar"></div>
            </div>
        `;

        // Add to container
        this.toastContainer.appendChild(toast);

        // Add close button functionality
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            this.closeToast(toast);
        });

        const progressBar = toast.querySelector('.toast-progress-bar');
        if (progressBar) {
            // Align progress animation with duration
            progressBar.style.animationDuration = `${duration}ms`;
        } else if (typeof console !== 'undefined') {
            console.warn('[toast] progress bar element missing');
        }

        // Auto-close after duration
        setTimeout(() => {
            this.closeToast(toast);
        }, duration);
    }

    /**
     * Close a toast with animation
     * @param {HTMLElement} toast - The toast element to close
     */
    closeToast(toast) {
        if (!toast) return;

        toast.classList.add('hide');

        // Remove from DOM after animation completes
        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Show a success toast
     * @param {string} message - The message to display
     * @param {number} duration - Duration in milliseconds
     */
    success(message, duration = 5000) {
        this.show(message, 'success', duration);
    }

    /**
     * Show an error toast
     * @param {string} message - The message to display
     * @param {number} duration - Duration in milliseconds
     */
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    }

    /**
     * Show a warning toast
     * @param {string} message - The message to display
     * @param {number} duration - Duration in milliseconds
     */
    warning(message, duration = 5000) {
        this.show(message, 'warning', duration);
    }

    /**
     * Show an info toast
     * @param {string} message - The message to display
     * @param {number} duration - Duration in milliseconds
     */
    info(message, duration = 5000) {
        this.show(message, 'info', duration);
    }
}

// Create a global notify object instance
window.notify = new ToastManager();

// For backward compatibility
window.toast = window.notify;

// Form validation functions
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    return password.length >= 8;
}

function validateField(field, validator) {
    const value = field.value;
    const isValid = validator(value);

    if (isValid) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
    }

    return isValid;
}
