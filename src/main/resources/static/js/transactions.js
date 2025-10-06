document.addEventListener('DOMContentLoaded', function() {
    const transactionModal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
    let categories = [];

    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();

    // Load categories when transaction type changes
    document.getElementById('transactionType').addEventListener('change', loadCategories);

    // Initial load of categories
    loadCategories();

    // Load and display transactions
    loadTransactions();

    // Handle transaction form submission
    document.getElementById('saveTransaction').addEventListener('click', function() {
        const form = document.getElementById('addTransactionForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = {
            type: document.getElementById('transactionType').value,
            amount: parseFloat(document.getElementById('amount').value),
            categoryId: document.getElementById('category').value,
            description: document.getElementById('description').value,
            date: document.getElementById('date').value
        };

        fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to add transaction');
            return response.json();
        })
        .then(data => {
            showToast('success', 'Transaction added successfully');
            transactionModal.hide();
            form.reset();
            document.getElementById('date').valueAsDate = new Date();
            loadTransactions(); // Reload transactions list
        })
        .catch(error => {
            showToast('error', 'Failed to add transaction');
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
            categorySelect.innerHTML = '';
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

        const category = categories.find(c => c.id === transaction.categoryId);
        const amount = transaction.type === 'EXPENSE' ? `-$${transaction.amount.toFixed(2)}` : `+$${transaction.amount.toFixed(2)}`;
        const amountClass = transaction.type === 'EXPENSE' ? 'text-danger' : 'text-success';

        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${transaction.description}</h6>
                    <small class="text-muted">${category ? category.name : 'Unknown Category'}</small>
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
