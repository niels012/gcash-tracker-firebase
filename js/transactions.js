document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (firebase.auth().currentUser) {
            tracker.onDataChange(() => {
                displayTransactions();
            });
            displayTransactions();
            setupSearchAndDelete();
        } else {
            window.location.href = '../index.html';
        }
    }, 500);
});

function displayTransactions() {
    const tableBody = document.getElementById('tableBody');
    const transactions = tracker.transactions;

    if (transactions.length === 0) {
        tableBody.innerHTML = `
            <div class="empty-state">
                <p>No transactions yet. <a href="form.html" style="color: #00b4d8; text-decoration: none; font-weight: 600;">Add your first transaction</a></p>
            </div>
        `;
        return;
    }

    const sortedTransactions = [...transactions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    tableBody.innerHTML = sortedTransactions.map(transaction => {
        const typeClass = transaction.type.replace('_', '-');
        const typeLabel = tracker.getTransactionTypeLabel(transaction.type);
        const amount = transaction.type === 'cash-out' 
            ? `+${tracker.formatCurrency(transaction.amount)}`
            : `-${tracker.formatCurrency(transaction.amount)}`;
        const amountClass = transaction.type === 'cash-out' ? '' : 'negative';

        return `
            <div class="table-row" data-transaction-id="${transaction.id}">
                <div class="col col-date" data-label="Date">
                    ${tracker.formatDate(transaction.date)}
                </div>
                <div class="col col-type" data-label="Type">
                    <span class="type-badge ${typeClass}">${typeLabel}</span>
                </div>
                <div class="col col-mobile" data-label="Mobile">
                    ${transaction.mobileNumber}
                </div>
                <div class="col col-amount" data-label="Amount">
                    ${tracker.formatCurrency(transaction.amount)}
                </div>
                <div class="col col-fee" data-label="Fee">
                    ₱${transaction.fee.toFixed(2)}
                </div>
                <div class="col col-reference" data-label="Reference">
                    ${transaction.referenceNumber || '-'}
                </div>
                <div class="col col-timestamp" data-label="Timestamp">
                    ${transaction.timestamp}
                </div>
                <div class="col col-actions" data-label="Actions">
                    <button class="btn-delete" data-id="${transaction.id}">Delete</button>
                </div>
            </div>
        `;
    }).join('');

    // Re-attach delete listeners after rendering
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            deleteTransaction(id);
        });
    });
}

function setupSearchAndDelete() {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const tableRows = document.querySelectorAll('.table-row');

        tableRows.forEach(row => {
            const mobileNumber = row.querySelector('.col-mobile').textContent.toLowerCase();
            if (mobileNumber.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        const visibleRows = Array.from(tableRows).filter(row => row.style.display !== 'none');
        const tableBody = document.getElementById('tableBody');
        
        if (visibleRows.length === 0 && searchTerm) {
            const existingEmpty = tableBody.querySelector('.empty-state');
            if (!existingEmpty) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-state';
                emptyMessage.textContent = 'No transactions found matching your search.';
                tableBody.appendChild(emptyMessage);
            }
        }
    });
}

async function deleteTransaction(id) {
    const transaction = tracker.getTransaction(id);
    if (!transaction) return;

    const confirmed = confirm(
        `Are you sure you want to delete this transaction?\n\n` +
        `Type: ${tracker.getTransactionTypeLabel(transaction.type)}\n` +
        `Amount: ${tracker.formatCurrency(transaction.amount)}\n` +
        `Date: ${tracker.formatDate(transaction.date)}\n\n` +
        `This will restore your previous balance.`
    );

    if (!confirmed) return;

    try {
        const success = await tracker.deleteTransaction(id);
        if (success) {
            showNotification('Transaction deleted successfully!', 'success');
            displayTransactions();
        } else {
            showNotification('Failed to delete transaction.', 'error');
        }
    } catch (error) {
        showNotification('Error deleting transaction: ' + error.message, 'error');
        console.error(error);
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#06d6a0' : '#ef476f';
    const shadowColor = type === 'success' 
        ? 'rgba(6, 214, 160, 0.3)' 
        : 'rgba(239, 71, 111, 0.3)';

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 8px 24px ${shadowColor};
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        font-weight: 600;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
