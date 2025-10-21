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

    // Load categories when transaction type changes
    document.getElementById('transactionType').addEventListener('change', loadCategories);

    // Initial load of categories
    loadCategories();

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

    function loadTransactions() {
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
    }

    function createTransactionCard(transaction) {
        const card = document.createElement('div');
        card.className = 'transaction-card p-3';

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
                <div>
                    <h6 class="mb-1">${transaction.description}</h6>
                    <small class="text-muted">${categoryName}</small>
                </div>
                <h5 class="mb-0 ${amountClass}">${amount}</h5>
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
});
