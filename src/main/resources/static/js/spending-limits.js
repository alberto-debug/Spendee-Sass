/**
 * Spending Limits JavaScript for Spendee application
 */

document.addEventListener('DOMContentLoaded', () => {
    // API endpoints
    const API_URL = '/api';
    const SPENDING_LIMITS_ENDPOINT = `${API_URL}/spending-limits`;
    const CATEGORIES_ENDPOINT = `${API_URL}/categories`;

    // Initialize spending limits functionality
    initSpendingLimits();

    function initSpendingLimits() {
        loadSpendingLimits();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Add spending limit button click - more specific targeting
        document.addEventListener('click', (e) => {
            if (e.target.matches('#addSpendingLimitBtn') ||
                e.target.closest('#addSpendingLimitBtn') ||
                e.target.matches('.add-limit-btn-overlay') ||
                e.target.closest('.add-limit-btn-overlay')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add spending limit button clicked'); // Debug log
                showSpendingLimitModal();
            }
        });

        // View & Delete limits button click
        document.addEventListener('click', (e) => {
            if (e.target.matches('#viewSpendingLimitsBtn') ||
                e.target.closest('#viewSpendingLimitsBtn') ||
                e.target.matches('.view-limits-btn-overlay') ||
                e.target.closest('.view-limits-btn-overlay')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('View spending limits button clicked'); // Debug log
                showViewLimitsModal();
            }
        });

        // Alternative direct event listeners for the buttons
        const addLimitBtn = document.getElementById('addSpendingLimitBtn');
        if (addLimitBtn) {
            addLimitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Direct add button click'); // Debug log
                showSpendingLimitModal();
            });
        }

        const viewLimitsBtn = document.getElementById('viewSpendingLimitsBtn');
        if (viewLimitsBtn) {
            viewLimitsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Direct view button click'); // Debug log
                showViewLimitsModal();
            });
        }

        // Save spending limit button click
        document.addEventListener('click', (e) => {
            if (e.target.matches('#saveSpendingLimitBtn')) {
                saveSpendingLimit();
            }
        });

        // Close modal events
        document.addEventListener('click', (e) => {
            if (e.target.matches('#spendingLimitModal') || e.target.matches('#closeSpendingLimitModal')) {
                hideSpendingLimitModal();
            }
        });

        // Delete spending limit
        document.addEventListener('click', (e) => {
            if (e.target.matches('.delete-limit-btn')) {
                const limitId = e.target.dataset.limitId;
                deleteSpendingLimit(limitId);
            }
        });

        // Edit spending limit
        document.addEventListener('click', (e) => {
            if (e.target.matches('.edit-limit-btn')) {
                const limitId = e.target.dataset.limitId;
                editSpendingLimit(limitId);
            }
        });
    }

    async function loadSpendingLimits() {
        try {
            const response = await fetch(SPENDING_LIMITS_ENDPOINT);
            if (!response.ok) throw new Error('Failed to load spending limits');
            
            const limits = await response.json();
            renderSpendingLimits(limits);
        } catch (error) {
            console.error('Error loading spending limits:', error);
            showToast('Error loading spending limits', 'error');
        }
    }

    function renderSpendingLimits(limits) {
        const container = document.getElementById('spendingLimitsContainer');
        if (!container) return;

        if (limits.length === 0) {
            container.innerHTML = `
                <div class="no-limits-message">
                    <i class="fas fa-chart-line"></i>
                    <h3>No spending limits set</h3>
                    <p>Set spending limits to track your expenses and get notifications when you approach your limits.</p>
                    <button class="btn btn-primary" id="addSpendingLimitBtn">
                        <i class="fas fa-plus"></i> Add Spending Limit
                    </button>
                </div>
            `;
            return;
        }

        const limitsHtml = limits.map(limit => `
            <div class="spending-limit-card ${limit.isLimitExceeded ? 'exceeded' : limit.isThresholdExceeded ? 'warning' : ''}">
                <div class="limit-header">
                    <h4>${limit.categoryName}</h4>
                    <div class="limit-actions">
                        <button class="btn btn-sm btn-outline edit-limit-btn" data-limit-id="${limit.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline delete-limit-btn" data-limit-id="${limit.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="limit-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(limit.usagePercentage, 100)}%"></div>
                    </div>
                    <div class="progress-text">
                        $${limit.currentSpent} / $${limit.limitAmount}
                    </div>
                </div>
                <div class="limit-details">
                    <span class="limit-period">${limit.period}</span>
                    <span class="limit-remaining">
                        ${limit.remainingAmount >= 0 ? '$' + limit.remainingAmount + ' remaining' : '$' + Math.abs(limit.remainingAmount) + ' over limit'}
                    </span>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="spending-limits-header">
                <h3>Spending Limits</h3>
                <button class="btn btn-primary" id="addSpendingLimitBtn">
                    <i class="fas fa-plus"></i> Add Limit
                </button>
            </div>
            <div class="limits-grid">
                ${limitsHtml}
            </div>
        `;
    }

    async function showSpendingLimitModal(limitData = null) {
        try {
            // Load categories for the dropdown
            const categoriesResponse = await fetch(CATEGORIES_ENDPOINT);
            if (!categoriesResponse.ok) throw new Error('Failed to load categories');
            
            const categories = await categoriesResponse.json();
            
            const modalHtml = `
                <div class="modal-overlay" id="spendingLimitModal">
                    <div class="modal-content spending-limit-modal">
                        <div class="modal-header">
                            <h3>${limitData ? 'Edit Spending Limit' : 'Add Spending Limit'}</h3>
                            <button class="modal-close" id="closeSpendingLimitModal">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="spendingLimitForm">
                                <div class="form-group">
                                    <label for="limitCategory">Category</label>
                                    <select id="limitCategory" name="categoryId" required>
                                        <option value="">All Categories (Global Limit)</option>
                                        ${categories.map(cat => `
                                            <option value="${cat.id}" ${limitData?.categoryId === cat.id ? 'selected' : ''}>
                                                ${cat.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="limitAmount">Limit Amount ($)</label>
                                    <input type="number" id="limitAmount" name="limitAmount" step="0.01" min="0" 
                                           value="${limitData?.limitAmount || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label for="limitPeriod">Period</label>
                                    <select id="limitPeriod" name="period" required>
                                        <option value="DAILY" ${limitData?.period === 'DAILY' ? 'selected' : ''}>Daily</option>
                                        <option value="WEEKLY" ${limitData?.period === 'WEEKLY' ? 'selected' : ''}>Weekly</option>
                                        <option value="MONTHLY" ${limitData?.period === 'MONTHLY' ? 'selected' : ''}>Monthly</option>
                                        <option value="YEARLY" ${limitData?.period === 'YEARLY' ? 'selected' : ''}>Yearly</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="notificationThreshold">Warning Threshold (%)</label>
                                    <input type="number" id="notificationThreshold" name="notificationThreshold" 
                                           min="0" max="100" value="${(limitData?.notificationThreshold || 80)}" required>
                                    <small class="form-help">Get notified when spending reaches this percentage of the limit</small>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="closeSpendingLimitModal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveSpendingLimitBtn">
                                ${limitData ? 'Update Limit' : 'Add Limit'}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Store limit data for editing
            if (limitData) {
                document.getElementById('spendingLimitModal').dataset.limitId = limitData.id;
            }
            
        } catch (error) {
            console.error('Error showing spending limit modal:', error);
            showToast('Error loading form data', 'error');
        }
    }

    function hideSpendingLimitModal() {
        const modal = document.getElementById('spendingLimitModal');
        if (modal) {
            modal.remove();
        }
    }

    async function saveSpendingLimit() {
        const form = document.getElementById('spendingLimitForm');
        const formData = new FormData(form);
        const limitId = document.getElementById('spendingLimitModal').dataset.limitId;

        const requestData = {
            categoryId: formData.get('categoryId') || null,
            limitAmount: parseFloat(formData.get('limitAmount')),
            period: formData.get('period'),
            notificationThreshold: parseFloat(formData.get('notificationThreshold')) / 100
        };

        try {
            const url = limitId ? `${SPENDING_LIMITS_ENDPOINT}/${limitId}` : SPENDING_LIMITS_ENDPOINT;
            const method = limitId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save spending limit');
            }

            const result = await response.json();
            hideSpendingLimitModal();
            loadSpendingLimits();
            showToast(result.message || 'Spending limit saved successfully', 'success');

        } catch (error) {
            console.error('Error saving spending limit:', error);
            showToast(error.message, 'error');
        }
    }

    async function editSpendingLimit(limitId) {
        try {
            const response = await fetch(SPENDING_LIMITS_ENDPOINT);
            if (!response.ok) throw new Error('Failed to load spending limits');
            
            const limits = await response.json();
            const limitData = limits.find(limit => limit.id == limitId);
            
            if (limitData) {
                // Convert threshold back to percentage
                limitData.notificationThreshold = limitData.notificationThreshold * 100;
                showSpendingLimitModal(limitData);
            }
        } catch (error) {
            console.error('Error loading spending limit for edit:', error);
            showToast('Error loading spending limit data', 'error');
        }
    }

    async function deleteSpendingLimit(limitId) {
        if (!confirm('Are you sure you want to delete this spending limit?')) {
            return;
        }

        try {
            const response = await fetch(`${SPENDING_LIMITS_ENDPOINT}/${limitId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete spending limit');
            }

            const result = await response.json();
            loadSpendingLimits();
            showToast(result.message || 'Spending limit deleted successfully', 'success');

        } catch (error) {
            console.error('Error deleting spending limit:', error);
            showToast(error.message, 'error');
        }
    }

    async function showViewLimitsModal() {
        try {
            const response = await fetch(SPENDING_LIMITS_ENDPOINT);
            if (!response.ok) throw new Error('Failed to load spending limits');

            const limits = await response.json();

            const modalHtml = `
                <div class="modal-overlay" id="viewLimitsModal">
                    <div class="spending-limit-modal view-limits-modal">
                        <div class="modal-header">
                            <h3>Your Spending Limits</h3>
                            <button class="modal-close" id="closeViewLimitsModal">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${limits.length === 0 ? `
                                <div class="no-limits-view">
                                    <i class="fas fa-chart-line"></i>
                                    <h4>No spending limits set</h4>
                                    <p>You haven't created any spending limits yet.</p>
                                    <button class="btn btn-primary" id="addFirstLimitBtn">
                                        <i class="fas fa-plus"></i> Create Your First Limit
                                    </button>
                                </div>
                            ` : `
                                <div class="limits-list">
                                    ${limits.map(limit => `
                                        <div class="limit-view-item ${limit.isLimitExceeded ? 'exceeded' : limit.isThresholdExceeded ? 'warning' : ''}">
                                            <div class="limit-view-header">
                                                <div class="limit-info">
                                                    <h4>${limit.categoryName}</h4>
                                                    <span class="limit-period-badge">${limit.period.toLowerCase()}</span>
                                                </div>
                                                <div class="limit-actions">
                                                    <button class="btn btn-outline edit-limit-btn" data-limit-id="${limit.id}">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline delete-limit-btn" data-limit-id="${limit.id}">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="limit-progress-section">
                                                <div class="limit-amounts">
                                                    <span class="current-amount">$${limit.currentSpent.toFixed(2)}</span>
                                                    <span class="limit-amount">/ $${limit.limitAmount.toFixed(2)}</span>
                                                </div>
                                                <div class="progress-bar-view">
                                                    <div class="progress-fill-view ${limit.isLimitExceeded ? 'exceeded' : limit.isThresholdExceeded ? 'warning' : ''}" 
                                                         style="width: ${Math.min(limit.usagePercentage, 100)}%"></div>
                                                </div>
                                                <div class="progress-info">
                                                    <span class="usage-percent">${Math.round(limit.usagePercentage)}% used</span>
                                                    <span class="remaining ${limit.remainingAmount < 0 ? 'exceeded' : ''}">
                                                        ${limit.remainingAmount >= 0 ? '$' + limit.remainingAmount.toFixed(2) + ' remaining' : '$' + Math.abs(limit.remainingAmount).toFixed(2) + ' over limit'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="closeViewLimitsModal">Close</button>
                            ${limits.length > 0 ? '<button type="button" class="btn btn-primary" id="addAnotherLimitBtn"><i class="fas fa-plus"></i> Add Another Limit</button>' : ''}
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Setup event listeners for this modal
            setupViewLimitsModalListeners();

        } catch (error) {
            console.error('Error showing view limits modal:', error);
            showToast('Error loading spending limits', 'error');
        }
    }

    function setupViewLimitsModalListeners() {
        // Close modal events
        document.addEventListener('click', (e) => {
            if (e.target.matches('#viewLimitsModal') || e.target.matches('#closeViewLimitsModal')) {
                hideViewLimitsModal();
            }
        });

        // Add first limit button
        document.addEventListener('click', (e) => {
            if (e.target.matches('#addFirstLimitBtn')) {
                hideViewLimitsModal();
                showSpendingLimitModal();
            }
        });

        // Add another limit button
        document.addEventListener('click', (e) => {
            if (e.target.matches('#addAnotherLimitBtn')) {
                hideViewLimitsModal();
                showSpendingLimitModal();
            }
        });

        // Edit limit button
        document.addEventListener('click', (e) => {
            if (e.target.matches('.edit-limit-btn')) {
                const limitId = e.target.dataset.limitId;
                hideViewLimitsModal();
                editSpendingLimit(limitId);
            }
        });

        // Delete limit button
        document.addEventListener('click', (e) => {
            if (e.target.matches('.delete-limit-btn')) {
                const limitId = e.target.dataset.limitId;
                deleteSpendingLimit(limitId);
            }
        });
    }

    function hideViewLimitsModal() {
        const modal = document.getElementById('viewLimitsModal');
        if (modal) {
            modal.remove();
        }
    }

    // Helper function to show toast notifications
    function showToast(message, type = 'info') {
        // Use existing toast system if available, otherwise create a simple one
        if (typeof showToastNotification === 'function') {
            showToastNotification(message, type);
        } else {
            console.log(`Toast (${type}): ${message}`);
        }
    }

    // Export functions for global access
    window.spendingLimits = {
        loadSpendingLimits,
        showSpendingLimitModal,
        hideSpendingLimitModal
    };
});
