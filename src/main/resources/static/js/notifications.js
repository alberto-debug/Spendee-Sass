/**
 * Notifications JavaScript for Spendee application
 */

document.addEventListener('DOMContentLoaded', () => {
    // API endpoints
    const API_URL = '/api';
    const NOTIFICATIONS_ENDPOINT = `${API_URL}/notifications`;

    // Initialize notifications functionality
    initNotifications();

    function initNotifications() {
        loadUnreadNotificationCount();
        setupEventListeners();
        
        // Poll for new notifications every 30 seconds
        setInterval(loadUnreadNotificationCount, 30000);
    }

    function setupEventListeners() {
        // Notification bell click
        document.addEventListener('click', (e) => {
            if (e.target.matches('#notificationBell') || e.target.closest('#notificationBell')) {
                toggleNotificationDropdown();
            }
        });

        // Mark notification as read
        document.addEventListener('click', (e) => {
            if (e.target.matches('.notification-item') || e.target.closest('.notification-item')) {
                const notificationId = e.target.closest('.notification-item').dataset.notificationId;
                markNotificationAsRead(notificationId);
            }
        });

        // Mark all notifications as read
        document.addEventListener('click', (e) => {
            if (e.target.matches('#markAllReadBtn')) {
                markAllNotificationsAsRead();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            const bell = document.getElementById('notificationBell');
            
            if (dropdown && !dropdown.contains(e.target) && !bell.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    async function loadUnreadNotificationCount() {
        try {
            const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/unread/count`);
            if (!response.ok) throw new Error('Failed to load notification count');
            
            const count = await response.json();
            updateNotificationBadge(count);
        } catch (error) {
            console.error('Error loading notification count:', error);
        }
    }

    function updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    async function toggleNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        
        if (!dropdown) {
            await createNotificationDropdown();
        } else if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        } else {
            await loadNotifications();
            dropdown.classList.add('show');
        }
    }

    async function createNotificationDropdown() {
        const bellContainer = document.getElementById('notificationBell').parentElement;
        
        const dropdownHtml = `
            <div class="notification-dropdown" id="notificationDropdown">
                <div class="notification-header">
                    <h4>Notifications</h4>
                    <button class="btn btn-sm btn-link" id="markAllReadBtn">Mark all read</button>
                </div>
                <div class="notification-list" id="notificationList">
                    <div class="notification-loading">
                        <i class="fas fa-spinner fa-spin"></i> Loading...
                    </div>
                </div>
                <div class="notification-footer">
                    <a href="/notifications" class="btn btn-sm btn-link">View all notifications</a>
                </div>
            </div>
        `;
        
        bellContainer.insertAdjacentHTML('beforeend', dropdownHtml);
        
        await loadNotifications();
        document.getElementById('notificationDropdown').classList.add('show');
    }

    async function loadNotifications() {
        const listContainer = document.getElementById('notificationList');
        if (!listContainer) return;

        try {
            const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/unread`);
            if (!response.ok) throw new Error('Failed to load notifications');
            
            const notifications = await response.json();
            renderNotifications(notifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
            listContainer.innerHTML = `
                <div class="notification-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Failed to load notifications
                </div>
            `;
        }
    }

    function renderNotifications(notifications) {
        const listContainer = document.getElementById('notificationList');
        
        if (notifications.length === 0) {
            listContainer.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No new notifications</p>
                </div>
            `;
            return;
        }

        const notificationsHtml = notifications.slice(0, 10).map(notification => `
            <div class="notification-item ${notification.isRead ? 'read' : 'unread'}" 
                 data-notification-id="${notification.id}">
                <div class="notification-icon ${getNotificationIconClass(notification.type)}">
                    <i class="${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h5>${notification.title}</h5>
                    <p>${notification.message}</p>
                    <span class="notification-time">${formatNotificationTime(notification.createdAt)}</span>
                </div>
            </div>
        `).join('');

        listContainer.innerHTML = notificationsHtml;
    }

    function getNotificationIcon(type) {
        switch (type) {
            case 'SPENDING_LIMIT_WARNING':
                return 'fas fa-exclamation-triangle';
            case 'SPENDING_LIMIT_EXCEEDED':
                return 'fas fa-times-circle';
            case 'BUDGET_ALERT':
                return 'fas fa-chart-pie';
            case 'TRANSACTION_ALERT':
                return 'fas fa-credit-card';
            default:
                return 'fas fa-info-circle';
        }
    }

    function getNotificationIconClass(type) {
        switch (type) {
            case 'SPENDING_LIMIT_WARNING':
                return 'warning';
            case 'SPENDING_LIMIT_EXCEEDED':
                return 'danger';
            case 'BUDGET_ALERT':
                return 'info';
            case 'TRANSACTION_ALERT':
                return 'primary';
            default:
                return 'info';
        }
    }

    function formatNotificationTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    async function markNotificationAsRead(notificationId) {
        try {
            const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/${notificationId}/mark-read`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to mark notification as read');

            // Update UI
            const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
            if (notificationElement) {
                notificationElement.classList.remove('unread');
                notificationElement.classList.add('read');
            }

            // Update badge count
            loadUnreadNotificationCount();

        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async function markAllNotificationsAsRead() {
        try {
            const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/mark-all-read`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to mark all notifications as read');

            // Update UI
            document.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
                item.classList.add('read');
            });

            // Update badge count
            updateNotificationBadge(0);

        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    // Export functions for global access
    window.notifications = {
        loadUnreadNotificationCount,
        loadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
    };
});
