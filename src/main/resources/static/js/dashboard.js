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

                // Initialize the chart with monthly data
                if (summary.monthlyData) {
                    initializeChart(summary.monthlyData);
                } else {
                    // Sample data for testing
                    const sampleData = generateSampleData();
                    initializeChart(sampleData);
                }
            })
            .catch(error => {
                console.error('Error fetching dashboard summary:', error);
                // Show error in UI if needed
            });
    }

    function generateSampleData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        return {
            labels: months,
            income: months.map(() => Math.floor(Math.random() * 5000) + 3000),
            expenses: months.map(() => Math.floor(Math.random() * 4000) + 2000)
        };
    }

    function initializeChart(data) {
        const ctx = document.getElementById('financialChart').getContext('2d');

        if (window.financialChart) {
            window.financialChart.destroy();
        }

        window.financialChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || Object.keys(data),
                datasets: [
                    {
                        label: 'Income',
                        data: data.income || Object.values(data).map(m => m.income),
                        borderColor: 'rgba(236, 72, 153, 1)',  // Pink
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgba(236, 72, 153, 1)',
                        pointBorderColor: 'rgba(236, 72, 153, 0.2)',
                        pointBorderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 3,
                        pointHoverBackgroundColor: 'rgba(236, 72, 153, 1)',
                        pointHoverBorderColor: '#fff'
                    },
                    {
                        label: 'Expenses',
                        data: data.expenses || Object.values(data).map(m => m.expenses),
                        borderColor: 'rgba(59, 130, 246, 1)',  // Blue
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointBorderColor: 'rgba(59, 130, 246, 0.2)',
                        pointBorderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 3,
                        pointHoverBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointHoverBorderColor: '#fff'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'nearest',
                    axis: 'x'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false,
                            tickLength: 0
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 12,
                                weight: '300'
                            },
                            padding: 8
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 12,
                                weight: '300'
                            },
                            padding: 8,
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                animations: {
                    tension: {
                        duration: 1000,
                        easing: 'easeInOutQuart',
                        from: 0.8,
                        to: 0.4
                    }
                }
            }
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
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
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
