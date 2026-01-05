// Broker Kosten Rechner

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

// Format currency
function formatCurrency(value) {
	return new Intl.NumberFormat("de-AT", {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

// Set depot amount from badges
function setDepotAmount(amount) {
	document.getElementById("depotAmount").value = amount;
	calculateDepotCosts();
}

// Calculate depot costs
function calculateDepotCosts() {
	const depotAmount = parseFloat(document.getElementById("depotAmount").value) || 0;

	// 0.015% pro Monat
	const monthlyFeeBeforeTax = depotAmount * 0.00015;

	// + 20% UST
	const monthlyFee = monthlyFeeBeforeTax * 1.2;
	const yearlyFee = monthlyFee * 12;

	document.getElementById("depotMonthly").textContent = formatCurrency(monthlyFee);
	document.getElementById("depotYearly").textContent = formatCurrency(yearlyFee);

	calculateDistributionCosts();
}

// Calculate distribution costs (Devisenprovision)
function calculateDistributionCosts() {
	const isDistributing = document.getElementById("distributingETF").checked;
	const distributionSection = document.getElementById("distributionSection");

	if (isDistributing) {
		distributionSection.classList.remove("hidden");

		const frequency = document.getElementById("distributionFrequency").value;
		let distributionsPerYear = 0;

		switch (frequency) {
			case "quarterly":
				distributionsPerYear = 4;
				break;
			case "monthly":
				distributionsPerYear = 12;
				break;
			case "yearly":
				distributionsPerYear = 1;
				break;
		}

		// Devisenprovision: 13,89 € pro Ausschüttung (unter 5.500 €)
		// Für größere Beträge: 0,20% - aber wir nehmen hier die Pauschale
		const devisenFeePerDistribution = 13.89;
		const totalDevisenFees = devisenFeePerDistribution * distributionsPerYear;

		document.getElementById("devisenYearly").textContent = formatCurrency(totalDevisenFees);
		document.getElementById("distributionCount").textContent = distributionsPerYear + "x pro Jahr";
	} else {
		distributionSection.classList.add("hidden");
	}
}

// Calculate order costs
function calculateOrderCosts() {
	const orderAmount = parseFloat(document.getElementById("orderAmount").value) || 0;
	const exchange = document.getElementById("exchange").value;
	const foreignCurrency = document.getElementById("foreignCurrency").checked;

	// Show/hide foreign currency section for US exchanges
	const foreignCurrencySection = document.getElementById("foreignCurrencySection");
	const orderDevisenFeeRow = document.getElementById("orderDevisenFeeRow");

	if (exchange === "us") {
		foreignCurrencySection.classList.remove("hidden");
	} else {
		foreignCurrencySection.classList.add("hidden");
	}

	// Base fee: 3,99 €
	const baseFee = 3.99;

	// Variable fee: 0,19%
	const variableFee = orderAmount * 0.0019;

	// Exchange specific fees
	let exchangeFee = 0;
	let exchangeFeeDescription = "";

	switch (exchange) {
		case "wien":
			// 0,02% bzw. 1,15 € fix (je nachdem was höher)
			const wienPercentFee = orderAmount * 0.0002;
			exchangeFee = Math.max(wienPercentFee, 1.15);
			exchangeFeeDescription = "Wiener Börse";
			break;
		case "xetra":
			// Fremde Spesen Xetra (geschätzt ähnlich wie Wien)
			exchangeFee = orderAmount * 0.0002;
			exchangeFeeDescription = "XETRA";
			break;
		case "us":
			// Fremde Spesen NYSE/NASDAQ
			exchangeFee = orderAmount * 0.0001;
			exchangeFeeDescription = "NYSE/NASDAQ";
			break;
	}

	// Devisenprovision (nur bei US-Börsen in Fremdwährung)
	let devisenFee = 0;
	if (exchange === "us" && foreignCurrency) {
		if (orderAmount <= 5500) {
			devisenFee = 13.89;
		} else {
			devisenFee = orderAmount * 0.002; // 0,20%
		}
		orderDevisenFeeRow.classList.remove("hidden");
	} else {
		orderDevisenFeeRow.classList.add("hidden");
	}

	// Total
	const totalFee = baseFee + variableFee + exchangeFee + devisenFee;

	// Update display
	document.getElementById("orderBaseFee").textContent = formatCurrency(baseFee);
	document.getElementById("orderVariableFee").textContent = formatCurrency(variableFee);
	document.getElementById("orderExchangeFee").textContent = formatCurrency(exchangeFee);
	document.getElementById("orderDevisenFee").textContent = formatCurrency(devisenFee);
	document.getElementById("orderTotalFee").textContent = formatCurrency(totalFee);

	// Update example costs
	updateExampleCosts(exchange);
}

// Update example costs based on selected exchange
function updateExampleCosts(exchange) {
	const exampleCostsDiv = document.getElementById("exampleCosts");
	let examples = [];

	switch (exchange) {
		case "wien":
			examples = [
				{ amount: "1.000 €", cost: "7,24 €" },
				{ amount: "2.000 €", cost: "9,34 €" },
				{ amount: "5.000 €", cost: "15,64 €" },
				{ amount: "10.000 €", cost: "26,14 €" },
			];
			break;
		case "xetra":
			examples = [
				{ amount: "1.000 €", cost: "7,76 €" },
				{ amount: "2.000 €", cost: "9,67 €" },
				{ amount: "5.000 €", cost: "15,40 €" },
				{ amount: "10.000 €", cost: "24,98 €" },
			];
			break;
		case "us":
			examples = [
				{ amount: "1.000 €", cost: "5,93 €" },
				{ amount: "2.000 €", cost: "7,97 €" },
				{ amount: "5.000 €", cost: "14,08 €" },
				{ amount: "10.000 €", cost: "24,26 €" },
			];
			break;
	}

	exampleCostsDiv.innerHTML = examples
		.map(
			(ex) => `
		<div class="flex justify-between">
			<span>${ex.amount}:</span>
			<span class="font-semibold">${ex.cost}</span>
		</div>
	`
		)
		.join("");
}

// Event listeners
document.getElementById("depotAmount").addEventListener("input", calculateDepotCosts);
document.getElementById("distributingETF").addEventListener("change", calculateDistributionCosts);
document.getElementById("distributionFrequency").addEventListener("change", calculateDistributionCosts);
document.getElementById("orderAmount").addEventListener("input", calculateOrderCosts);
document.getElementById("exchange").addEventListener("change", calculateOrderCosts);
document.getElementById("foreignCurrency").addEventListener("change", calculateOrderCosts);

// Initial calculations
calculateDepotCosts();
calculateOrderCosts();
