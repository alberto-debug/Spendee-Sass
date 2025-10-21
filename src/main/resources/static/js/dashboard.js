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

    // Initialize page
    init();

    /**
     * Fetch user preferences and store in localStorage
     */
    function fetchUserPreferences() {
        // If localStorage already has a currency, use it (user's choice takes precedence)
        const existingCurrency = localStorage.getItem('userCurrency');
        if (existingCurrency) {
            console.log('Dashboard - Using saved currency from localStorage:', existingCurrency);
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
                console.log('Dashboard - Loaded currency from API:', currency);
            } else {
                localStorage.setItem('userCurrency', 'USD');
                console.log('Dashboard - Using default currency: USD');
            }
        })
        .catch(error => {
            console.error('Error fetching user preferences:', error);
            localStorage.setItem('userCurrency', 'USD');
        });
    }

    /**
     * Initialize the dashboard
     */
    function init() {
        showLoading();
        // First fetch user preferences, then load dashboard data
        fetchUserPreferences()
        .then(() => {
            return Promise.all([
                fetchDashboardSummary(),
                fetchRecentTransactions()
            ]);
        })
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

        // Ensure we have numeric values
        const monthlyIncome = Number(summary.monthlyIncome) || 0;
        const monthlyExpenses = Number(summary.monthlyExpenses) || 0;
        const previousMonthIncome = Number(summary.previousMonthIncome) || 0;
        const previousMonthExpenses = Number(summary.previousMonthExpenses) || 0;

        console.log('Chart Data:', {
            monthlyIncome,
            monthlyExpenses,
            previousMonthIncome,
            previousMonthExpenses
        });

        financialChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Previous Month', 'Current Month'],
                datasets: [
                    {
                        label: 'Income',
                        data: [previousMonthIncome, monthlyIncome],
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: '#10B981',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#10B981',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Expenses',
                        data: [previousMonthExpenses, monthlyExpenses],
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderColor: '#EF4444',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#EF4444',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                stacked: false,
                animation: {
                    duration: 1000
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                        },
                        ticks: {
                            callback: value => getCurrencySymbol(getUserCurrency()) + value.toLocaleString('en-US')
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
                        position: 'right',
                        align: 'center',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: '600'
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
                                label += getCurrencySymbol(getUserCurrency()) + context.parsed.y.toLocaleString('en-US', {
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
        const userCurrency = getUserCurrency();
        console.log('Formatting currency with:', userCurrency);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: userCurrency,
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
