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
                // Initialize Goal Tracking
                initializeGoalTracking();
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

        // Get last 7 days for weekly trend
        const today = new Date();
        const last7Days = [];
        const dailySpending = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

            // Simulate daily spending pattern based on monthly expenses
            const monthlyExpenses = Number(summary.monthlyExpenses) || 0;
            const dailyAvg = monthlyExpenses / 30;
            const randomFactor = 0.5 + Math.random();
            dailySpending.push(dailyAvg * randomFactor);
        }

        console.log('Weekly Trend Data:', { last7Days, dailySpending });

        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.6)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.4)');

        financialChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last7Days,
                datasets: [
                    {
                        label: 'Daily Spending',
                        data: dailySpending,
                        backgroundColor: gradient,
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 2,
                        borderRadius: 12,
                        borderSkipped: false,
                        barPercentage: 0.7,
                        categoryPercentage: 0.8
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
                animation: {
                    duration: 1200,
                    easing: 'easeInOutQuart'
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)',
                            drawBorder: false,
                            lineWidth: 1
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            padding: 8,
                            callback: value => getCurrencySymbol(getUserCurrency()) + value.toLocaleString('en-US', {
                                notation: 'compact',
                                compactDisplay: 'short'
                            })
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            padding: 8
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        padding: 16,
                        titleColor: '#fff',
                        titleFont: {
                            size: 15,
                            weight: '700'
                        },
                        bodyFont: {
                            size: 13,
                            weight: '500'
                        },
                        cornerRadius: 12,
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                return context[0].label + ' Spending';
                            },
                            label: context => {
                                const value = context.parsed.y || 0;
                                return getCurrencySymbol(getUserCurrency()) + value.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                });
                            }
                        }
                    }
                }
            }
        });
    }

    // Initialize a second, more modern chart (smooth area) showing income vs expenses
    function initializeModernChart(summary) {
        const ctx = document.getElementById('modernChart')?.getContext('2d');
        if (!ctx) return;

        if (modernChart instanceof Chart) {
            modernChart.destroy();
        }

        const income = Number(summary.monthlyIncome) || 0;
        const expenses = Number(summary.monthlyExpenses) || 0;

        // Calculate average for smooth baseline
        const avgValue = (income + expenses) / 2;

        // Generate smooth wave data points that flow side by side
        const generateSmoothWave = (baseValue, offset = 0) => {
            const points = [];
            const steps = 50;
            for (let i = 0; i <= steps; i++) {
                const x = (i / steps) * Math.PI * 4.5;
                const wave = Math.sin(x + offset) * (avgValue * 0.12) +
                            Math.cos(x * 1.4 + offset) * (avgValue * 0.06);
                points.push(Math.max(0, baseValue + wave));
            }
            return points;
        };

        const labels = Array.from({length: 51}, () => '');

        // Create beautiful gradients for income and expenses
        const incomeGradient = ctx.createLinearGradient(0, 0, 0, 350);
        incomeGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
        incomeGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.25)');
        incomeGradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');

        const expenseGradient = ctx.createLinearGradient(0, 0, 0, 350);
        expenseGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        expenseGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.25)');
        expenseGradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');

        modernChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: generateSmoothWave(income, 0),
                        backgroundColor: incomeGradient,
                        borderColor: '#10B981',
                        borderWidth: 2.5,
                        tension: 0.5,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderCapStyle: 'round',
                        borderJoinStyle: 'round'
                    },
                    {
                        label: 'Expenses',
                        data: generateSmoothWave(expenses, Math.PI * 0.35),
                        backgroundColor: expenseGradient,
                        borderColor: '#EF4444',
                        borderWidth: 2.5,
                        tension: 0.5,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderCapStyle: 'round',
                        borderJoinStyle: 'round'
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
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 10,
                            boxHeight: 10
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        padding: 16,
                        titleColor: '#fff',
                        titleFont: {
                            size: 15,
                            weight: '700'
                        },
                        bodyFont: {
                            size: 13,
                            weight: '500'
                        },
                        cornerRadius: 12,
                        displayColors: true,
                        boxWidth: 12,
                        boxHeight: 12,
                        callbacks: {
                            title: () => 'Monthly Overview',
                            label: context => {
                                const value = context.parsed.y || 0;
                                const formatted = getCurrencySymbol(getUserCurrency()) + Number(value).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                });
                                return context.dataset.label + ': ' + formatted;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: false,
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false,
                            lineWidth: 1
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: {
                                size: 10,
                                weight: '500'
                            },
                            padding: 10,
                            callback: value => getCurrencySymbol(getUserCurrency()) + value.toLocaleString('en-US', {
                                notation: 'compact',
                                compactDisplay: 'short'
                            })
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                },
                elements: {
                    line: {
                        borderCapStyle: 'round'
                    }
                }
            }
        });
    }

    /**
     * Update dashboard summary cards
     */
    function updateDashboardSummary(summary) {
        const currencySymbol = getCurrencySymbol(getUserCurrency());

        if (balanceElement) {
            balanceElement.textContent = currencySymbol + formatCurrency(summary.totalBalance);
        }
        if (incomeElement) {
            incomeElement.textContent = currencySymbol + formatCurrency(summary.monthlyIncome);
        }
        if (expenseElement) {
            expenseElement.textContent = currencySymbol + formatCurrency(summary.monthlyExpenses);
        }
        if (savingsElement) {
            savingsElement.textContent = currencySymbol + formatCurrency(summary.totalSavings);
        }
    }

    /**
     * Update recent transactions list
     */
    function updateRecentTransactions(transactions) {
        if (!recentTransactionsContainer) return;

        recentTransactionsContainer.innerHTML = '';

        if (!transactions || transactions.length === 0) {
            if (noTransactionsMessage) {
                noTransactionsMessage.style.display = 'block';
            }
            return;
        }

        if (noTransactionsMessage) {
            noTransactionsMessage.style.display = 'none';
        }

        const currencySymbol = getCurrencySymbol(getUserCurrency());

        transactions.forEach(transaction => {
            const transactionElement = createTransactionElement(transaction, currencySymbol);
            recentTransactionsContainer.appendChild(transactionElement);
        });
    }

    /**
     * Create a transaction element
     */
    function createTransactionElement(transaction, currencySymbol) {
        const div = document.createElement('div');
        div.className = 'transaction-item';

        const isExpense = transaction.type === 'EXPENSE';
        const amountClass = isExpense ? 'text-danger' : 'text-success';
        const amountPrefix = isExpense ? '-' : '+';

        div.innerHTML = `
            <div class="transaction-icon ${isExpense ? 'expense' : 'income'}">
                <i class="fas fa-${isExpense ? 'arrow-down' : 'arrow-up'}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                <div class="transaction-category">${escapeHtml(transaction.category || 'Uncategorized')}</div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${amountPrefix}${currencySymbol}${formatCurrency(transaction.amount)}
            </div>
        `;

        return div;
    }

    /**
     * Setup AI Assistant modal
     */
    function setupAiAssistant() {
        if (!aiBtn || !aiModal || !aiBackdrop) return;

        // Open modal
        aiBtn.addEventListener('click', () => {
            aiModal.classList.add('show');
            aiBackdrop.classList.add('show');
            // Lazy-load suggestions on first open
            if (!suggestionsLoaded) {
                fetchSuggestions();
            }
        });

        // Close modal
        const closeModal = () => {
            aiModal.classList.remove('show');
            aiBackdrop.classList.remove('show');
        };

        if (aiClose) {
            aiClose.addEventListener('click', closeModal);
        }
        aiBackdrop.addEventListener('click', closeModal);

        // Refresh suggestions
        if (aiRefreshBtn) {
            aiRefreshBtn.addEventListener('click', () => {
                if (aiMessages) {
                    aiMessages.innerHTML = '';
                }
                suggestionsLoaded = false;
                fetchSuggestions();
            });
        }
    }

    /**
     * Render suggestions in the AI chat interface
     */
    function renderSuggestionsInChat(suggestions) {
        if (!aiMessages || !suggestions || suggestions.length === 0) return;

        suggestions.forEach(suggestion => {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'ai-msg';

            const iconMap = {
                'SAVINGS': 'piggy-bank',
                'BUDGET': 'chart-line',
                'SPENDING': 'shopping-cart',
                'GENERAL': 'lightbulb'
            };

            const icon = iconMap[suggestion.type] || 'lightbulb';

            msgDiv.innerHTML = `
                <div class="ai-avatar"><i class="fas fa-${icon}"></i></div>
                <div class="ai-bubble">
                    <p>${escapeHtml(suggestion.message)}</p>
                    <div class="ai-meta">Assistant • ${formatDate(suggestion.createdAt)}</div>
                </div>
            `;

            aiMessages.appendChild(msgDiv);
        });
    }

    /**
     * Format currency
     */
    function formatCurrency(amount) {
        const num = Number(amount) || 0;
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Format date
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Handle API response
     */
    function handleResponse(response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Show loading indicator
     */
    function showLoading() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
    }

    /**
     * Hide loading indicator
     */
    function hideLoading() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    function showError(message) {
        console.error(message);
        // You can integrate with your toast notification system here
        if (window.showToast) {
            window.showToast(message, 'error');
        }
    }

    /**
     * Update percentage change indicators with real data
     */
    function updatePercentageChanges(summary) {
        // Income change
        const incomeChangeElement = document.getElementById('incomeChange');
        if (incomeChangeElement && summary.incomeChange !== undefined) {
            const incomeChange = Number(summary.incomeChange) || 0;
            const changeText = Math.abs(incomeChange).toFixed(1);

            incomeChangeElement.textContent = `${changeText}% vs last month`;
        }

        // Expense change
        const expenseChangeElement = document.getElementById('expenseChange');
        if (expenseChangeElement && summary.expenseChange !== undefined) {
            const expenseChange = Number(summary.expenseChange) || 0;
            const changeText = Math.abs(expenseChange).toFixed(1);

            expenseChangeElement.textContent = `${changeText}% vs last month`;
        }

        // Balance change (calculate from income and expense changes)
        const balanceTrendElement = document.getElementById('balanceTrend');
        if (balanceTrendElement && summary.incomeChange !== undefined && summary.expenseChange !== undefined) {
            const incomeChange = Number(summary.incomeChange) || 0;
            const expenseChange = Number(summary.expenseChange) || 0;
            const balanceChange = incomeChange - expenseChange;
            const isPositive = balanceChange >= 0;
            const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
            const changeText = Math.abs(balanceChange).toFixed(1);

            balanceTrendElement.innerHTML = `
                <i class="fas ${icon} me-1"></i>
                <span>${changeText}%</span>
            `;
        }
    }

    // =============================================
    // GOAL TRACKING FUNCTIONALITY WITH BACKEND
    // =============================================

    const GOALS_API = '/api/goals';
    let goalsLoaded = false;

    /**
     * Initialize Goal Tracking System
     */
    function initializeGoalTracking() {
        const goalBtn = document.getElementById('goalTrackingBtn');
        const goalModal = document.getElementById('goalModal');
        const goalBackdrop = document.getElementById('goalModalBackdrop');
        const goalClose = document.getElementById('goalModalClose');
        const addNewGoalBtn = document.getElementById('addNewGoalBtn');

        if (!goalBtn || !goalModal || !goalBackdrop) return;

        // Open goal modal
        goalBtn.addEventListener('click', () => {
            goalModal.classList.add('show');
            goalBackdrop.classList.add('show');
            if (!goalsLoaded) {
                loadGoalsFromBackend();
            }
        });

        // Close goal modal
        const closeGoalModal = () => {
            goalModal.classList.remove('show');
            goalBackdrop.classList.remove('show');
        };

        if (goalClose) {
            goalClose.addEventListener('click', closeGoalModal);
        }
        goalBackdrop.addEventListener('click', closeGoalModal);

        // Add new goal button
        if (addNewGoalBtn) {
            addNewGoalBtn.addEventListener('click', () => {
                showAddGoalModal();
            });
        }
    }

    /**
     * Load goals from backend
     */
    function loadGoalsFromBackend() {
        const goalsLoading = document.getElementById('goalsLoading');
        const goalsList = document.getElementById('goalsList');

        if (goalsLoading) goalsLoading.style.display = 'block';

        fetch(GOALS_API, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            }
        })
        .then(response => response.json())
        .then(goals => {
            goalsLoaded = true;
            if (goalsLoading) goalsLoading.style.display = 'none';
            renderGoals(goals);
        })
        .catch(error => {
            console.error('Error loading goals:', error);
            if (goalsLoading) {
                goalsLoading.innerHTML = `
                    <div class="text-center py-4 text-danger">
                        <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
                        <p>Failed to load goals</p>
                    </div>
                `;
            }
        });
    }

    /**
     * Render goals in the modal
     */
    function renderGoals(goals) {
        const goalsList = document.getElementById('goalsList');
        if (!goalsList) return;

        goalsList.innerHTML = '';

        if (!goals || goals.length === 0) {
            goalsList.innerHTML = `
                <div class="goal-empty">
                    <i class="fas fa-bullseye"></i>
                    <h5>No Goals Yet</h5>
                    <p>Click the + button to create your first financial goal!</p>
                </div>
            `;
            return;
        }

        const currencySymbol = getCurrencySymbol(getUserCurrency());

        goals.forEach(goal => {
            const goalItem = createGoalItem(goal, currencySymbol);
            goalsList.appendChild(goalItem);
        });
    }

    /**
     * Create a goal item element
     */
    function createGoalItem(goal, currencySymbol) {
        const div = document.createElement('div');
        div.className = 'goal-item';

        const iconMap = {
            'piggy-bank': 'fa-piggy-bank',
            'home': 'fa-home',
            'car': 'fa-car',
            'plane': 'fa-plane',
            'graduation-cap': 'fa-graduation-cap',
            'ring': 'fa-ring',
            'laptop': 'fa-laptop',
            'heartbeat': 'fa-heartbeat'
        };

        const iconClass = iconMap[goal.icon] || 'fa-bullseye';
        const percentage = goal.progressPercentage || 0;
        const daysText = goal.daysRemaining !== null && goal.daysRemaining !== undefined
            ? (goal.daysRemaining > 0 ? `${goal.daysRemaining} days left` : 'Deadline passed')
            : '';

        div.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="goal-item-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="goal-item-title">${escapeHtml(goal.name)}</div>
                    <div class="goal-item-amounts">
                        <span class="goal-current-amount">${currencySymbol}${formatCurrency(goal.currentAmount)}</span>
                        <span class="goal-target-amount">of ${currencySymbol}${formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div class="goal-progress-wrapper">
                        <div class="goal-progress-bar-small">
                            <div class="goal-progress-fill-small" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        <div class="goal-progress-info">
                            <span>${percentage.toFixed(1)}% Complete</span>
                            ${daysText ? `<span>${daysText}</span>` : ''}
                        </div>
                    </div>
                    <div class="goal-item-actions">
                        <button class="goal-item-btn add-funds" data-goal-id="${goal.id}">
                            <i class="fas fa-plus me-1"></i>Add Funds
                        </button>
                        <button class="goal-item-btn delete" data-goal-id="${goal.id}">
                            <i class="fas fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const addFundsBtn = div.querySelector('.add-funds');
        const deleteBtn = div.querySelector('.delete');

        addFundsBtn.addEventListener('click', () => {
            addFundsToGoal(goal);
        });

        deleteBtn.addEventListener('click', () => {
            deleteGoal(goal.id);
        });

        return div;
    }

    /**
     * Show add goal modal
     */
    function showAddGoalModal() {
        // Create backdrop first
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.style.zIndex = '1050';
        backdrop.id = 'addGoalBackdrop';
        document.body.appendChild(backdrop);

        // Create modal
        const modalHtml = `
            <div class="modal fade show" id="addGoalModalDynamic" tabindex="-1" style="display: block; z-index: 1055;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="background: rgba(25, 25, 25, 0.98); backdrop-filter: blur(10px); border: 1px solid rgba(16, 185, 129, 0.3); color: white;">
                        <div class="modal-header border-bottom" style="border-color: rgba(16, 185, 129, 0.2) !important;">
                            <h5 class="modal-title">
                                <i class="fas fa-bullseye me-2" style="color: #10B981;"></i>Create Financial Goal
                            </h5>
                            <button type="button" class="btn-close btn-close-white" id="closeAddGoalModal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addGoalFormDynamic">
                                <div class="mb-3">
                                    <label for="goalNameInput" class="form-label">Goal Name</label>
                                    <input type="text" class="form-control bg-dark text-white border-secondary" id="goalNameInput" placeholder="e.g., Emergency Fund" required>
                                </div>
                                <div class="mb-3">
                                    <label for="goalTargetInput" class="form-label">Target Amount</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-dark text-white border-secondary">${getCurrencySymbol(getUserCurrency())}</span>
                                        <input type="number" class="form-control bg-dark text-white border-secondary" id="goalTargetInput" placeholder="5000.00" step="0.01" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="goalCurrentInput" class="form-label">Current Amount</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-dark text-white border-secondary">${getCurrencySymbol(getUserCurrency())}</span>
                                        <input type="number" class="form-control bg-dark text-white border-secondary" id="goalCurrentInput" placeholder="0.00" step="0.01" value="0">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="goalDeadlineInput" class="form-label">Target Date (Optional)</label>
                                    <input type="date" class="form-control bg-dark text-white border-secondary" id="goalDeadlineInput">
                                </div>
                                <div class="mb-3">
                                    <label for="goalIconInput" class="form-label">Icon</label>
                                    <select class="form-select bg-dark text-white border-secondary" id="goalIconInput">
                                        <option value="piggy-bank">💰 Savings</option>
                                        <option value="home">🏠 Home</option>
                                        <option value="car">🚗 Car</option>
                                        <option value="plane">✈️ Travel</option>
                                        <option value="graduation-cap">🎓 Education</option>
                                        <option value="ring">💍 Wedding</option>
                                        <option value="laptop">💻 Technology</option>
                                        <option value="heartbeat">❤️ Health</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer border-top" style="border-color: rgba(16, 185, 129, 0.2) !important;">
                            <button type="button" class="btn btn-secondary" id="cancelAddGoalBtn">Cancel</button>
                            <button type="button" class="btn btn-success" id="saveGoalBtnDynamic">
                                <i class="fas fa-save me-2"></i>Create Goal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Close modal function
        const closeModal = () => {
            const modal = document.getElementById('addGoalModalDynamic');
            const backdrop = document.getElementById('addGoalBackdrop');
            if (modal) modal.remove();
            if (backdrop) backdrop.remove();
        };

        // Add event listeners
        const saveBtn = document.getElementById('saveGoalBtnDynamic');
        const cancelBtn = document.getElementById('cancelAddGoalBtn');
        const closeBtn = document.getElementById('closeAddGoalModal');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                saveNewGoal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModal);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // Close on backdrop click
        backdrop.addEventListener('click', closeModal);

        // Focus on first input
        setTimeout(() => {
            const firstInput = document.getElementById('goalNameInput');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    /**
     * Save new goal to backend
     */
    function saveNewGoal() {
        const name = document.getElementById('goalNameInput').value.trim();
        const targetAmount = parseFloat(document.getElementById('goalTargetInput').value) || 0;
        const currentAmount = parseFloat(document.getElementById('goalCurrentInput').value) || 0;
        const deadline = document.getElementById('goalDeadlineInput').value || null;
        const icon = document.getElementById('goalIconInput').value;

        if (!name || targetAmount <= 0) {
            alert('Please enter a valid goal name and target amount.');
            return;
        }

        const goalData = {
            name,
            targetAmount,
            currentAmount,
            deadline,
            icon
        };

        // Disable save button while processing
        const saveBtn = document.getElementById('saveGoalBtnDynamic');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating...';
        }

        fetch(GOALS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            },
            body: JSON.stringify(goalData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create goal');
            }
            return response.json();
        })
        .then(goal => {
            // Close modal
            const modal = document.getElementById('addGoalModalDynamic');
            const backdrop = document.getElementById('addGoalBackdrop');
            if (modal) modal.remove();
            if (backdrop) backdrop.remove();

            // Reload goals
            loadGoalsFromBackend();

            // Show success message
            if (window.showToast) {
                window.showToast('success', 'Goal created successfully!');
            }
        })
        .catch(error => {
            console.error('Error creating goal:', error);
            alert('Failed to create goal. Please try again.');

            // Re-enable save button
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Create Goal';
            }
        });
    }

    /**
     * Add funds to a goal
     */
    function addFundsToGoal(goal) {
        const amount = prompt(`How much would you like to add to "${goal.name}"?`, '0');
        if (amount === null || amount === '') return;

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        fetch(`${GOALS_API}/${goal.id}/progress`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            },
            body: JSON.stringify({ amount: amountNum })
        })
        .then(response => response.json())
        .then(updatedGoal => {
            loadGoalsFromBackend();
        })
        .catch(error => {
            console.error('Error updating goal:', error);
            alert('Failed to update goal. Please try again.');
        });
    }

    /**
     * Delete a goal
     */
    function deleteGoal(goalId) {
        if (!confirm('Are you sure you want to delete this goal?')) {
            return;
        }

        fetch(`${GOALS_API}/${goalId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            }
        })
        .then(() => {
            loadGoalsFromBackend();
        })
        .catch(error => {
            console.error('Error deleting goal:', error);
            alert('Failed to delete goal. Please try again.');
        });
    }
});

