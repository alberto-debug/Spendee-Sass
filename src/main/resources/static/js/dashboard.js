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
    const RECENT_TRANSACTIONS_ENDPOINT = `${API_URL}/dashboard/recent-transactions`;

    let financialChart = null;

    // Initialize page
    init();

    /**
     * Initialize the dashboard
     */
    function init() {
        showLoading();
        Promise.all([
            fetchDashboardSummary(),
            fetchRecentTransactions()
        ])
        .then(() => hideLoading())
        .catch(error => {
            console.error('Error initializing dashboard:', error);
            hideLoading();
            showError('Failed to load dashboard data');
        });
    }

    /**
     * Fetch dashboard summary data
     */
    function fetchDashboardSummary() {
        return fetch(DASHBOARD_SUMMARY_ENDPOINT)
            .then(handleResponse)
            .then(summary => {
                updateDashboardSummary(summary);
                initializeChart(summary);
            })
            .catch(error => {
                console.error('Error fetching dashboard summary:', error);
                showError('Failed to load summary data');
            });
    }

    /**
     * Fetch recent transactions
     */
    function fetchRecentTransactions() {
        return fetch(RECENT_TRANSACTIONS_ENDPOINT)
            .then(handleResponse)
            .then(transactions => {
                updateRecentTransactions(transactions);
            })
            .catch(error => {
                console.error('Error fetching recent transactions:', error);
                showError('Failed to load recent transactions');
            });
    }

    function initializeChart(summary) {
        const ctx = document.getElementById('financialChart')?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (financialChart instanceof Chart) {
            financialChart.destroy();
        }

        const monthlyIncome = summary.monthlyIncome || 0;
        const monthlyExpenses = summary.monthlyExpenses || 0;
        const previousMonthIncome = summary.previousMonthIncome || 0;
        const previousMonthExpenses = summary.previousMonthExpenses || 0;

        financialChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Previous Month', 'Current Month'],
                datasets: [
                    {
                        label: 'Income',
                        data: [previousMonthIncome, monthlyIncome],
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderColor: '#10B981',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#10B981',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        order: 1
                    },
                    {
                        label: 'Expenses',
                        data: [previousMonthExpenses, monthlyExpenses],
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderColor: '#EF4444',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#EF4444',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        order: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            callback: value => '$' + value.toLocaleString('en-US')
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        titleFont: {
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 13
                        },
                        bodySpacing: 8,
                        callbacks: {
                            label: context => {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += '$' + context.parsed.y.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                });
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    function updateDashboardSummary(summary) {
        if (incomeElement) incomeElement.textContent = formatCurrency(summary.monthlyIncome);
        if (expenseElement) expenseElement.textContent = formatCurrency(summary.monthlyExpenses);
        if (balanceElement) balanceElement.textContent = formatCurrency(summary.monthlyIncome - summary.monthlyExpenses);

        // Update change indicators
        updateChangeIndicator('incomeChange', summary.incomeChange);
        updateChangeIndicator('expenseChange', summary.expenseChange);
    }

    function updateRecentTransactions(transactions) {
        if (!recentTransactionsContainer) return;

        if (!transactions || transactions.length === 0) {
            showNoTransactions();
            return;
        }

        recentTransactionsContainer.innerHTML = transactions
            .map(transaction => createTransactionHTML(transaction))
            .join('');
    }

    function createTransactionHTML(transaction) {
        const typeClass = transaction.type.toLowerCase() === 'income' ? 'text-green-500' : 'text-red-500';
        const amount = transaction.type.toLowerCase() === 'income' ?
            `+${formatCurrency(transaction.amount)}` :
            `-${formatCurrency(transaction.amount)}`;

        return `
            <div class="transaction-item flex justify-between items-center p-3 border-b">
                <div class="flex flex-col">
                    <span class="font-medium">${transaction.description}</span>
                    <span class="text-sm text-gray-500">${formatDate(transaction.date)}</span>
                </div>
                <span class="${typeClass} font-medium">${amount}</span>
            </div>
        `;
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function updateChangeIndicator(elementId, changePercentage) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const isPositive = changePercentage > 0;
        const changeClass = isPositive ? 'text-green-500' : 'text-red-500';
        const arrowIcon = isPositive ? '↑' : '↓';

        element.className = `change-indicator ${changeClass}`;
        element.textContent = `${arrowIcon} ${Math.abs(changePercentage).toFixed(1)}%`;
    }

    function showLoading() {
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    }

    function hideLoading() {
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
    }

    function showError(message) {
        // Implement error display logic
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    function showNoTransactions() {
        if (noTransactionsMessage) {
            noTransactionsMessage.classList.remove('hidden');
        }
        if (recentTransactionsContainer) {
            recentTransactionsContainer.innerHTML = '';
        }
    }

    function handleResponse(response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
});
