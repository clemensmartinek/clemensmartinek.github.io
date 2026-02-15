// ETF Portfolio Rechner

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
	calculateETFPortfolio();
}

// Calculate full ETF portfolio projection / costs per year
function calculateETFPortfolio() {
	const resultsDiv = document.getElementById("portfolioResults");
	if (!resultsDiv) return;

	const depotAmount = parseFloat(document.getElementById("depotAmount").value) || 0;
	const ter = parseFloat(document.getElementById("ter").value) || 0; // percent
	const savingsAmount = parseFloat(document.getElementById("savingsAmount").value) || 0;
	const savingsFreq = parseInt(document.getElementById("savingsFrequency").value) || 12;
	const savingsExchange = document.getElementById("savingsExchange") ? document.getElementById("savingsExchange").value : "wien";
	const isDistributing = document.getElementById("distributingETF").checked;
	const dividendYield = isDistributing ? (parseFloat(document.getElementById("dividendYield").value) || 0) : 0; // percent
	const distributionFreq = document.getElementById("distributionFrequency").value;
	const useDevisen = document.getElementById("useDevisenProvision").checked;
	const reinvest = document.getElementById("reinvestDividends").checked;
	const chargeReinvestOrders = document.getElementById("chargeOrderOnReinvest") && document.getElementById("chargeOrderOnReinvest").checked;
	const annualReturn = parseFloat(document.getElementById("annualReturn").value) || 0;
	const years = parseInt(document.getElementById("years").value) || 1;

	// determine distributions per year
	let distributionsPerYear = 0;
	switch (distributionFreq) {
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
	if (!isDistributing) distributionsPerYear = 0;

	// iterate years
	let currentDepot = depotAmount;
	const tbody = document.getElementById("portfolioTableBody");
	tbody.innerHTML = "";

	let totalCostsAll = 0;
	let totalCostsFromCash = 0;
	let totalDividendsGross = 0;
	let totalDividendsNet = 0;
	let totalTerFees = 0;
	let totalDepotFees = 0;
	let totalOrderFees = 0;
	let totalDevisenFeesAll = 0;
	let totalGrowth = 0;
	let totalContributionsAll = 0;

	for (let y = 1; y <= years; y++) {
		const startDepot = currentDepot;
		const annualContributions = savingsAmount * savingsFreq;

		// average depot for fee calculations (approximate)
		const avgDepot = startDepot + annualContributions / 2;

		// gross dividends
		const annualDivGross = avgDepot * (dividendYield / 100);

		// devisen fees for distributions
		let totalDevisenFees = 0;
		if (distributionsPerYear > 0 && useDevisen) {
			const perDist = annualDivGross / distributionsPerYear;
			let perFee = 0;
			if (perDist <= 5500) perFee = 13.89;
			else perFee = perDist * 0.002; // 0.20%
			totalDevisenFees = perFee * distributionsPerYear;
		}

		// KESt on dividends (after devisen fees)
		const taxable = Math.max(0, annualDivGross - totalDevisenFees);
		const kest = taxable > 0 ? taxable * 0.275 : 0;

		const annualDivNet = annualDivGross - totalDevisenFees - kest;

		// TER (taken from assets) yearly
		const terAmount = avgDepot * (ter / 100);

		// Depotgebühren (monthly 0.015% + 20% UST)
		const monthlyFeeBeforeTax = avgDepot * 0.00015;
		const monthlyFee = monthlyFeeBeforeTax * 1.2;
		const yearlyDepotFee = monthlyFee * 12;

		// Orderkosten for savings plan (differ by exchange)
		const ordersPerYear = savingsFreq;
		const costPerOrder = savingsPlanOrderCostForExecution(savingsAmount, savingsExchange, false);
		let orderCostsYear = ordersPerYear * costPerOrder;

		// If reinvesting and charging order costs for reinvest, compute reinvest order costs
		let reinvestOrderCosts = 0;
		if (reinvest && distributionsPerYear > 0 && chargeReinvestOrders) {
			const perDistGross = annualDivGross / distributionsPerYear;
			let perDistDevisen = 0;
			if (useDevisen) {
				if (perDistGross <= 5500) perDistDevisen = 13.89;
				else perDistDevisen = perDistGross * 0.002;
			}
			const perDistTaxable = Math.max(0, perDistGross - perDistDevisen);
			const perDistKest = perDistTaxable > 0 ? perDistTaxable * 0.275 : 0;
			const perDistNet = perDistGross - perDistDevisen - perDistKest;
			reinvestOrderCosts = distributionsPerYear * orderCostForAmount(perDistNet, savingsExchange, false);
			orderCostsYear += reinvestOrderCosts;
		}

		// Total costs this year
		const totalCostsYear = terAmount + yearlyDepotFee + orderCostsYear + totalDevisenFees;
		const costsFromCashYear = yearlyDepotFee + orderCostsYear + totalDevisenFees; // TER not paid from cash

		// end depot value: apply annual return to assets, add reinvested net dividends if chosen, subtract TER
		const preGrowth = startDepot + annualContributions;
		const growth = preGrowth * (annualReturn / 100);
		let endDepot = preGrowth + growth;
		if (reinvest) endDepot += annualDivNet; // reinvest net dividends
		// subtract TER from assets (TER lowers asset value)
		endDepot -= terAmount;

		// append row
		const tr = document.createElement("tr");
		const growthClass = growth >= 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-600 dark:text-rose-400 font-semibold";
		const growthPrefix = growth >= 0 ? "+" : "";
		tr.innerHTML = `
			<td class="px-3 py-2">${y}</td>
			<td class="px-3 py-2">${formatCurrency(startDepot)}</td>
			<td class="px-3 py-2">${formatCurrency(annualContributions)}</td>
			<td class="px-3 py-2 ${growthClass}">${growthPrefix}${formatCurrency(growth)}</td>
			<td class="px-3 py-2">${formatCurrency(annualDivGross)}</td>
			<td class="px-3 py-2">${formatCurrency(totalDevisenFees)}</td>
			<td class="px-3 py-2">${formatCurrency(kest)}</td>
			<td class="px-3 py-2">${formatCurrency(annualDivNet)}</td>
			<td class="px-3 py-2">${formatCurrency(terAmount)}</td>
			<td class="px-3 py-2">${formatCurrency(yearlyDepotFee)}</td>
			<td class="px-3 py-2">${formatCurrency(orderCostsYear)}</td>
			<td class="px-3 py-2">${formatCurrency(totalCostsYear)}</td>
			<td class="px-3 py-2">${formatCurrency(endDepot)}</td>
		`;
		tbody.appendChild(tr);

		// accumulate
		totalCostsAll += totalCostsYear;
		totalCostsFromCash += costsFromCashYear;
		totalDividendsGross += annualDivGross;
		totalDividendsNet += annualDivNet;
		totalTerFees += terAmount;
		totalDepotFees += yearlyDepotFee;
		totalOrderFees += orderCostsYear;
		totalDevisenFeesAll += totalDevisenFees;
		totalGrowth += growth;
		totalContributionsAll += annualContributions;

		// next year
		currentDepot = endDepot;
	}

	// show results
	const orderSection = document.getElementById("orderCostsSection");
	if (orderSection && !orderSection.classList.contains("hidden")) {
		resultsDiv.classList.add("hidden");
	} else {
		resultsDiv.classList.remove("hidden");
	}
	document.getElementById("totalCostsAll").textContent = formatCurrency(totalCostsAll);
	document.getElementById("costsFromCash").textContent = formatCurrency(totalCostsFromCash);
	document.getElementById("totalTerFees").textContent = formatCurrency(totalTerFees);
	document.getElementById("totalDividendsGross").textContent = formatCurrency(totalDividendsGross);
	document.getElementById("totalDividendsNet").textContent = formatCurrency(totalDividendsNet);
	document.getElementById("totalDepotFees").textContent = formatCurrency(totalDepotFees);
	document.getElementById("totalOrderFees").textContent = formatCurrency(totalOrderFees);
	document.getElementById("totalDevisenFees").textContent = formatCurrency(totalDevisenFeesAll);
	const growthPrefixTotal = totalGrowth >= 0 ? "+" : "";
	const growthBase = depotAmount + totalContributionsAll;
	const growthPct = growthBase > 0 ? (totalGrowth / growthBase) * 100 : 0;
	const growthAbsEl = document.getElementById("totalGrowthAbsolute");
	const growthPctEl = document.getElementById("totalGrowthPercent");
	growthAbsEl.textContent = `${growthPrefixTotal}${formatCurrency(totalGrowth)}`;
	growthAbsEl.className = totalGrowth >= 0
		? "text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1"
		: "text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1";
	growthPctEl.textContent = `${growthPct.toFixed(2)} % auf investiertes Kapital`;
	updateSavingsStandardOrderCostHint();
}

// Calculate distribution costs (Devisenprovision)
function calculateDistributionCosts() {
	const isDistributing = document.getElementById("distributingETF").checked;
	const distributionSection = document.getElementById("distributionSection");
	const useDevisen = document.getElementById("useDevisenProvision") ? document.getElementById("useDevisenProvision").checked : false;

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

		const devisenFeePerDistribution = useDevisen ? 13.89 : 0;
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

// Helper: compute order cost for a given amount and exchange
function orderCostForAmount(amount, exchange, foreignCurrency) {
	const baseFee = 3.99;
	const variableFee = amount * 0.0019; // 0.19%

	let exchangeFee = 0;
	switch (exchange) {
		case "wien":
			exchangeFee = Math.max(amount * 0.0002, 1.15);
			break;
		case "xetra":
			exchangeFee = amount * 0.0002;
			break;
		case "us":
			exchangeFee = amount * 0.0001;
			break;
		default:
			exchangeFee = amount * 0.0002;
	}

	let devisenFee = 0;
	if (exchange === "us" && foreignCurrency) {
		if (amount <= 5500) devisenFee = 13.89;
		else devisenFee = amount * 0.002; // 0.20%
	}

	return baseFee + variableFee + exchangeFee + devisenFee;
}

function savingsPlanOrderCostForExecution(amount, exchange, foreignCurrency) {
	const modeEl = document.getElementById("savingsOrderType");
	const mode = modeEl ? modeEl.value : "standard";

	if (mode === "free") {
		return 0;
	}

	if (mode === "flat") {
		const flatFee = parseFloat(document.getElementById("savingsOrderFlatFee").value) || 0;
		return Math.max(0, flatFee);
	}

	return orderCostForAmount(amount, exchange, foreignCurrency);
}

function updateSavingsOrderTypeUI() {
	const modeEl = document.getElementById("savingsOrderType");
	const wrap = document.getElementById("savingsOrderFlatFeeWrap");
	if (!modeEl || !wrap) return;

	if (modeEl.value === "flat") {
		wrap.classList.remove("hidden");
	} else {
		wrap.classList.add("hidden");
	}
}

function updateSavingsStandardOrderCostHint() {
	const hint = document.getElementById("savingsStandardOrderCostHint");
	if (!hint) return;

	const savingsAmount = parseFloat(document.getElementById("savingsAmount").value) || 0;
	const savingsExchange = document.getElementById("savingsExchange") ? document.getElementById("savingsExchange").value : "wien";
	const standardCost = orderCostForAmount(savingsAmount, savingsExchange, false);

	hint.textContent = `Normale Ordergebühr (${savingsExchange === "wien" ? "Wien" : "Xetra"}) pro Ausführung: ${formatCurrency(standardCost)}`;
}

// Order tab switching
function switchOrderTab(tab) {
	const overviewBtn = document.getElementById("orderTabOverview");
	const examplesBtn = document.getElementById("orderTabExamples");
	const overviewPanel = document.getElementById("orderOverviewPanel");
	const examplesPanel = document.getElementById("orderExamplesPanel");

	if (tab === "overview") {
		overviewBtn.classList.add("bg-white", "dark:bg-slate-700", "text-blue-600");
		overviewBtn.classList.remove("text-gray-700", "dark:text-gray-300");
		examplesBtn.classList.remove("bg-white", "dark:bg-slate-700", "text-blue-600");
		examplesBtn.classList.add("text-gray-700", "dark:text-gray-300");
		overviewPanel.classList.remove("hidden");
		examplesPanel.classList.add("hidden");
	} else {
		examplesBtn.classList.add("bg-white", "dark:bg-slate-700", "text-blue-600");
		examplesBtn.classList.remove("text-gray-700", "dark:text-gray-300");
		overviewBtn.classList.remove("bg-white", "dark:bg-slate-700", "text-blue-600");
		overviewBtn.classList.add("text-gray-700", "dark:text-gray-300");
		overviewPanel.classList.add("hidden");
		examplesPanel.classList.remove("hidden");
	}
}

// Attach tab listeners (if elements exist)
if (document.getElementById("orderTabOverview")) {
	document.getElementById("orderTabOverview").addEventListener("click", () => switchOrderTab("overview"));
}
if (document.getElementById("orderTabExamples")) {
	document.getElementById("orderTabExamples").addEventListener("click", () => switchOrderTab("examples"));
}

// Initialize order tab default
switchOrderTab("overview");

// Main tab switching (Depotentwicklung / Ordergebühren)
function switchMainTab(tab) {
	const depotBtn = document.getElementById("mainTabDepot");
	const ordersBtn = document.getElementById("mainTabOrders");
	const depotSection = document.getElementById("depotSection");
	const portfolio = document.getElementById("portfolioResults");
	const orders = document.getElementById("orderCostsSection");

	if (tab === "depot") {
		depotBtn.classList.add("bg-white", "dark:bg-slate-700", "text-blue-600");
		depotBtn.classList.remove("text-gray-700", "dark:text-gray-300");
		ordersBtn.classList.remove("bg-white", "dark:bg-slate-700", "text-blue-600");
		ordersBtn.classList.add("text-gray-700", "dark:text-gray-300");
		if (depotSection) depotSection.classList.remove("hidden");
		if (portfolio) portfolio.classList.remove("hidden");
		orders.classList.add("hidden");
	} else {
		ordersBtn.classList.add("bg-white", "dark:bg-slate-700", "text-blue-600");
		ordersBtn.classList.remove("text-gray-700", "dark:text-gray-300");
		depotBtn.classList.remove("bg-white", "dark:bg-slate-700", "text-blue-600");
		depotBtn.classList.add("text-gray-700", "dark:text-gray-300");
		if (depotSection) depotSection.classList.add("hidden");
		if (portfolio) portfolio.classList.add("hidden");
		orders.classList.remove("hidden");
	}
}

// Attach main tab listeners and set default
if (document.getElementById("mainTabDepot")) {
	document.getElementById("mainTabDepot").addEventListener("click", () => switchMainTab("depot"));
}
if (document.getElementById("mainTabOrders")) {
	document.getElementById("mainTabOrders").addEventListener("click", () => switchMainTab("orders"));
}
switchMainTab("depot");

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

// New listeners for ETF portfolio inputs
document.getElementById("ter").addEventListener("input", calculateETFPortfolio);
document.getElementById("dividendYield").addEventListener("input", calculateETFPortfolio);
document.getElementById("savingsAmount").addEventListener("input", calculateETFPortfolio);
document.getElementById("savingsFrequency").addEventListener("change", calculateETFPortfolio);
document.getElementById("savingsExchange").addEventListener("change", calculateETFPortfolio);
document.getElementById("savingsOrderType").addEventListener("change", () => {
	updateSavingsOrderTypeUI();
	calculateETFPortfolio();
});
document.getElementById("savingsOrderFlatFee").addEventListener("input", calculateETFPortfolio);
document.getElementById("useDevisenProvision").addEventListener("change", calculateETFPortfolio);
document.getElementById("useDevisenProvision").addEventListener("change", calculateDistributionCosts);
document.getElementById("reinvestDividends").addEventListener("change", calculateETFPortfolio);
document.getElementById("years").addEventListener("input", calculateETFPortfolio);

// additional listeners
document.getElementById("exchange").addEventListener("change", calculateETFPortfolio);
document.getElementById("foreignCurrency").addEventListener("change", calculateETFPortfolio);
document.getElementById("chargeOrderOnReinvest").addEventListener("change", calculateETFPortfolio);
document.getElementById("annualReturn").addEventListener("input", calculateETFPortfolio);
document.getElementById("ter").addEventListener("input", calculateETFPortfolio);

// Also refresh portfolio on distribution toggles
document.getElementById("distributingETF").addEventListener("change", calculateETFPortfolio);
document.getElementById("distributionFrequency").addEventListener("change", calculateETFPortfolio);

// Initial calculations
calculateDepotCosts();
calculateOrderCosts();
updateSavingsOrderTypeUI();
updateSavingsStandardOrderCostHint();
