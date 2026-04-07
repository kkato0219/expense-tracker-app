const titleInput = document.querySelector("#title");
const amountInput = document.querySelector("#amount");
const categoryInput = document.querySelector("#category");
const addBtn = document.querySelector("#add-btn");

const list = document.querySelector("#list");

const balanceEl = document.querySelector("#balance");
const incomeEl = document.querySelector("#income");
const expenseEl = document.querySelector("#expense");
const searchInput = document.querySelector("#search");

const filterBtns = document.querySelectorAll(".filter-btn");

const modal = document.getElementById("modal");
const editTitle = document.getElementById("edit-title");
const editAmount = document.getElementById("edit-amount");
const editCategory = document.getElementById("edit-category");
const saveEditBtn = document.getElementById("save-edit");
const cancelEditBtn = document.getElementById("cancel-edit");
const toggleBtn = document.getElementById("toggle-theme");

let transactions = [];
let currentFilter = "all";
let chart;
let editingId = null;

function saveToLocalStorage() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

const saved = localStorage.getItem("transactions");

if (saved) {
    transactions = JSON.parse(saved);
    renderTransactions(transactions);
    applyFilter();
    updateValues();
    renderChart();
}

toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});

if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
}

addBtn.addEventListener("click", function () {
    const title = titleInput.value.trim();
    const amount = Number(amountInput.value.trim());
    const category = categoryInput.value;

    if (!title || Number.isNaN(amount) || amount === 0) {
    alert("Please enter a valid title and amount (non-zero)");
    return;
    }

    const transaction = {
        id: Date.now(),
        title,
        amount,
        category,
        timestamp: new Date().toLocaleString()
    };

    transactions.push(transaction);

    applyFilter();
    updateValues();
    renderChart();
    saveToLocalStorage();

    titleInput.value = "";
    amountInput.value = "";
});

filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {        
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        currentFilter = btn.dataset.category;
        applyFilter();
    });
});

searchInput.addEventListener("input", applyFilter);

function addTransactionToList(transaction) {
    const li = document.createElement("li");
    li.classList.add(transaction.amount > 0 ? "income" : "expense");
    li.dataset.id = transaction.id;
    

    li.innerHTML = `
        <span class ="text">
            ${transaction.title} (${transaction.category}):
            ${formatYen(transaction.amount)} <br>
            <small>${transaction.timestamp}</small>
        </span>
        <div>    
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>            
    `;

    list.appendChild(li);

    li.querySelector(".delete-btn").addEventListener("click", () => {
        deleteTransaction(transaction.id);
    });

    li.querySelector(".edit-btn").addEventListener("click", () => {
        editTransaction(transaction.id);
    });
}

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
       
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});

saveEditBtn.addEventListener("click", () => {
    const transaction = transactions.find(t => t.id === editingId);
    if (!transaction) return;

    const title = editTitle.value.trim();
    const amount = Number(editAmount.value.trim());
    const category = editCategory.value;

    if (!title || Number.isNaN(amount) || amount === 0) {
        alert("Please enter a valid title and amount (non-zero)");
        return;
    }

    transaction.title = title;
    transaction.amount = amount;
    transaction.category = category;
    transaction.timestamp = newDate().toLocaleString();

    applyFilter();
    updateValues();
    renderChart();
    saveToLocalStorage();

    closeModal();
});

cancelEditBtn.addEventListener("click", closeModal);

modal.addEventListener("click", e => {
    if(e.target === modal) closeModal();
});

document.addEventListener("keydown", e => {
    if(e.key === "Escape") closeModal();
});

function closeModal() {
    modal.classList.remove("show");
    setTimeout(() => {
        modal.classList.add("hidden");
        editingId = null;
    }, 200);
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    editingId = id;

    editTitle.value = transaction.title;
    editAmount.value = transaction.amount;
    editCategory.value = transaction.category;

    modal.classList.add("show");
    modal.classList.remove("hidden");
}

function updateValues() {
    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => acc + item, 0);
    const income = amounts.filter(a => a > 0).reduce((acc, item) => acc + item, 0);
    const expense = amounts.filter(a => a < 0).reduce((acc, item) => acc + item, 0);

    balanceEl.textContent = `Balance: ${formatYen(total)}`;
    incomeEl.textContent = `Income: ${formatYen(income)}`;
    expenseEl.textContent = `Expense: ${formatYen(Math.abs(expense))}`;
}

function deleteTransaction(id) {
    const li = document.querySelector(`li[data-id="${id}"]`);
    if (!li) return;

    li.style.opacity = "0";
    li.style.transform = "translateX(50px)";

    setTimeout(() => {
        transactions = transactions.filter(t => t.id !== id);
        applyFilter();
        updateValues();
        renderChart();
        saveToLocalStorage();
    }, 200);
}


function renderTransactions(data) {
    list.innerHTML = "";
    if (data.length === 0) {
        list.innerHTML = `<p class="empty">No transactions found</p>`;
        return;
    }

    data.forEach(addTransactionToList);
}

function applyFilter() {
    let filtered = currentFilter === "all"
        ? transactions
        : transactions.filter(t => t.category === currentFilter);

    const searchTerm = searchInput.value.toLowerCase();

    filtered = filtered.filter(t => t.title.toLowerCase().includes(searchTerm));

    renderTransactions(filtered);
}

function renderChart() {
    const categories = ["food", "transport", "salary", "other"];
    const categoryTotals = categories.map(cat =>
        transactions.filter(t => t.category === cat).reduce((acc, t) => acc + Math.abs(t.amount),0)
    );
    const emptyMsg = document.getElementById("chart-empty");

    if (transactions.length === 0) {
        emptyMsg.style.display = "block";

        if (chart) {
            chart.destroy();
            chart = null;
        }
        return;
    } else {
        emptyMsg.style.display = "none";
    }

    if (chart) {
        chart.data.datasets[0].data = categoryTotals;
        chart.update();
        return;
    }

    const ctx = document.getElementById("myChart").getContext("2d");
    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
            datasets: [{
                data: categoryTotals,
                backgroundColor: ["#4caf50", "#2196f3", "#f9a825", "#9c27b0"]
            }]
        },
        options: {
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

function formatYen(amount) {
    return new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY"
    }).format(amount);
}
