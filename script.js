const titleInput = document.querySelector("#title");
const amountInput = document.querySelector("#amount");
const categoryInput = document.querySelector("#category");
const addBtn = document.querySelector("#add-btn");

const list = document.querySelector("#list");

const balanceEl = document.querySelector("#balance");
const incomeEl = document.querySelector("#income");
const expenseEl = document.querySelector("#expense");

const filterBtns = document.querySelectorAll(".filter-btn");

let transactions = [];
let currentFilter = "all";
let chart;

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

    localStorage.setItem("transactions", JSON.stringify(transactions));

    titleInput.value = "";
    amountInput.value = "";
});

function addTransactionToList(transaction) {
    const li = document.createElement("li");

    li.classList.add(transaction.amount > 0 ? "income" : "expense");
    

    li.innerHTML = `
        ${transaction.title} (${transaction.category}): ¥${transaction.amount}
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>        
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

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);

    const newTitle = prompt("Edit title:", transaction.title);
    const newAmount = prompt("Edit amount:", transaction.amount);

    if (!newTitle || !newAmount) return;

    transaction.title = newTitle;
    transaction.amount = Number(newAmount);

    applyFilter();
    updateValues();
    renderChart();
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function updateValues() {
    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => acc + item, 0);
    const income = amounts.filter(a => a > 0).reduce((acc, item) => acc + item, 0);
    const expense = amounts.filter(a => a < 0).reduce((acc, item) => acc + item, 0);

    balanceEl.textContent = `Balance: ¥${total}`;
    incomeEl.textContent = `Income: ¥${income}`;
    expenseEl.textContent = `Expense: ¥${Math.abs(expense)}`;
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);

    applyFilter();

    updateValues();
    renderChart();

    localStorage.setItem("transactions", JSON.stringify(transactions));
}

filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        
        filterBtns.forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        currentFilter = btn.dataset.category;
        applyFilter();
    });
});

function renderTransactions(data) {
    list.innerHTML = "";
    data.forEach(addTransactionToList);
}

function applyFilter() {
    const filtered = currentFilter === "all"
    ? transactions
    : transactions.filter(t => t.category === currentFilter);

    renderTransactions(filtered);
}

function renderChart() {
    const income = transactions
        .filter(t => t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
        .filter(t => t.amount < 0)
        .reduce ((acc, t) => acc + t.amount, 0);

    const data = {
        labels: ["Income", "Expense"],
        datasets: [{
            label: "Money Flow",
            data: [income, Math.abs(expense)],
            backgroundColor: ["#4caf50", "#f44336"]
        }]
    };

    if (chart) {
        chart.destroy();
    }

    const ctx = document.getElementById("myChart").getContext("2d");

    chart = new Chart(ctx, {
        type: "doughnut",
        data: data
    });
}