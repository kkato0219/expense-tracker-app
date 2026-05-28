// ========== GET ELEMENTS ==========

// Form inputs
const titleInput = document.querySelector("#title");
const amountInput = document.querySelector("#amount");
const dateInput = document.querySelector("#date");
const categoryInput = document.querySelector("#category");
const addBtn = document.querySelector("#add-btn");

// Type toggle buttons
const incomeBtn = document.querySelector("#income-btn");
const expenseBtn = document.querySelector("#expense-btn");

// Summary display
const balanceEl = document.querySelector("#balance");
const incomeEl = document.querySelector("#income");
const expenseEl = document.querySelector("#expense");

// Transaction list
const list = document.querySelector("#list");
const searchInput = document.querySelector("#search");


// Filter buttons
const filterBtns = document.querySelectorAll(".filter-btn");

// Chart
const ctx = document.querySelector("#myChart");

// Budget
const budgetInput = document.querySelector("#budget-input");
const setBudgetBtn = document.querySelector("#set-budget");
const progressBar = document.querySelector("#progress-bar");
const budgetStatus = document.querySelector("#budget-status");

// Month filter
const monthFilter = document.querySelector("#month-filter");

// Clear all
const clearAllBtn = document.querySelector("#clear-all");

//Modal
const modal = document.querySelector("#modal");
const editTitleInput = document.querySelector("#edit-title");
const editAmountInput = document.querySelector("#edit-amount");
const editCategoryInput = document.querySelector("#edit-category");
const saveEditBtn = document.querySelector("#save-edit");
const cancelEditBtn = document.querySelector("#cancel-edit");

// ========== STATE ==========
let transactions = [];
let currentFilter = "all";
let currentType = "income";
let currentBudget = 0;
let editingId = null;
let chart = null;


function saveToLocalStorage() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// ========== LOCAL STORAGE ==========
function loadFromLocalStorage() {
    const saved = localStorage.getItem("transactions");
    if (saved) {
        transactions = JSON.parse(saved);
    }

    const savedBudget = localStorage.getItem("budget");
    if (savedBudget) {
        currentBudget = Number(savedBudget);
        budgetInput.value = currentBudget;
    }
}

// ========== TYPE TOGGLE ==========

incomeBtn.addEventListener("click", () => {
    currentType = "income";
    incomeBtn.classList.add("active");
    expenseBtn.classList.remove("active");
});

expenseBtn.addEventListener("click", () => {
    currentType = "expense";
    expenseBtn.classList.add("active");
    incomeBtn.classList.remove("active");
});

// ========== ADD TRANSACTION ==========

addBtn.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const date = dateInput.value;
    const category = categoryInput.value;

    // Validation
    if (!title || !amount || amount <= 0) {
        alert("Please enter a valid title and amount!");
        return;
    }

    // Create transaction object
    const transaction = {
        id: Date.now(),
        title: title,
        amount: currentType === "income" ? amount : -amount,
        date: date || new Date().toLocaleDateString("ja-JP"),
        category: category,
        type: currentType
    };

    // Add to array
    transactions.push(transaction);

    // Save and update
    saveToLocalStorage();
    applyFilter();
    updateSummary();
    renderChart();

    // Clear form
    titleInput.value = "";
    amountInput.value = "";
    dateInput.value = "";
});

// ========== RENDER TRANSACTIONS ==========

function renderTransactions(data) {
    list.innerHTML = "";

    if (data.length === 0) {
        list.innerHTML = `<p class="empty-msg">No transactions found</p>`;
        return;
    }

    data.forEach(t => {
        const li = document.createElement("li");
        li.classList.add(t.type);
        li.dataset.id = t.id;

        li.innerHTML = `
            <div class="transaction-info">
                <p class="transaction-title">${t.title}</p>
                <p class="transaction-meta">
                    ${t.category} · ${t.date}
                </p>
            </div>
            <div class="transaction-right">
                <span class="transaction-amount ${t.type}">
                    ${t.type === "income" ? "+" : "-"}${formatYen(Math.abs(t.amount))}
                </span>
                <div class="transaction-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
            </div>
        `;

        //Delete button
        li.querySelector(".delete-btn").addEventListener("click", () => {
            deleteTransaction(t.id);
        });

        //Edit button
        li.querySelector(".edit-btn").addEventListener("click", () => {
            openEditModal(t.id);
        });

        list.appendChild(li);
    });
}

// ========== FORMAT YEN ==========

function formatYen(amount) {
    return new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY"
    }).format(amount);
}

// ========== UPDATE SUMMARY ==========

function updateSummary() {
    const total = transactions.reduce((acc, t) => acc + t.amount, 0);
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions
        .filter(t => t.type === "expense")
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    balanceEl.textContent = formatYen(total);
    incomeEl.textContent = formatYen(income);
    expenseEl.textContent = formatYen(expense);

    // Balance color
    balanceEl.style.color = total >= 0 ? "#00d4aa" : "#ff6b6b";

    // Update budget progress
    updateBudget(expense);
}

