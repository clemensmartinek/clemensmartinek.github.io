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

const validationFieldIds = ["totalShares", "totalCost", "sharesToSell", "sharesToKeep", "sellPrice"];

function clearValidationState() {
    validationFieldIds.forEach((fieldId) => {
        const input = document.getElementById(fieldId);
        const error = document.getElementById(`${fieldId}Error`);
        if (!input || !error) return;

        input.classList.remove("border-red-500", "dark:border-red-500");
        input.classList.add("border-gray-300", "dark:border-slate-600");
        input.classList.remove("border-red-500", "dark:border-red-500", "ring-2", "ring-red-200", "dark:ring-red-900/50");
        error.textContent = "";
        error.classList.add("hidden");
    });
}

function setInputError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}Error`);
    if (!input || !error) return;

    input.classList.remove("border-gray-300", "dark:border-slate-600");
    input.classList.add("border-red-500", "dark:border-red-500", "ring-2", "ring-red-200", "dark:ring-red-900/50");
    error.textContent = message;
    error.classList.remove("hidden");
}

function parseInputValue(fieldId) {
    const raw = document.getElementById(fieldId).value.trim();
    if (raw === "") {
        return { hasValue: false, value: 0, invalid: false };
    }

    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
        return { hasValue: true, value: 0, invalid: true };
    }

    return { hasValue: true, value: parsed, invalid: false };
}

function resetSaleResults() {
    document.getElementById("grossProceeds").textContent = formatCurrency(0);
    document.getElementById("acquisitionCost").textContent = formatCurrency(0);
    document.getElementById("netProceeds").textContent = formatCurrency(0);
    document.getElementById("remainingValue").textContent = formatCurrency(0);

    const profitLossElement = document.getElementById("profitLoss");
    profitLossElement.textContent = formatCurrency(0);
    profitLossElement.className = "text-lg font-semibold text-gray-900 dark:text-gray-100";

    document.getElementById("kestAmount").textContent = formatCurrency(0);
    document.getElementById("kestRow").classList.add("hidden");
}

// Calculate DCA
function calculateDCA() {
    const totalShares = parseInputValue("totalShares").value;
    const totalCost = parseInputValue("totalCost").value;

    if (totalShares <= 0 || totalCost < 0) {
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
    clearValidationState();

    const totalSharesInput = parseInputValue("totalShares");
    const totalCostInput = parseInputValue("totalCost");
    const sellPriceInput = parseInputValue("sellPrice");
    const totalShares = totalSharesInput.value;
    const totalCost = totalCostInput.value;
    const hasSellPrice = sellPriceInput.hasValue;
    const sellPrice = hasSellPrice ? sellPriceInput.value : 0;

    // Calculate shares to sell based on active tab
    let sharesToSell;
    let sharesToSellInput;
    let sharesToKeepInput;
    if (activeTab === "sell") {
        sharesToSellInput = parseInputValue("sharesToSell");
        sharesToSell = sharesToSellInput.value;
    } else {
        sharesToKeepInput = parseInputValue("sharesToKeep");
        const sharesToKeep = sharesToKeepInput.value;
        sharesToSell = totalShares - sharesToKeep;
        if (sharesToSell < 0) sharesToSell = 0;
        // Update display of calculated shares to sell
        document.getElementById("calculatedSellShares").textContent = sharesToSell.toFixed(2);
    }

    let hasValidationError = false;
    if (totalSharesInput.invalid || totalShares < 0) {
        setInputError("totalShares", "Bitte gib eine gültige, nicht negative Stückzahl ein.");
        hasValidationError = true;
    }

    if (totalCostInput.invalid || totalCost < 0) {
        setInputError("totalCost", "Bitte gib gültige, nicht negative Gesamtkosten ein.");
        hasValidationError = true;
    }

    if (sellPriceInput.invalid || (hasSellPrice && sellPrice < 0)) {
        setInputError("sellPrice", "Bitte gib einen gültigen, nicht negativen Verkaufspreis ein.");
        hasValidationError = true;
    }

    if (activeTab === "sell" && (sharesToSellInput.invalid || sharesToSell < 0)) {
        setInputError("sharesToSell", "Bitte gib eine gültige, nicht negative Stückzahl zum Verkauf ein.");
        hasValidationError = true;
    }

    if (activeTab === "keep" && (sharesToKeepInput.invalid || sharesToKeepInput.value < 0)) {
        setInputError("sharesToKeep", "Bitte gib eine gültige, nicht negative Stückzahl zum Behalten ein.");
        hasValidationError = true;
    }

    if (hasValidationError) {
        resetSaleResults();
        document.getElementById("remainingShares").textContent = "0.00";
        document.getElementById("remainingBookValue").textContent = formatCurrency(0);
        document.getElementById("breakEvenPrice").textContent = formatCurrency(0);
        return;
    }

    // Calculate DCA
    const dca = totalShares > 0 ? totalCost / totalShares : 0;
    document.getElementById("breakEvenPrice").textContent = formatCurrency(dca);

    // Check if selling more than owned
    if (sharesToSell > totalShares) {
        if (activeTab === "sell") {
            setInputError("sharesToSell", "Du kannst nicht mehr Stücke verkaufen als du besitzt.");
        } else {
            setInputError("sharesToKeep", "Die Stückzahl zum Behalten darf nicht größer als dein Bestand sein.");
        }
        resetSaleResults();
        document.getElementById("remainingShares").textContent = "0.00";
        document.getElementById("remainingBookValue").textContent = formatCurrency(0);
        return;
    }

    const remainingShares = totalShares - sharesToSell;
    document.getElementById("remainingShares").textContent = remainingShares.toFixed(2);
    document.getElementById("remainingBookValue").textContent = formatCurrency(remainingShares * dca);

    // Ohne Verkaufspreis keine Verkaufsberechnung durchführen
    if (!hasSellPrice) {
        resetSaleResults();
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
    const remainingValue = remainingShares * sellPrice;

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
