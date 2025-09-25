/**
 * Dashboard JavaScript for Spendee application
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const balanceElement = document.getElementById('totalBalance');
    const incomeElement = document.getElementById('totalIncome');
    const expenseElement = document.getElementById('totalExpense');
    const savingsElement = document.getElementById('totalSavings');
    const recentTransactionsContainer = document.getElementById('recentTransactions');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noTransactionsMessage = document.getElementById('noTransactionsMessage');

    // API endpoints
    const API_URL = '/api';
    const DASHBOARD_SUMMARY_ENDPOINT = `${API_URL}/dashboard/summary`;
    const RECENT_TRANSACTIONS_ENDPOINT = `${API_URL}/dashboard/transactions`;

    // Initialize page
    init();

    /**
     * Initialize the dashboard
     */
    function init() {
        // Load dashboard data
        fetchDashboardSummary();
        fetchRecentTransactions();
    }

    /**
     * Fetch dashboard summary data
     */
    function fetchDashboardSummary() {
        fetch(DASHBOARD_SUMMARY_ENDPOINT)
            .then(handleResponse)
            .then(summary => {
                // Update the UI with the summary data
                updateDashboardSummary(summary);
            })
            .catch(error => {
                console.error('Error fetching dashboard summary:', error);
                // Show error in UI if needed
            });
    }

    /**
     * Fetch recent transactions data
     */
    function fetchRecentTransactions() {
        if (loadingIndicator) loadingIndicator.classList.remove('d-none');
        if (noTransactionsMessage) noTransactionsMessage.classList.add('d-none');

        fetch(RECENT_TRANSACTIONS_ENDPOINT)
            .then(handleResponse)
            .then(transactions => {
                if (loadingIndicator) loadingIndicator.classList.add('d-none');

                if (!transactions || transactions.length === 0) {
                    if (noTransactionsMessage) noTransactionsMessage.classList.remove('d-none');
                } else {
                    // Display the most recent 5 transactions
                    renderRecentTransactions(transactions.slice(0, 5));
                }
            })
            .catch(error => {
                if (loadingIndicator) loadingIndicator.classList.add('d-none');
                console.error('Error fetching recent transactions:', error);
                // Show error in UI if needed
            });
    }

    /**
     * Update dashboard summary UI
     */
    function updateDashboardSummary(summary) {
        if (balanceElement) {
            balanceElement.textContent = formatCurrency(summary.monthlySavings);
        }
        
        if (incomeElement) {
            incomeElement.textContent = formatCurrency(summary.monthlyIncome);
        }
        
        if (expenseElement) {
            expenseElement.textContent = formatCurrency(summary.monthlyExpenses);
        }
        
        if (savingsElement) {
            // Use backend-provided savings
            savingsElement.textContent = formatCurrency(summary.monthlySavings);
        }
    }

    /**
     * Render recent transactions
     */
    function renderRecentTransactions(transactions) {
        if (!recentTransactionsContainer) return;
        
        // Clear existing content
        recentTransactionsContainer.innerHTML = '';

        // Add each transaction as a card
        transactions.forEach(transaction => {
            const isIncome = transaction.type === 'INCOME';
            const transactionCard = document.createElement('div');
            transactionCard.className = 'card mb-2 p-2';
            transactionCard.style = 'border-radius:1rem;';
            
            transactionCard.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="bg-${isIncome ? 'success' : 'danger'} rounded-circle d-flex align-items-center justify-content-center me-3" style="width:40px;height:40px;">
                        <i class="fas fa-arrow-${isIncome ? 'up' : 'down'} text-white"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-semibold text-white">${transaction.description || '(No Name)'}</div>
                        <div class="text-light opacity-75" style="font-size:0.95rem;">${transaction.categoryName || 'Uncategorized'}</div>
                        <div class="text-light opacity-75" style="font-size:0.85rem;">${formatDate(transaction.date)}</div>
                    </div>
                    <div class="fw-bold text-${isIncome ? 'success' : 'danger'}" style="font-size:1.1rem;">
                        ${isIncome ? '+ ' : '- '}${formatCurrency(transaction.amount)}
                    </div>
                </div>
            `;

            recentTransactionsContainer.appendChild(transactionCard);
        });
    }

    /**
     * Format currency for display
     */
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Format date for display
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    /**
     * Handle API response
     */
    function handleResponse(response) {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'An error occurred');
            });
        }
        return response.json();
    }
});
