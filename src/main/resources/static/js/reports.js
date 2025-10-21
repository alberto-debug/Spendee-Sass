/**
 * Reports JavaScript for Spendee application
 */

let reportChart = null;
let currentReportData = null;

document.addEventListener('DOMContentLoaded', function() {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
    document.getElementById('endDate').valueAsDate = today;
    
    // Get user's preferred currency
    function getUserCurrency() {
        return localStorage.getItem('userCurrency') || 'USD';
    }
    
    // Format currency
    function formatCurrency(amount) {
        const userCurrency = getUserCurrency();
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: userCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    // Make functions globally available
    window.getUserCurrency = getUserCurrency;
    window.formatCurrency = formatCurrency;
});

function resetFilters() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
    document.getElementById('endDate').valueAsDate = today;
    document.getElementById('reportType').value = 'BOTH';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('groupBy').value = 'DAILY';
    
    // Hide results
    document.getElementById('reportResults').classList.add('hidden');
    document.getElementById('emptyState').classList.remove('hidden');
}

function generateReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reportType = document.getElementById('reportType').value;
    const categoryId = document.getElementById('categoryFilter').value;
    const groupBy = document.getElementById('groupBy').value;
    
    if (!startDate || !endDate) {
        showToast('error', 'Please select both start and end dates');
        return;
    }
    
    const filter = {
        startDate: startDate,
        endDate: endDate,
        reportType: reportType,
        categoryId: categoryId || null,
        groupBy: groupBy
    };
    
    showLoading(true);
    
    fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
        },
        body: JSON.stringify(filter)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to generate report');
        return response.json();
    })
    .then(data => {
        currentReportData = data;
        displayReport(data);
        showLoading(false);
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'Failed to generate report');
        showLoading(false);
    });
}

function displayReport(data) {
    // Show results, hide empty state
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('reportResults').classList.remove('hidden');
    
    // Update summary cards
    document.getElementById('totalIncome').textContent = formatCurrency(data.totalIncome);
    document.getElementById('totalExpense').textContent = formatCurrency(data.totalExpense);
    document.getElementById('netSavings').textContent = formatCurrency(data.netSavings);
    
    // Update chart
    updateChart(data.timeSeriesData);
    
    // Update category breakdown
    updateCategoryBreakdown(data.categoryBreakdown);
    
    // Update transactions table
    updateTransactionsTable(data.transactions);
}

function updateChart(timeSeriesData) {
    const ctx = document.getElementById('reportChart').getContext('2d');
    
    // Destroy existing chart
    if (reportChart) {
        reportChart.destroy();
    }
    
    const labels = timeSeriesData.map(d => d.period);
    const incomeData = timeSeriesData.map(d => d.income);
    const expenseData = timeSeriesData.map(d => d.expense);
    
    reportChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: '#10B981',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: '#EF4444',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#EF4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
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
                        usePointStyle: true,
                        padding: 20,
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
                    bodyColor: '#fff',
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            }
        }
    });
}

function updateCategoryBreakdown(categoryBreakdown) {
    const container = document.getElementById('categoryBreakdown');
    
    if (Object.keys(categoryBreakdown).length === 0) {
        document.getElementById('categoryBreakdownCard').classList.add('hidden');
        return;
    }
    
    document.getElementById('categoryBreakdownCard').classList.remove('hidden');
    
    // Sort by amount descending
    const sorted = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1]);
    
    container.innerHTML = sorted.map(([category, amount]) => `
        <div class="category-item">
            <span class="category-name">${category}</span>
            <span class="category-amount">${formatCurrency(amount)}</span>
        </div>
    `).join('');
}

function updateTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.5);">
                    No transactions found for the selected period
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = transactions.map(t => {
        const date = new Date(t.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const typeClass = t.type === 'INCOME' ? 'badge-income' : 'badge-expense';
        const amountClass = t.type === 'INCOME' ? 'amount-positive' : 'amount-negative';
        const amountPrefix = t.type === 'INCOME' ? '+' : '-';
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${t.description}</td>
                <td>${t.category}</td>
                <td><span class="transaction-type-badge ${typeClass}">${t.type}</span></td>
                <td class="${amountClass}">${amountPrefix}${formatCurrency(t.amount)}</td>
            </tr>
        `;
    }).join('');
}

function downloadPDF() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reportType = document.getElementById('reportType').value;
    const categoryId = document.getElementById('categoryFilter').value;
    const groupBy = document.getElementById('groupBy').value;
    
    if (!startDate || !endDate) {
        showToast('error', 'Please select both start and end dates');
        return;
    }
    
    const filter = {
        startDate: startDate,
        endDate: endDate,
        reportType: reportType,
        categoryId: categoryId || null,
        groupBy: groupBy
    };
    
    showLoading(true);
    showToast('info', 'Generating PDF report...');
    
    fetch('/api/reports/download-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
        },
        body: JSON.stringify(filter)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to generate PDF');
        return response.blob();
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `financial-report-${startDate}-to-${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('success', 'PDF report downloaded successfully');
        showLoading(false);
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'Failed to download PDF report');
        showLoading(false);
    });
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function showToast(type, message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const toastId = 'toast-' + Date.now();

    let backgroundColor;
    let icon;
    switch(type) {
        case 'success':
            backgroundColor = 'rgba(16, 185, 129, 0.95)';
            icon = 'fa-check-circle';
            break;
        case 'error':
            backgroundColor = 'rgba(239, 68, 68, 0.95)';
            icon = 'fa-exclamation-circle';
            break;
        case 'info':
            backgroundColor = 'rgba(99, 102, 241, 0.95)';
            icon = 'fa-info-circle';
            break;
        default:
            backgroundColor = 'rgba(99, 102, 241, 0.95)';
            icon = 'fa-info-circle';
    }

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

// Add CSS animations if not already added
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

