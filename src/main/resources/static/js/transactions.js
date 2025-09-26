/**
 * Transactions management JavaScript
 * Handles loading, filtering, and CRUD operations for transactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const transactionsContainer = document.getElementById('transactions-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noTransactionsMessage = document.getElementById('no-transactions');
    const dateRangeSelect = document.getElementById('date-range');
    const typeFilter = document.getElementById('transaction-type');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('transaction-search');
    const searchButton = document.getElementById('btn-search');
    const customDateRange = document.getElementById('custom-date-range');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    
    // Transaction modal elements
    const transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
    const modalTitle = document.getElementById('transactionModalLabel');
    const transactionForm = document.getElementById('transaction-form');
    const transactionId = document.getElementById('transaction-id');
    const transactionDescription = document.getElementById('transaction-description');
    const transactionAmount = document.getElementById('transaction-amount');
    const transactionDate = document.getElementById('transaction-date');
    const typeIncome = document.getElementById('type-income');
    const typeExpense = document.getElementById('type-expense');
    const transactionCategory = document.getElementById('transaction-category');
    const saveButton = document.getElementById('save-transaction');
    
    // New transaction buttons
    const newTransactionBtn = document.getElementById('btn-new-transaction');
    const mobileAddTransactionBtn = document.getElementById('mobile-add-transaction');
    const addFirstTransactionBtn = document.getElementById('btn-add-first-transaction');
    
    // Variables to store state
    let allTransactions = [];
    let filteredTransactions = [];
    let categories = [];
    
    // Initialize the page
    initPage();
    
    function initPage() {
        // Set default date range (current month)
        setDefaultDateRange();
        
        // Load categories for dropdown
        loadCategories();
        
        // Load transactions
        loadTransactions();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    function setDefaultDateRange() {
        // Set today's date as default for transaction date
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        
        if (transactionDate) {
            transactionDate.value = formattedDate;
        }
        
        // Set current month as default for date range filter
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        if (dateFrom) {
            dateFrom.value = firstDay.toISOString().split('T')[0];
        }
        
        if (dateTo) {
            dateTo.value = lastDay.toISOString().split('T')[0];
        }
    }
    
    function setupEventListeners() {
        // Filter change events
        dateRangeSelect?.addEventListener('change', handleDateRangeChange);
        typeFilter?.addEventListener('change', applyFilters);
        categoryFilter?.addEventListener('change', applyFilters);
        searchButton?.addEventListener('click', applyFilters);
        searchInput?.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
        
        // Custom date range inputs
        dateFrom?.addEventListener('change', applyFilters);
        dateTo?.addEventListener('change', applyFilters);
        
        // New transaction buttons
        newTransactionBtn?.addEventListener('click', openNewTransactionModal);
        mobileAddTransactionBtn?.addEventListener('click', openNewTransactionModal);
        addFirstTransactionBtn?.addEventListener('click', openNewTransactionModal);
        
        // Save transaction
        saveButton?.addEventListener('click', saveTransaction);
    }
    
    function handleDateRangeChange() {
        const selectedValue = dateRangeSelect.value;
        
        // Show/hide custom date range inputs
        if (selectedValue === 'custom') {
            customDateRange.style.display = 'flex';
        } else {
            customDateRange.style.display = 'none';
            
            // Set predefined date ranges
            const today = new Date();
            let fromDate, toDate;
            
            switch(selectedValue) {
                case 'this-month':
                    fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    break;
                case 'last-month':
                    fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    toDate = new Date(today.getFullYear(), today.getMonth(), 0);
                    break;
                case '3-months':
                    fromDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                    toDate = today;
                    break;
                case '6-months':
                    fromDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
                    toDate = today;
                    break;
                case 'year':
                    fromDate = new Date(today.getFullYear(), 0, 1);
                    toDate = today;
                    break;
                case 'all':
                    fromDate = null;
                    toDate = null;
                    break;
            }
            
            if (fromDate) {
                dateFrom.value = fromDate.toISOString().split('T')[0];
            }
            
            if (toDate) {
                dateTo.value = toDate.toISOString().split('T')[0];
            }
        }
        
        // Apply filters with the new date range
        applyFilters();
    }
    
    async function loadCategories() {
        try {
            // Fetch all categories from the backend
            const response = await fetch('/api/categories', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load categories: ${response.statusText}`);
            }
            
            categories = await response.json();
            
            // Populate category dropdowns
            populateCategoryDropdowns();
        } catch (error) {
            console.error('Error loading categories:', error);
            notify?.error('Failed to load categories. Please try refreshing the page.');
        }
    }
    
    function populateCategoryDropdowns() {
        // Filter dropdown
        if (categoryFilter) {
            // Keep the "All Categories" option
            categoryFilter.innerHTML = '<option value="all" selected>All Categories</option>';
            
            // Add categories
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }
        
        // Transaction form dropdown
        if (transactionCategory) {
            // Clear previous options but keep the placeholder
            transactionCategory.innerHTML = '<option value="" disabled selected>Select a category</option>';
            
            // Add categories
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                transactionCategory.appendChild(option);
            });
        }
    }
    
    async function loadTransactions() {
        try {
            showLoading(true);
            
            // Fetch all transactions from the backend
            const response = await fetch('/api/dashboard/transactions', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load transactions: ${response.statusText}`);
            }
            
            allTransactions = await response.json();
            
            // Apply filters to the loaded transactions
            applyFilters();
        } catch (error) {
            console.error('Error loading transactions:', error);
            notify?.error('Failed to load transactions. Please try refreshing the page.');
            showLoading(false);
            showNoTransactions(true);
        }
    }
    
    function applyFilters() {
        // Get filter values
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const selectedType = typeFilter?.value || 'all';
        const selectedCategory = categoryFilter?.value || 'all';
        const fromDateValue = dateFrom?.value;
        const toDateValue = dateTo?.value;
        
        // Convert date strings to Date objects for comparison
        const fromDate = fromDateValue ? new Date(fromDateValue) : null;
        const toDate = toDateValue ? new Date(toDateValue + 'T23:59:59') : null;
        
        // Apply filters to all transactions
        filteredTransactions = allTransactions.filter(transaction => {
            // Type filter
            if (selectedType !== 'all' && transaction.type !== selectedType) {
                return false;
            }
            
            // Category filter
            if (selectedCategory !== 'all' && transaction.categoryId.toString() !== selectedCategory) {
                return false;
            }
            
            // Date range filter
            if (fromDate && toDate) {
                const transactionDate = new Date(transaction.date);
                if (transactionDate < fromDate || transactionDate > toDate) {
                    return false;
                }
            }
            
            // Search term filter
            if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            return true;
        });
        
        // Sort transactions by date (newest first)
        filteredTransactions.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Render filtered transactions
        renderTransactions();
    }
    
    function renderTransactions() {
        // Clear previous content (except loading indicator and no transactions message)
        if (transactionsContainer) {
            Array.from(transactionsContainer.children).forEach(child => {
                if (child !== loadingIndicator && child !== noTransactionsMessage) {
                    child.remove();
                }
            });
        }
        
        // Hide loading indicator
        showLoading(false);
        
        // Show or hide no transactions message
        if (filteredTransactions.length === 0) {
            showNoTransactions(true);
            return;
        }
        
        showNoTransactions(false);
        
        // Group transactions by date
        const groupedTransactions = groupTransactionsByDate(filteredTransactions);
        
        // Render each group
        Object.keys(groupedTransactions).forEach(date => {
            const transactions = groupedTransactions[date];
            
            // Create date header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header mb-2 mt-4';
            dateHeader.innerHTML = `
                <h5 class="text-muted">${formatDateHeader(date)}</h5>
                <hr>
            `;
            transactionsContainer.appendChild(dateHeader);
            
            // Create transactions group
            const transactionsGroup = document.createElement('div');
            transactionsGroup.className = 'transactions-group';
            
            // Add each transaction
            transactions.forEach(transaction => {
                const transactionCard = document.createElement('div');
                transactionCard.className = 'card transaction-card mb-3';
                transactionCard.innerHTML = `
                    <div class="card-body p-3">
                        <div class="d-flex align-items-center">
                            <div class="${transaction.type === 'INCOME' ? 'income-indicator' : 'expense-indicator'} me-3">
                                <i class="fas fa-${transaction.type === 'INCOME' ? 'arrow-up' : 'arrow-down'}"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">${transaction.description}</h5>
                                <div class="text-muted small">${transaction.categoryName} • ${formatDate(transaction.date)}</div>
                            </div>
                            <div class="text-end ms-3">
                                <div class="${transaction.type === 'INCOME' ? 'transaction-amount-income' : 'transaction-amount-expense'}">
                                    ${transaction.type === 'INCOME' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                                </div>
                                <div class="transaction-actions mt-2">
                                    <button class="btn btn-sm btn-outline-secondary btn-edit-transaction" data-id="${transaction.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger btn-delete-transaction" data-id="${transaction.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add event listeners for edit and delete buttons
                transactionCard.querySelector('.btn-edit-transaction').addEventListener('click', () => {
                    openEditTransactionModal(transaction);
                });
                
                transactionCard.querySelector('.btn-delete-transaction').addEventListener('click', () => {
                    deleteTransaction(transaction.id);
                });
                
                transactionsGroup.appendChild(transactionCard);
            });
            
            transactionsContainer.appendChild(transactionsGroup);
        });
    }
    
    function groupTransactionsByDate(transactions) {
        const groups = {};
        
        transactions.forEach(transaction => {
            // Use date as key (without time)
            const date = transaction.date.split('T')[0];
            
            if (!groups[date]) {
                groups[date] = [];
            }
            
            groups[date].push(transaction);
        });
        
        return groups;
    }
    
    function formatDateHeader(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        // Compare year, month, and day
        if (
            date.getFullYear() === today.getFullYear() && 
            date.getMonth() === today.getMonth() && 
            date.getDate() === today.getDate()
        ) {
            return 'Today';
        } else if (
            date.getFullYear() === yesterday.getFullYear() && 
            date.getMonth() === yesterday.getMonth() && 
            date.getDate() === yesterday.getDate()
        ) {
            return 'Yesterday';
        } else {
            // Format as month day, year
            return date.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            });
        }
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
    
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    function showLoading(show) {
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'block' : 'none';
        }
    }
    
    function showNoTransactions(show) {
        if (noTransactionsMessage) {
            noTransactionsMessage.style.display = show ? 'block' : 'none';
        }
    }
    
    function openNewTransactionModal() {
        // Reset form
        if (transactionForm) {
            transactionForm.reset();
        }
        
        // Set default values
        if (transactionId) {
            transactionId.value = ''; // New transaction doesn't have an ID
        }
        
        if (transactionDate) {
            // Set today's date as default
            const today = new Date();
            transactionDate.value = today.toISOString().split('T')[0];
        }
        
        if (typeExpense) {
            typeExpense.checked = true; // Default to expense
        }
        
        // Update modal title
        if (modalTitle) {
            modalTitle.textContent = 'New Transaction';
        }
        
        // Show the modal
        transactionModal.show();
    }
    
    function openEditTransactionModal(transaction) {
        // Fill form with transaction data
        if (transactionId) {
            transactionId.value = transaction.id;
        }
        
        if (transactionDescription) {
            transactionDescription.value = transaction.description;
        }
        
        if (transactionAmount) {
            transactionAmount.value = transaction.amount;
        }
        
        if (transactionDate) {
            transactionDate.value = transaction.date.split('T')[0];
        }
        
        if (typeIncome && typeExpense) {
            if (transaction.type === 'INCOME') {
                typeIncome.checked = true;
            } else {
                typeExpense.checked = true;
            }
        }
        
        if (transactionCategory) {
            transactionCategory.value = transaction.categoryId;
        }
        
        // Update modal title
        if (modalTitle) {
            modalTitle.textContent = 'Edit Transaction';
        }
        
        // Show the modal
        transactionModal.show();
    }
    
    async function saveTransaction() {
        try {
            // Validate form
            if (!transactionDescription.value || !transactionAmount.value || !transactionDate.value || !transactionCategory.value) {
                notify?.error('Please fill in all required fields');
                return;
            }
            
            // Prepare transaction data
            const transactionData = {
                description: transactionDescription.value,
                amount: parseFloat(transactionAmount.value),
                date: transactionDate.value,
                type: typeIncome.checked ? 'INCOME' : 'EXPENSE',
                categoryId: parseInt(transactionCategory.value)
            };
            
            // Add ID if editing an existing transaction
            if (transactionId.value) {
                transactionData.id = parseInt(transactionId.value);
            }
            
            // Save transaction
            const response = await fetch('/api/dashboard/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
                },
                body: JSON.stringify(transactionData)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to save transaction: ${response.statusText}`);
            }
            
            // Get the saved transaction from response
            const savedTransaction = await response.json();
            
            // Close the modal
            transactionModal.hide();
            
            // Show success message
            notify?.success('Transaction saved successfully');
            
            // Reload transactions to get the updated list
            loadTransactions();
        } catch (error) {
            console.error('Error saving transaction:', error);
            notify?.error('Failed to save transaction. Please try again.');
        }
    }
    
    async function deleteTransaction(id) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }
        
        try {
            // Send delete request to the backend
            const response = await fetch(`/api/dashboard/transactions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete transaction: ${response.statusText}`);
            }
            
            // Show success message
            notify?.success('Transaction deleted successfully');
            
            // Reload transactions to get the updated list
            loadTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            notify?.error('Failed to delete transaction. Please try again.');
        }
    }

    function notify(message, type = 'info') {
        // Simple notification using alert; replace with toast or custom UI as needed
        alert(`[${type.toUpperCase()}] ${message}`);
    }
});