// ========== RENDER CHART ==========

function renderChart() {
    const expenses = transactions.filter(t => t.type === "expense");

    const categoryTotals = {};

    expenses.forEach(t => {
        if (!categoryTotals[t.category]) {
            categoryTotals[t.category] = 0;
        }
        categoryTotals[t.category] += Math.abs(t.amount);
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Show/hide empty message
    const chartEmpty = document.querySelector("#chart-empty");
    if (labels.length === 0) {
        chartEmpty.style.display = "block";
        if (chart) chart.destroy();
        return;
    }
    chartEmpty.style.display = "none";

    // Destroy old chart before making new one
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    "#00d4aa",
                    "#ff6b6b",
                    "#ffd93d",
                    "#6c5ce7",
                    "#a8e6cf",
                    "#ff8b94",
                    "#45b7d1"
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#8892a4",
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// ========== FILTER ==========

function applyFilter() {
    let filtered = [...transactions];

    // Category filter
    if (currentFilter !== "all") {
        filtered = filtered.filter(t => t.category === currentFilter);
    }

    // Month filter
    const selectedMonth = monthFilter.value;
    if (selectedMonth !== "all") {
        filtered = filtered.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() + 1 === Number(selectedMonth);
        });
    }

    // Search filter
    const searchText = searchInput.value.toLowerCase();
    if (searchText) {
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(searchText)
        );
    }

    renderTransactions(filtered);
}

// Category filter buttons
filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.category;
        applyFilter();
    });
});

// Search
searchInput.addEventListener("input", () => {
    applyFilter();
});

// Month filter
monthFilter.addEventListener("change", () => {
    applyFilter();
});

// ========== BUDGET ==========

function updateBudget(totalExpense) {
    if (currentBudget === 0) {
        progressBar.style.width = "0%";
        budgetStatus.textContent = "No budget set";
        budgetStatus.style.color = "#8892a4";
        return;
    }

    const percentage = (totalExpense / currentBudget) * 100;
    const capped = Math.min(percentage, 100);

    progressBar.style.width = capped + "%";

    if (percentage >= 100) {
        progressBar.style.background = "#ff6b6b";
        budgetStatus.textContent =
            `⚠️ Over budget! (${formatYen(totalExpense)} / ${formatYen(currentBudget)})`;
        budgetStatus.style.color = "#ff6b6b";
    } else if (percentage >= 80) {
        progressBar.style.background = "ffd93d";
        budgetStatus.textContent =
            `⚡ ${Math.round(percentage)}% used (${formatYen(totalExpense)} / ${formatYen(currentBudget)})`;
        budgetStatus.style.color = "ffd93d";
    } else {
        progressBar.style.background = "#00d4aa";
        budgetStatus.textContent =
            `✅ ${Math.round(percentage)}% used (${formatYen(totalExpense)} / ${formatYen(currentBudget)})`;
        budgetStatus.style.color = "#00d4aa";
    }
}

// Set budget button
setBudgetBtn.addEventListener("click", () => {
    const value = Number(budgetInput.value);
    if (!value || value <= 0) {
        alert("Please enter a valid budget!");
        return;
    }
    currentBudget = value;
    localStorage.setItem("budget", currentBudget);
    updateSummary();
});

// ========== DELETE ==========

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveToLocalStorage();
    applyFilter();
    updateSummary();
    renderChart();
}

// ========== EDIT MODAL ==========

function openEditModal(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    editingId = id;
    editTitleInput.value = transaction.title;
    editAmountInput.value = Math.abs(transaction.amount);
    editCategoryInput.value = transaction.category;

    modal.classList.remove("hidden");
}

// Save edit
saveEditBtn.addEventListener("click", () => {
    if (!editingId) return;

    const index = transactions.findIndex(t => t.id === editingId);
    if (index === -1) return;

    const type = transactions[index].type;

    transactions[index].title = editTitleInput.value;
    transactions[index].amount = type === "income"
        ? Number(editAmountInput.value)
        : -Number(editAmountInput.value);
    transactions[index].category = editCategoryInput.value;

    editingId = null;
    modal.classList.add("hidden");

    saveToLocalStorage();
    applyFilter();
    updateSummary();
    renderChart();
});

// Cancel edit
cancelEditBtn.addEventListener("click", () => {
    editingId = null;
    modal.classList.add("hidden");
});

// Clear all
clearAllBtn.addEventListener("click", () => {
    if (confirm("Delete all transactions?")) {
        transactions = [];
        saveToLocalStorage();
        applyFilter();
        updateSummary();
        renderChart();
    }
});

// ========== INITIALIZE ==========

function init() {
    // Load data from localStorage
    loadFromLocalStorage();

    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;

    // Render everything
    applyFilter();
    updateSummary();
    renderChart();
}

// Start the app!
init();