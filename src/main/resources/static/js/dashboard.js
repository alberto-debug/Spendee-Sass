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
    // Floating AI elements
    const aiBtn = document.getElementById('aiAssistantBtn');
    const aiModal = document.getElementById('aiModal');
    const aiBackdrop = document.getElementById('aiModalBackdrop');
    const aiClose = document.getElementById('aiModalClose');
    const aiRefreshBtn = document.getElementById('aiRefreshBtn');
    const aiMessages = document.getElementById('aiMessages');

    // API endpoints
    const API_URL = '/api';
    const DASHBOARD_SUMMARY_ENDPOINT = `${API_URL}/dashboard/summary`;
    const RECENT_TRANSACTIONS_ENDPOINT = `${API_URL}/dashboard/recent-transactions`;
    const SUGGESTIONS_ENDPOINT = `${API_URL}/suggestions`;

    let financialChart = null;
    let modernChart = null;
    let suggestionsLoaded = false;

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
                // Lazy-load suggestions when the user opens the assistant
            ]);
        })
        .then(() => {
            hideLoading();
            setupAiAssistant();
        })
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
                // initialize the modern/donut chart on the right
                initializeModernChart(summary);
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

    /**
     * Fetch AI suggestions (lazy on modal open)
     */
    function fetchSuggestions() {
        if (!aiMessages) return Promise.resolve();
        // Loading message
        aiMessages.insertAdjacentHTML('beforeend', `
            <div class="ai-msg" data-ai-loading>
                <div class="ai-avatar"><i class="fas fa-robot"></i></div>
                <div class="ai-bubble"><p>Analyzing your spending...</p><div class="ai-meta">Assistant • loading</div></div>
            </div>
        `);
        return fetch(SUGGESTIONS_ENDPOINT)
            .then(handleResponse)
            .then(suggestions => {
                // Remove loading msg
                const loading = aiMessages.querySelector('[data-ai-loading]');
                if (loading) loading.remove();
                renderSuggestionsInChat(suggestions);
                suggestionsLoaded = true;
            })
            .catch(err => {
                console.error('Error fetching suggestions:', err);
                const loading = aiMessages.querySelector('[data-ai-loading]');
                if (loading) loading.remove();
                aiMessages.insertAdjacentHTML('beforeend', `
                    <div class="ai-msg">
                        <div class="ai-avatar"><i class="fas fa-robot"></i></div>
                        <div class="ai-bubble"><p class="text-muted">No suggestions available right now.</p></div>
                    </div>
                `);
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

    // Initialize a second, more modern chart (doughnut) showing income vs expenses share
    function initializeModernChart(summary) {
        const ctx = document.getElementById('modernChart')?.getContext('2d');
        if (!ctx) return;

        if (modernChart instanceof Chart) {
            modernChart.destroy();
        }

        const income = Number(summary.monthlyIncome) || 0;
        const expenses = Number(summary.monthlyExpenses) || 0;

        modernChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [income, expenses],
                    backgroundColor: ['#10B981', '#EF4444'],
                    hoverBackgroundColor: ['#059669', '#DC2626'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                const value = context.parsed || 0;
                                const formatted = getCurrencySymbol(getUserCurrency()) + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                return `${context.label}: ${formatted}`;

