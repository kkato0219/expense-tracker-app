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

let transactions = [];
let currentFilter = "all";
let chart;
let editing = null;

function saveToLocalStorage() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

const saved = localStorage.getItem("transactions");

if (saved) {
    transactions = JSON.parse(saved);
    renderTransactions(transactions);
    updateValues();
    renderChart();
}

addBtn.addEventListener("click", function () {
    const title = titleInput.value.trim();
    const amount = Number(amountInput.value.trim());
    const category = categoryInput.value;

    if (!title || !amount) {
        alert("Please enter a valid title and amount");
        return;
    }

    const transaction = {
        id: Date.now(),
        title,
        amount,
        category
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
    

    li.innerHTML = `
        <span class ="text">
            ${transaction.title} (${transaction.category}):
            ${new Intl.NumberFormat("ja-JP", { 
                style: "currency",
                currency: "JPY"
            }).format(transaction.amount)}
        </span>
        <div>    
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>            
    `;

    li.dataset.id = transaction.id;
    list.appendChild(li);

    li.querySelector(".delete-btn").addEventListener("click", () => {
        deleteTransaction(transaction.id);
    });

    li.querySelector(".edit-btn").addEventListener("click", () => {
        editTransaction(transaction.id);
    });
}

modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.add("hidden");
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        modal.classList.add("hidden");
    }
});

saveEditBtn.addEventListener("click", () => {
    const transaction = transactions.find(t => t.id === editingId);

    transaction.title = editTitle.value;
    transaction.amount = Number(editAmount.value);
    transaction.category = editCategory.value;

    applyFilter();
    updateValues();
    renderChart();
    saveToLocalStorage();

    modal.classList.remove("show");

    setTimeout(() => {
        modal.classList.add("hidden");
    }, 200);
});

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);

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

    balanceEl.textContent = `Balance: ${new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY"
    }).format(total)}`;

    incomeEl.textContent = `Income: ${new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY"
    }).format(income)}`;

    expenseEl.textContent = `Expense: ${new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY"
    }).format(Math.abs(expense))}`;
}

function deleteTransaction(id) {
    const li = document.querySelector(`li[data-id="${id}"]`);

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

    filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchTerm)
    );

    renderTransactions(filtered);
}

function renderChart() {
    const income = transactions
        .filter(t => t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
        .filter(t => t.amount < 0)
        .reduce ((acc, t) => acc + t.amount, 0);

    const data = [income, Math.abs(expense)];

    if (chart) {
        chart.data.datasets[0].data = data;
        chart.update();
        return;
    }

    const ctx = document.getElementById("myChart").getContext("2d");

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Income", "Expense"],
            datasets: [{
                label: "Money Flow",
                data: data,
                backgroundColor: ["#4caf50", "#f44336"]
            }]
        }
    });
}

function formatYen(amount) {
    return new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY"
    }).format(amount);
}