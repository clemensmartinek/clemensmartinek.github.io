// Verkaufs Simulator

// Theme toggle functionality
const themeToggle = document.getElementById("themeToggle");
const htmlElement = document.documentElement;

// Check for saved theme preference or default to dark mode
const currentTheme = localStorage.getItem("theme") || "dark";
if (currentTheme === "dark") {
    htmlElement.classList.add("dark");
} else {
    htmlElement.classList.remove("dark");
}

// Toggle theme on button click
if (themeToggle) {
    themeToggle.addEventListener("click", function () {
        htmlElement.classList.toggle("dark");

        // Save theme preference
        const theme = htmlElement.classList.contains("dark") ? "dark" : "light";
        localStorage.setItem("theme", theme);
    });
}

// Tab management
let activeTab = "sell"; // Default: sell mode

function switchTab(tab) {
    activeTab = tab;

    const tabSell = document.getElementById("tabSell");
    const tabKeep = document.getElementById("tabKeep");
    const sellInput = document.getElementById("sellInput");
    const keepInput = document.getElementById("keepInput");

    if (tab === "sell") {
        // Style active tab
        tabSell.className = "flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm";
        tabKeep.className = "flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100";

        // Show/hide inputs
        sellInput.classList.remove("hidden");
        keepInput.classList.add("hidden");
    } else {
        // Style active tab
        tabKeep.className = "flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm";
        tabSell.className = "flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100";

        // Show/hide inputs
        keepInput.classList.remove("hidden");
        sellInput.classList.add("hidden");
    }

    calculateSale();
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat("de-AT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

// Calculate DCA
function calculateDCA() {
    const totalShares = parseFloat(document.getElementById("totalShares").value) || 0;
    const totalCost = parseFloat(document.getElementById("totalCost").value) || 0;

    if (totalShares <= 0) {
        document.getElementById("dcaValue").textContent = "0,00 €";
        return 0;
    }

    const dca = totalCost / totalShares;
    // Show DCA with high precision (8 decimal places)
    document.getElementById("dcaValue").textContent = new Intl.NumberFormat("de-AT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
    }).format(dca);
    return dca;
}

// Calculate sale
function calculateSale() {
    const totalShares = parseFloat(document.getElementById("totalShares").value) || 0;
    const totalCost = parseFloat(document.getElementById("totalCost").value) || 0;
    const sellPrice = parseFloat(document.getElementById("sellPrice").value) || 0;

    // Calculate shares to sell based on active tab
    let sharesToSell;
    if (activeTab === "sell") {
        sharesToSell = parseFloat(document.getElementById("sharesToSell").value) || 0;
    } else {
        const sharesToKeep = parseFloat(document.getElementById("sharesToKeep").value) || 0;
        sharesToSell = totalShares - sharesToKeep;
        if (sharesToSell < 0) sharesToSell = 0;
        // Update display of calculated shares to sell
        document.getElementById("calculatedSellShares").textContent = sharesToSell.toFixed(2);
    }

    // Calculate DCA
    const dca = totalShares > 0 ? totalCost / totalShares : 0;

    // Check if selling more than owned
    if (sharesToSell > totalShares) {
        if (activeTab === "sell") {
            alert("Du kannst nicht mehr Stücke verkaufen als du besitzt!");
            document.getElementById("sharesToSell").value = totalShares;
        } else {
            alert("Du kannst nicht weniger als 0 Stücke behalten!");
            document.getElementById("sharesToKeep").value = 0;
        }
        return;
    }

    // Verkaufserlös (brutto)
    const grossProceeds = sharesToSell * sellPrice;

    // Anschaffungskosten der verkauften Stücke
    const acquisitionCost = sharesToSell * dca;

    // Gewinn/Verlust
    const profitLoss = grossProceeds - acquisitionCost;

    // KESt (27,5% nur bei Gewinn)
    let kestAmount = 0;
    if (profitLoss > 0) {
        kestAmount = profitLoss * 0.275;
    }

    // Nettoerlös
    const netProceeds = grossProceeds - kestAmount;

    // Verbleibende Werte
    const remainingShares = totalShares - sharesToSell;
    const remainingValue = remainingShares * dca;

    // Update display
    document.getElementById("grossProceeds").textContent = formatCurrency(grossProceeds);
    document.getElementById("acquisitionCost").textContent = formatCurrency(acquisitionCost);

    // Gewinn/Verlust mit Farbe
    const profitLossElement = document.getElementById("profitLoss");
    profitLossElement.textContent = formatCurrency(profitLoss);
    if (profitLoss > 0) {
        profitLossElement.className = "text-lg font-semibold text-green-600 dark:text-green-400";
    } else if (profitLoss < 0) {
        profitLossElement.className = "text-lg font-semibold text-red-600 dark:text-red-400";
    } else {
        profitLossElement.className = "text-lg font-semibold text-gray-900 dark:text-gray-100";
    }

    // KESt nur anzeigen wenn Gewinn
    const kestRow = document.getElementById("kestRow");
    if (profitLoss > 0) {
        kestRow.classList.remove("hidden");
        document.getElementById("kestAmount").textContent = formatCurrency(kestAmount);
    } else {
        kestRow.classList.add("hidden");
    }

    document.getElementById("netProceeds").textContent = formatCurrency(netProceeds);
    document.getElementById("remainingShares").textContent = remainingShares.toFixed(2);
    document.getElementById("remainingValue").textContent = formatCurrency(remainingValue);
}

// Event listeners
document.getElementById("totalShares").addEventListener("input", function () {
    calculateDCA();
    calculateSale();
});

document.getElementById("totalCost").addEventListener("input", function () {
    calculateDCA();
    calculateSale();
});

document.getElementById("sharesToSell").addEventListener("input", calculateSale);
document.getElementById("sharesToKeep").addEventListener("input", calculateSale);
document.getElementById("sellPrice").addEventListener("input", calculateSale);

// Tab event listeners
document.getElementById("tabSell").addEventListener("click", () => switchTab("sell"));
document.getElementById("tabKeep").addEventListener("click", () => switchTab("keep"));

// Initial calculation
calculateDCA();
calculateSale();
