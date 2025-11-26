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
    const canvas = document.getElementById('reportChart');
    if (!canvas) {
        console.error('reportChart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    // Destroy existing chart
    if (reportChart) {
        reportChart.destroy();
    }
    
    // Calculate totals from time series data
    const totalIncome = timeSeriesData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = timeSeriesData.reduce((sum, d) => sum + d.expense, 0);

    // Calculate average for smooth baseline (like dashboard)
    const avgValue = (totalIncome + totalExpense) / 2;

    // Generate smooth wave data points that flow side by side (EXACTLY like dashboard)
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

    // Create beautiful gradients for income and expenses (EXACTLY like dashboard)
    const incomeGradient = ctx.createLinearGradient(0, 0, 0, 350);
    incomeGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    incomeGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.25)');
    incomeGradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');

    const expenseGradient = ctx.createLinearGradient(0, 0, 0, 350);
    expenseGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    expenseGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.25)');
    expenseGradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');

    reportChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: generateSmoothWave(totalIncome, 0),
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
                    data: generateSmoothWave(totalExpense, Math.PI * 0.35),
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
                        title: () => 'Report Overview',
                        label: context => {
                            const value = context.parsed.y || 0;
                            return context.dataset.label + ': ' + formatCurrency(value);
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
                        callback: function(value) {
                            return formatCurrency(value);
                        }
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

