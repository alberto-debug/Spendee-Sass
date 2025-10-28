document.addEventListener('DOMContentLoaded', function() {
    // Get user's preferred currency from localStorage
    function getUserCurrency() {
        return localStorage.getItem('userCurrency') || 'USD';
    }

    // Get currency symbol based on currency code
    function getCurrencySymbol(currencyCode) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥'
        };
        return symbols[currencyCode] || '$';
    }

    // Create toast container if it doesn't exist
    if (!document.getElementById('toastContainer')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
        `;
        document.body.appendChild(toastContainer);
    }

    function showToast(type, message) {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        const toastId = 'toast-' + Date.now();

        const backgroundColor = type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

        toast.id = toastId;
        toast.style.cssText = `
            background: ${backgroundColor};
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 0.5rem;
            min-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideIn 0.3s ease-out;
        `;

        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Add CSS animations
    if (!document.getElementById('toastAnimations')) {
        const style = document.createElement('style');
        style.id = 'toastAnimations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    const transactionModal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
    let categories = [];

    // Fetch user preferences and store in localStorage
    function fetchUserPreferences() {
        // If localStorage already has a currency, use it (user's choice takes precedence)
        const existingCurrency = localStorage.getItem('userCurrency');
        if (existingCurrency) {
            console.log('Transactions - Using saved currency from localStorage:', existingCurrency);
            return Promise.resolve();
        }

        // Only fetch from API if we don't have a saved preference
        return fetch('/api/user/me', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.preferences && data.preferences.currency) {
                const currency = data.preferences.currency;
                localStorage.setItem('userCurrency', currency);
                localStorage.setItem('userDateFormat', data.preferences.dateFormat || 'MM/DD/YYYY');
                console.log('Transactions - Loaded currency from API:', currency);
            } else {
                localStorage.setItem('userCurrency', 'USD');
                console.log('Transactions - Using default currency: USD');
            }
        })
        .catch(error => {
            console.error('Error fetching user preferences:', error);
            localStorage.setItem('userCurrency', 'USD');
        });
    }

    // Load user preferences first, then load transactions
    fetchUserPreferences().then(() => {
        // Load and display transactions after preferences are loaded
        loadTransactions();
    });

    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();

    // Wire the new type-cards UI (two clickable cards) to the hidden transactionType input
    (function wireTypeCards() {
        const transactionTypeInput = document.getElementById('transactionType');
        const typeCardsContainer = document.getElementById('transactionTypeCards');
        if (!transactionTypeInput || !typeCardsContainer) {
            // If modal isn't present on this page, fall back to older behavior (if a select exists)
            const sel = document.getElementById('transactionType');
            if (sel) {
                sel.addEventListener('change', loadCategories);
                loadCategories();
            }
            return;
        }

        const typeCards = Array.from(typeCardsContainer.querySelectorAll('.type-card'));

        function setTransactionType(type) {
            transactionTypeInput.value = type;
            typeCards.forEach(card => {
                const isActive = card.dataset.type === type;
                card.classList.toggle('active', isActive);
                card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
            // Load categories for the selected type
            loadCategories();
        }

        // Attach click & keyboard handlers for accessibility
        typeCards.forEach(card => {
            card.addEventListener('click', () => setTransactionType(card.dataset.type));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTransactionType(card.dataset.type);
                }
            });
        });

        // Initialize UI from hidden input value (default already set in template)
        const initial = transactionTypeInput.value || 'EXPENSE';
        setTransactionType(initial);
    })();

    // Format amount input as user types
    const amountInput = document.getElementById('amount');
    amountInput.addEventListener('input', function(e) {
        // Get cursor position before updating value
        const cursorPos = e.target.selectionStart;
        let value = e.target.value;

        // Remove any non-digit characters except decimal point
        value = value.replace(/[^\d.]/g, '');

        // Handle decimal points
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }

        // Format number
        if (value) {
            // Handle case where user is typing before decimal
            if (!value.includes('.')) {
                const num = parseFloat(value);
                value = num.toFixed(2);
            } else {
                // Ensure two decimal places but allow typing
                const decimals = parts[1] || '';
                if (decimals.length > 2) {
                    value = parts[0] + '.' + decimals.substring(0, 2);
                }
            }
        }

        e.target.value = value;

        // Restore cursor position if typing before decimal
        if (cursorPos <= parts[0].length) {
            e.target.setSelectionRange(cursorPos, cursorPos);
        }
    });

    // Handle focus to select all text
    amountInput.addEventListener('focus', function(e) {
        e.target.select();
    });

    // Handle blur to ensure proper format
    amountInput.addEventListener('blur', function(e) {
        let value = e.target.value;
        if (value) {
            e.target.value = parseFloat(value).toFixed(2);
        }
    });

    // Prevent scrolling from changing the number
    amountInput.addEventListener('wheel', function(e) {
        e.preventDefault();
    });

    // Handle transaction form submission
    document.getElementById('saveTransaction').addEventListener('click', function() {
        const form = document.getElementById('addTransactionForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const dateStr = document.getElementById('date').value;
        let amount = document.getElementById('amount').value;

        // Ensure amount is properly formatted with two decimal places
        amount = parseFloat(amount).toFixed(2);
        const categoryId = document.getElementById('category').value;

        const formData = {
            description: document.getElementById('description').value,
            amount: amount,
            date: dateStr,
            categoryId: categoryId || null,
            type: document.getElementById('transactionType').value
        };

        fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            },
            body: JSON.stringify(formData)
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add transaction');
            }
            return data;
        })
        .then(data => {
            showToast('success', 'Transaction added successfully');
            transactionModal.hide();
            form.reset();
            document.getElementById('date').valueAsDate = new Date();
            loadTransactions();
        })
        .catch(error => {
            showToast('error', error.message);
            console.error('Error:', error);
        });
    });

    function loadCategories() {
        const type = document.getElementById('transactionType').value;
        fetch(`/api/categories?type=${type}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            }
        })
        .then(response => response.json())
        .then(data => {
            categories = data;
            const categorySelect = document.getElementById('category');
            categorySelect.innerHTML = '<option value="">No Category</option>';
            data.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        })
        .catch(error => {
            showToast('error', 'Failed to load categories');
            console.error('Error:', error);
        });
    }

    // Load all categories (not filtered by type) for transaction display and editing
    function loadAllCategories() {
        return fetch('/api/categories', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            }
        })
        .then(response => response.json())
        .then(data => {
            categories = data;
            return data;
        })
        .catch(error => {
            showToast('error', 'Failed to load categories');
            console.error('Error:', error);
            return [];
        });
    }

    function loadTransactions() {
        // First load all categories, then load transactions
        loadAllCategories().then(() => {
            fetch('/api/transactions', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
                }
            })
            .then(response => response.json())
            .then(data => {
                const container = document.querySelector('.transactions-container');
                container.innerHTML = '';

                if (data.length === 0) {
                    container.innerHTML = `
                        <div class="text-center text-muted my-5">
                            <i class="fas fa-receipt fa-3x mb-3"></i>
                            <h5>No transactions yet</h5>
                            <p>Start by adding your first transaction!</p>
                        </div>
                    `;
                    return;
                }

                // Group transactions by date
                const grouped = groupTransactionsByDate(data);

                // Render grouped transactions
                Object.entries(grouped).forEach(([date, transactions]) => {
                    const dateHeader = document.createElement('h5');
                    dateHeader.className = 'mb-3 mt-4';
                    dateHeader.textContent = formatDate(date);
                    container.appendChild(dateHeader);

                    transactions.forEach(transaction => {
                        container.appendChild(createTransactionCard(transaction));
                    });
                });
            })
            .catch(error => {
                showToast('error', 'Failed to load transactions');
                console.error('Error:', error);
            });
        });
    }

    function createTransactionCard(transaction) {
        const card = document.createElement('div');
        card.className = 'transaction-card p-3';
        card.dataset.transactionId = transaction.id;

        let categoryName = 'Uncategorized';
        if (transaction.categoryId) {
            const category = categories.find(c => c.id === transaction.categoryId);
            if (category) {
                categoryName = category.name;
            }
        }

        const currencySymbol = getCurrencySymbol(getUserCurrency());
        console.log('Creating transaction card with currency:', getUserCurrency(), 'Symbol:', currencySymbol);
        const amount = transaction.type === 'EXPENSE' ? `-${currencySymbol}${transaction.amount.toFixed(2)}` : `+${currencySymbol}${transaction.amount.toFixed(2)}`;
        const amountClass = transaction.type === 'EXPENSE' ? 'text-danger' : 'text-success';

        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <input type="checkbox" class="form-check-input me-3 transaction-checkbox" data-transaction-id="${transaction.id}">
                    <div>
                        <h6 class="mb-1">${transaction.description}</h6>
                    <small class="category-name">${categoryName}</small>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <h5 class="mb-0 ${amountClass}">${amount}</h5>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><button class="dropdown-item edit-transaction" data-transaction-id="${transaction.id}">
                                <i class="fas fa-edit me-2"></i>Edit
                            </button></li>
                            <li><button class="dropdown-item categorize-transaction" data-transaction-id="${transaction.id}">
                                <i class="fas fa-tag me-2"></i>Categorize
                            </button></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><button class="dropdown-item text-danger delete-transaction" data-transaction-id="${transaction.id}">
                                <i class="fas fa-trash me-2"></i>Delete
                            </button></li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    function groupTransactionsByDate(transactions) {
        return transactions.reduce((groups, transaction) => {
            const date = transaction.date.split('T')[0];
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(transaction);
            return groups;
        }, {});
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateString === today.toISOString().split('T')[0]) {
            return 'Today';
        } else if (dateString === yesterday.toISOString().split('T')[0]) {
            return 'Yesterday';
        } else {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    // Initialize modals
    const editTransactionModal = new bootstrap.Modal(document.getElementById('editTransactionModal'));
    const bulkCategorizeModal = new bootstrap.Modal(document.getElementById('bulkCategorizeModal'));

    // Track selected transactions for bulk operations
    let selectedTransactions = new Set();

    // Event delegation for transaction actions
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-transaction') || e.target.closest('.edit-transaction')) {
            const button = e.target.classList.contains('edit-transaction') ? e.target : e.target.closest('.edit-transaction');
            const transactionId = button.dataset.transactionId;
            editTransaction(transactionId);
        }

        if (e.target.classList.contains('categorize-transaction') || e.target.closest('.categorize-transaction')) {
            const button = e.target.classList.contains('categorize-transaction') ? e.target : e.target.closest('.categorize-transaction');
            const transactionId = button.dataset.transactionId;
            showQuickCategorizeModal(transactionId);
        }

        if (e.target.classList.contains('delete-transaction') || e.target.closest('.delete-transaction')) {
            const button = e.target.classList.contains('delete-transaction') ? e.target : e.target.closest('.delete-transaction');
            const transactionId = button.dataset.transactionId;
            deleteTransaction(transactionId);
        }
    });

    // Handle transaction selection checkboxes
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('transaction-checkbox')) {
            const transactionId = e.target.dataset.transactionId;
            if (e.target.checked) {
                selectedTransactions.add(transactionId);
            } else {
                selectedTransactions.delete(transactionId);
            }
            updateBulkActionButtons();
        }
    });

    // Add bulk action buttons to the main content area, not navbar
    function addBulkActionButtons() {
        // Target the container-fluid div inside the section
        const containerFluid = document.querySelector('section .container-fluid');
        if (!containerFluid) {
            console.error('Could not find container-fluid');
            return;
        }

        const bulkActionsDiv = document.createElement('div');
        bulkActionsDiv.id = 'bulkActions';
        bulkActionsDiv.className = 'd-none mb-3';
        bulkActionsDiv.style.cssText = 'position: relative; z-index: 1;';
        bulkActionsDiv.innerHTML = `
            <div class="bulk-selection-bar">
                <div class="bulk-selection-content">
                    <span class="selection-text">
                        <i class="fas fa-check-circle me-2"></i>
                        <span id="selectedCount">0</span> transaction(s) selected
                    </span>
                    <div class="bulk-actions">
                        <button class="btn btn-sm btn-primary me-2" onclick="showBulkCategorizeModal()">
                            <i class="fas fa-tag me-1"></i>Categorize
                        </button>
                        <button class="btn btn-sm btn-outline-light" onclick="clearSelection()">
                            <i class="fas fa-times me-1"></i>Clear
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Insert right after the header div but before the transactions-container
        const headerDiv = containerFluid.querySelector('.d-flex.justify-content-between');
        if (headerDiv) {
            headerDiv.parentNode.insertBefore(bulkActionsDiv, headerDiv.nextSibling);
        } else {
            // Fallback: insert at the beginning of container-fluid
            containerFluid.insertBefore(bulkActionsDiv, containerFluid.firstChild);
        }
    }

    // Update bulk action buttons visibility
    function updateBulkActionButtons() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');

        if (!bulkActions) {
            addBulkActionButtons();
        }

        if (selectedTransactions.size > 0) {
            bulkActions.classList.remove('d-none');
            selectedCount.textContent = selectedTransactions.size;
        } else {
            bulkActions.classList.add('d-none');
        }
    }

    // Clear selection
    window.clearSelection = function() {
        selectedTransactions.clear();
        document.querySelectorAll('.transaction-checkbox').forEach(cb => cb.checked = false);
        updateBulkActionButtons();
    };

    // Edit transaction function
    function editTransaction(transactionId) {
        // Find transaction in loaded data
        fetch(`/api/transactions/${transactionId}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            }
        })
        .then(response => response.json())
        .then(transaction => {
            // Populate edit form
            document.getElementById('editTransactionId').value = transaction.id;
            document.getElementById('editTransactionType').value = transaction.type;
            document.getElementById('editAmount').value = transaction.amount.toFixed(2);
            document.getElementById('editDescription').value = transaction.description;
            document.getElementById('editDate').value = transaction.date;

            // Load categories for the transaction type and set selected category
            loadCategoriesForEdit(transaction.type, transaction.categoryId);

            editTransactionModal.show();
        })
        .catch(error => {
            showToast('error', 'Failed to load transaction details');
            console.error('Error:', error);
        });
    }

    // Load categories for edit modal
    function loadCategoriesForEdit(type, selectedCategoryId = null) {
        // Load all categories, not just filtered by type
        fetch('/api/categories', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            }
        })
        .then(response => response.json())
        .then(data => {
            const categorySelect = document.getElementById('editCategory');
            categorySelect.innerHTML = '<option value="">No Category</option>';
            data.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                if (category.id == selectedCategoryId) {
                    option.selected = true;
                }
                categorySelect.appendChild(option);
            });

            // Also load for bulk categorize modal
            loadCategoriesForBulk(data);
        })
        .catch(error => {
            showToast('error', 'Failed to load categories');
            console.error('Error:', error);
        });
    }

    // Load categories for bulk categorize modal
    function loadCategoriesForBulk(categoriesData) {
        const categorySelect = document.getElementById('bulkCategory');
        categorySelect.innerHTML = '<option value="">No Category</option>';
        categoriesData.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    // Handle edit transaction type change
    document.getElementById('editTransactionType').addEventListener('change', function() {
        const type = this.value;
        loadCategoriesForEdit(type);
    });

    // Handle update transaction
    document.getElementById('updateTransaction').addEventListener('click', function() {
        const form = document.getElementById('editTransactionForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const transactionId = document.getElementById('editTransactionId').value;
        const categoryId = document.getElementById('editCategory').value;
        let amount = document.getElementById('editAmount').value;
        amount = parseFloat(amount).toFixed(2);

        const formData = {
            description: document.getElementById('editDescription').value,
            amount: amount,
            date: document.getElementById('editDate').value,
            categoryId: categoryId || null,
            type: document.getElementById('editTransactionType').value
        };

        fetch(`/api/transactions/${transactionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            },
            body: JSON.stringify(formData)
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update transaction');
            }
            return data;
        })
        .then(data => {
            showToast('success', 'Transaction updated successfully');
            editTransactionModal.hide();
            loadTransactions();
        })
        .catch(error => {
            showToast('error', error.message);
            console.error('Error:', error);
        });
    });

    // Show bulk categorize modal
    window.showBulkCategorizeModal = function() {
        if (selectedTransactions.size === 0) {
            showToast('error', 'Please select transactions to categorize');
            return;
        }

        // Load categories before showing modal
        loadCategoriesForBulkModal().then(() => {
            document.getElementById('selectedCount').textContent = selectedTransactions.size;
            bulkCategorizeModal.show();
        });
    };

    // Load categories specifically for bulk categorize modal
    function loadCategoriesForBulkModal() {
        return fetch('/api/categories', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            }
        })
        .then(response => response.json())
        .then(data => {
            loadCategoriesForBulk(data);
            return data;
        })
        .catch(error => {
            showToast('error', 'Failed to load categories');
            console.error('Error:', error);
            return [];
        });
    }

    // Handle bulk categorize
    document.getElementById('bulkCategorizeBtn').addEventListener('click', function() {
        const categoryId = document.getElementById('bulkCategory').value;
        const transactionIds = Array.from(selectedTransactions);

        const requestData = {
            transactionIds: transactionIds,
            categoryId: categoryId || null
        };

        fetch('/api/transactions/bulk-categorize', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            },
            body: JSON.stringify(requestData)
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to categorize transactions');
            }
            return data;
        })
        .then(data => {
            const categoryName = categoryId ?
                document.querySelector(`#bulkCategory option[value="${categoryId}"]`).textContent :
                'No Category';
            showToast('success', `${transactionIds.length} transaction(s) categorized as "${categoryName}"`);
            bulkCategorizeModal.hide();
            clearSelection();
            loadTransactions();
        })
        .catch(error => {
            showToast('error', error.message);
            console.error('Error:', error);
        });
    });

    // Quick categorize function for individual transactions
    function showQuickCategorizeModal(transactionId) {
        selectedTransactions.clear();
        selectedTransactions.add(transactionId);

        // Load categories before showing modal
        loadCategoriesForBulkModal().then(() => {
            document.getElementById('selectedCount').textContent = 1;
            bulkCategorizeModal.show();
        });
    }

    // Delete transaction function
    function deleteTransaction(transactionId) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        fetch(`/api/transactions/${transactionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete transaction');
            }
            showToast('success', 'Transaction deleted successfully');
            loadTransactions();
        })
        .catch(error => {
            showToast('error', error.message);
            console.error('Error:', error);
        });
    }

    // M-Pesa Statement Upload Functionality
    const mpesaFileInput = document.getElementById('mpesaFile');
    const uploadMpesaBtn = document.getElementById('uploadMpesaBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const uploadResult = document.getElementById('uploadResult');

    // Show file info when file is selected
    mpesaFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            fileInfo.classList.remove('d-none');
            uploadResult.classList.add('d-none');
        }
    });

    // Handle M-Pesa statement upload
    uploadMpesaBtn.addEventListener('click', function() {
        const file = mpesaFileInput.files[0];

        if (!file) {
            showToast('error', 'Please select a PDF file to upload');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showToast('error', 'Only PDF files are supported');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            showToast('error', 'File size must be less than 10MB');
            return;
        }

        // Disable button and show progress
        uploadMpesaBtn.disabled = true;
        uploadMpesaBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
        uploadProgress.classList.remove('d-none');
        uploadResult.classList.add('d-none');

        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress >= 90) {
                clearInterval(progressInterval);
            }
            progressBar.style.width = progress + '%';
            progressText.textContent = progress + '%';
        }, 200);

        // Create FormData and upload
        const formData = new FormData();
        formData.append('file', file);

        fetch('/api/mpesa/upload-statement', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            },
            body: formData
        })
        .then(response => {
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            progressText.textContent = '100%';
            return response.json();
        })
        .then(data => {
            uploadProgress.classList.add('d-none');

            if (data.success) {
                // Show success message with details
                uploadResult.innerHTML = `
                    <div class="alert alert-success" style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.3); color: #86efac;">
                        <h6 class="mb-2"><i class="fas fa-check-circle me-2"></i>Import Successful!</h6>
                        <ul class="mb-0 ps-3" style="font-size: 0.9rem;">
                            <li>Total transactions found: ${data.totalTransactions}</li>
                            <li>New transactions saved: ${data.savedTransactions}</li>
                            <li>Duplicates skipped: ${data.skippedTransactions}</li>
                            <li>Total income: ${formatCurrency(data.totalIncome)}</li>
                            <li>Total expenses: ${formatCurrency(data.totalExpense)}</li>
                        </ul>
                    </div>
                `;
                uploadResult.classList.remove('d-none');

                showToast('success', data.message);

                // Reload transactions after 2 seconds
                setTimeout(() => {
                    loadTransactions();
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('mpesaUploadModal'));
                    modal.hide();
                    // Reset form
                    document.getElementById('mpesaUploadForm').reset();
                    fileInfo.classList.add('d-none');
                    uploadResult.classList.add('d-none');
                }, 2000);
            } else {
                // Show error message
                uploadResult.innerHTML = `
                    <div class="alert alert-danger" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5;">
                        <h6 class="mb-2"><i class="fas fa-exclamation-circle me-2"></i>Upload Failed</h6>
                        <p class="mb-0">${data.error || 'An error occurred while processing the statement'}</p>
                    </div>
                `;
                uploadResult.classList.remove('d-none');
                showToast('error', data.error || 'Failed to process statement');
            }
        })
        .catch(error => {
            clearInterval(progressInterval);
            uploadProgress.classList.add('d-none');

            uploadResult.innerHTML = `
                <div class="alert alert-danger" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5;">
                    <h6 class="mb-2"><i class="fas fa-exclamation-circle me-2"></i>Upload Failed</h6>
                    <p class="mb-0">An error occurred while uploading the statement. Please try again.</p>
                </div>
            `;
            uploadResult.classList.remove('d-none');

            showToast('error', 'Failed to upload statement');
            console.error('Error:', error);
        })
        .finally(() => {
            // Re-enable button
            uploadMpesaBtn.disabled = false;
            uploadMpesaBtn.innerHTML = '<i class="fas fa-cloud-upload-alt me-2"></i>Upload & Import';
        });
    });

    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Reset modal when closed
    document.getElementById('mpesaUploadModal').addEventListener('hidden.bs.modal', function () {
        document.getElementById('mpesaUploadForm').reset();
        fileInfo.classList.add('d-none');
        uploadProgress.classList.add('d-none');
        uploadResult.classList.add('d-none');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
    });
});
