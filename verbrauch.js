// Verbrauch Page JavaScript
// Theme toggle functionality
const themeToggle = document.getElementById("themeToggle");
const htmlElement = document.documentElement;

const currentTheme = localStorage.getItem("theme") || "dark";
if (currentTheme === "dark") {
	htmlElement.classList.add("dark");
} else {
	htmlElement.classList.remove("dark");
}

if (themeToggle) {
	themeToggle.addEventListener("click", function () {
		htmlElement.classList.toggle("dark");
		const theme = htmlElement.classList.contains("dark") ? "dark" : "light";
		localStorage.setItem("theme", theme);

		// Update charts on theme change
		if (parsedData) {
			updateAllCharts();
		}
	});
}

// Global data storage
let parsedData = null;
let stromChart = null;

// Format currency
function formatCurrency(value) {
	return new Intl.NumberFormat("de-AT", {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

// Parse uploaded file
function parseFile(content) {
	const lines = content.split("\n");
	const data = {
		stromMonthly: [],
		stromYearly: [],
		waerme: [],
		warmwasser: [],
		miete: [],
	};

	let currentSection = null;

	lines.forEach((line) => {
		line = line.trim();
		if (!line) return;

		// Parse data first to check for section headers
		const parts = line.split(";");

		// Detect sections (case-insensitive and flexible)
		if (line.toLowerCase().includes("strom") && line.toLowerCase().includes("verbrauch pro monat")) {
			currentSection = "stromMonthly";
			return;
		}
		if (line.toLowerCase().includes("strom") && line.toLowerCase().includes("rechnungen")) {
			currentSection = "stromYearly";
			return;
		}
		if (line.toLowerCase().includes("wärme") && (line.toLowerCase().includes("rechnungen") || line.toLowerCase().includes("(rechnungen)"))) {
			currentSection = "waerme";
			return;
		}
		if (line.toLowerCase().includes("warmwasser") && (line.toLowerCase().includes("rechnungen") || line.toLowerCase().includes("(rechnungen)"))) {
			currentSection = "warmwasser";
			return;
		}
		if (line.toLowerCase().startsWith("miete") && parts.length <= 3) {
			currentSection = "miete";
			return;
		}

		// Skip if no section is set or if it looks like a header/empty line
		if (!currentSection || parts.length < 3) return;

		// Parse data based on section
		if (currentSection === "stromMonthly" && parts.length >= 7) {
			const year = parseInt(parts[3]);
			const pricePerKwh = parseFloat(parts[5].replace(" Cent/kWh", "").replace(",", "."));
			const consumption = parseFloat(parts[6].replace(" kWh", "").replace(",", "."));

			if (!isNaN(year) && !isNaN(pricePerKwh) && !isNaN(consumption)) {
				data.stromMonthly.push({
					address: parts[0],
					year: year,
					month: parts[4],
					pricePerKwh: pricePerKwh,
					consumption: consumption,
				});
			}
		} else if (currentSection === "stromYearly" && parts.length >= 6) {
			const year = parseInt(parts[3]);
			const betrag = parseFloat(parts[5].replace("€", "").replace(",", ".").trim());
			const consumption = parseFloat(parts[4].replace(" kWh", "").replace(",", "."));

			if (!isNaN(year) && !isNaN(betrag) && !isNaN(consumption)) {
				data.stromYearly.push({
					address: parts[0],
					year: year,
					consumption: consumption,
					amount: betrag,
				});
			}
		} else if (currentSection === "waerme" && parts.length >= 6) {
			const year = parseInt(parts[3]);
			const betrag = parseFloat(parts[5].replace("€", "").replace(",", ".").trim());

			if (!isNaN(year) && !isNaN(betrag)) {
				data.waerme.push({
					address: parts[0],
					year: year,
					consumption: parts[4],
					amount: betrag,
				});
			}
		} else if (currentSection === "warmwasser" && parts.length >= 6) {
			const year = parseInt(parts[3]);
			const betrag = parseFloat(parts[5].replace("€", "").replace(",", ".").trim());

			if (!isNaN(year) && !isNaN(betrag)) {
				data.warmwasser.push({
					address: parts[0],
					year: year,
					consumption: parts[4],
					amount: betrag,
				});
			}
		} else if (currentSection === "miete" && parts.length >= 5) {
			const year = parseInt(parts[2]);
			const betrag = parseFloat(parts[4].replace(",", ".").trim());

			if (!isNaN(year) && !isNaN(betrag)) {
				data.miete.push({
					address: parts[0],
					year: year,
					month: parts[3],
					amount: betrag,
				});
			}
		}
	});

	// Debug output
	console.log("Parsed data:", data);
	console.log("Strom Monthly:", data.stromMonthly.length, "entries");
	console.log("Strom Yearly:", data.stromYearly.length, "entries");
	console.log("Wärme:", data.waerme.length, "entries");
	console.log("Warmwasser:", data.warmwasser.length, "entries");
	console.log("Miete:", data.miete.length, "entries");

	return data;
}

// Toggle format info
function toggleFormatInfo() {
	const formatInfo = document.getElementById("formatInfo");
	const icon = document.getElementById("formatInfoIcon");
	formatInfo.classList.toggle("hidden");
	icon.style.transform = formatInfo.classList.contains("hidden") ? "" : "rotate(180deg)";
}

// File upload handler
document.getElementById("fileInput").addEventListener("change", function (e) {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = function (event) {
		const content = event.target.result;
		parsedData = parseFile(content);

		// Show file info
		document.getElementById("fileName").textContent = file.name;
		document.getElementById("fileInfo").classList.remove("hidden");

		// Show data section
		document.getElementById("dataSection").classList.remove("hidden");

		// Populate filters
		populateFilters();

		// Display data
		updateDisplay();
	};

	reader.readAsText(file);
});

// Populate filter dropdowns
function populateFilters() {
	if (!parsedData) return;

	// Get all unique years
	const years = new Set();
	Object.values(parsedData).forEach((category) => {
		category.forEach((item) => {
			if (item.year) years.add(item.year);
		});
	});

	const yearFilter = document.getElementById("yearFilter");
	yearFilter.innerHTML = '<option value="all">Alle Jahre</option>';
	Array.from(years)
		.sort()
		.forEach((year) => {
			yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
		});

	// Category filter
	const categoryFilter = document.getElementById("categoryFilter");
	categoryFilter.innerHTML = `
		<option value="all">Alle Kategorien</option>
		<option value="strom">Strom</option>
		<option value="waerme">Wärme</option>
		<option value="warmwasser">Warmwasser</option>
		<option value="miete">Miete</option>
	`;
	// Add event listeners
	categoryFilter.addEventListener("change", updateDisplay);
	yearFilter.addEventListener("change", updateDisplay);
}

// Update display based on filters
function updateDisplay() {
	if (!parsedData) return;

	const category = document.getElementById("categoryFilter").value;
	const year = document.getElementById("yearFilter").value;

	displayYearlyOverview(category, year);
	displayMieteQuarterAnalysis(year);
	updateStromChart();
}

// Display yearly overview table
function displayYearlyOverview(categoryFilter, yearFilter) {
	const tbody = document.getElementById("yearlyTableBody");
	tbody.innerHTML = "";

	// Get all unique years
	const years = new Set();
	Object.values(parsedData).forEach((category) => {
		category.forEach((item) => {
			if (item.year) years.add(item.year);
		});
	});
	// Get address (from first available entry)
	let address = "";
	for (const category of Object.values(parsedData)) {
		if (category.length > 0 && category[0].address) {
			address = category[0].address;
			break;
		}
	}

	// Aggregate data by year with consumption info
	const yearlyData = {};

	// Strom
	parsedData.stromYearly.forEach((item) => {
		if (!yearlyData[item.year]) {
			yearlyData[item.year] = {
				strom: 0,
				waerme: 0,
				warmwasser: 0,
				miete: 0,
				stromConsumption: "",
				waermeConsumption: "",
				warmwasserConsumption: "",
			};
		}
		yearlyData[item.year].strom = item.amount;
		yearlyData[item.year].stromConsumption = item.consumption ? `${item.consumption} kWh` : "";
	});

	// Wärme
	parsedData.waerme.forEach((item) => {
		if (!yearlyData[item.year]) {
			yearlyData[item.year] = {
				strom: 0,
				waerme: 0,
				warmwasser: 0,
				miete: 0,
				stromConsumption: "",
				waermeConsumption: "",
				warmwasserConsumption: "",
			};
		}
		yearlyData[item.year].waerme = item.amount;
		yearlyData[item.year].waermeConsumption = item.consumption || "";
	});

	// Warmwasser
	parsedData.warmwasser.forEach((item) => {
		if (!yearlyData[item.year]) {
			yearlyData[item.year] = {
				strom: 0,
				waerme: 0,
				warmwasser: 0,
				miete: 0,
				stromConsumption: "",
				waermeConsumption: "",
				warmwasserConsumption: "",
			};
		}
		yearlyData[item.year].warmwasser = item.amount;
		yearlyData[item.year].warmwasserConsumption = item.consumption || "";
	});
	// Miete (aggregate all months)
	const mieteByYear = {};
	parsedData.miete.forEach((item) => {
		if (!mieteByYear[item.year]) {
			mieteByYear[item.year] = 0;
		}
		mieteByYear[item.year] += item.amount;
	});
	Object.entries(mieteByYear).forEach(([year, amount]) => {
		const y = parseInt(year);
		if (!yearlyData[y]) {
			yearlyData[y] = {
				strom: 0,
				waerme: 0,
				warmwasser: 0,
				miete: 0,
				stromConsumption: "",
				waermeConsumption: "",
				warmwasserConsumption: "",
			};
		}
		yearlyData[y].miete = amount;
	});

	// Convert to array and sort descending (newest first)
	let sortedYears = Object.entries(yearlyData)
		.map(([year, data]) => ({
			year: parseInt(year),
			...data,
			total: data.strom + data.waerme + data.warmwasser + data.miete,
		}))
		.sort((a, b) => b.year - a.year);

	// Filter by category if needed
	if (categoryFilter !== "all") {
		// Still show all years, just highlight the selected category
	}

	// Filter by year if needed
	if (yearFilter !== "all") {
		sortedYears = sortedYears.filter((item) => item.year === parseInt(yearFilter));
	}
	// Create table rows
	sortedYears.forEach((item, index) => {
		const prevItem = sortedYears[index + 1]; // Next item is previous year (because desc sorted)

		// Calculate changes
		const stromChange = prevItem ? ((item.strom - prevItem.strom) / prevItem.strom) * 100 : 0;
		const waermeChange = prevItem ? ((item.waerme - prevItem.waerme) / prevItem.waerme) * 100 : 0;
		const warmwasserChange = prevItem ? ((item.warmwasser - prevItem.warmwasser) / prevItem.warmwasser) * 100 : 0;
		const mieteChange = prevItem ? ((item.miete - prevItem.miete) / prevItem.miete) * 100 : 0;
		const totalChange = prevItem ? ((item.total - prevItem.total) / prevItem.total) * 100 : 0;

		const row = document.createElement("tr");
		row.className = "border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150";

		const shouldHighlight = (cat) => categoryFilter === "all" || categoryFilter === cat;

		row.innerHTML = `
			<td class="py-4 px-4 font-bold text-lg text-gray-800 dark:text-gray-100">${item.year}</td>
			<td class="py-4 px-4 text-right ${shouldHighlight("strom") ? "" : "opacity-50"}">
				<div class="font-semibold text-gray-800 dark:text-gray-100">${formatCurrency(item.strom)}</div>
				${item.stromConsumption ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${item.stromConsumption}</div>` : ""}
				${
					prevItem && item.strom > 0
						? `
					<div class="text-xs mt-1 ${stromChange >= 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}">
						${stromChange >= 0 ? "↑" : "↓"} ${Math.abs(stromChange).toFixed(1)}%
					</div>
				`
						: ""
				}
			</td>
			<td class="py-4 px-4 text-right ${shouldHighlight("waerme") ? "" : "opacity-50"}">
				<div class="font-semibold text-gray-800 dark:text-gray-100">${formatCurrency(item.waerme)}</div>
				${item.waermeConsumption ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${item.waermeConsumption}</div>` : ""}
				${
					prevItem && item.waerme > 0
						? `
					<div class="text-xs mt-1 ${waermeChange >= 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}">
						${waermeChange >= 0 ? "↑" : "↓"} ${Math.abs(waermeChange).toFixed(1)}%
					</div>
				`
						: ""
				}
			</td>
			<td class="py-4 px-4 text-right ${shouldHighlight("warmwasser") ? "" : "opacity-50"}">
				<div class="font-semibold text-gray-800 dark:text-gray-100">${formatCurrency(item.warmwasser)}</div>
				${item.warmwasserConsumption ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${item.warmwasserConsumption}</div>` : ""}
				${
					prevItem && item.warmwasser > 0
						? `
					<div class="text-xs mt-1 ${warmwasserChange >= 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}">
						${warmwasserChange >= 0 ? "↑" : "↓"} ${Math.abs(warmwasserChange).toFixed(1)}%
					</div>
				`
						: ""
				}
			</td>
			<td class="py-4 px-4 text-right ${shouldHighlight("miete") ? "" : "opacity-50"}">
				<div class="font-semibold text-gray-800 dark:text-gray-100">${formatCurrency(item.miete)}</div>
				${
					prevItem && item.miete > 0
						? `
					<div class="text-xs mt-1 ${mieteChange >= 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}">
						${mieteChange >= 0 ? "↑" : "↓"} ${Math.abs(mieteChange).toFixed(1)}%
					</div>
				`
						: ""
				}
			</td>
			<td class="py-4 px-4 text-right bg-blue-50 dark:bg-blue-900/20">
				<div class="font-bold text-lg text-blue-700 dark:text-blue-300">${formatCurrency(item.total)}</div>
				${
					prevItem
						? `
					<div class="text-xs mt-1 font-semibold ${totalChange >= 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}">
						${totalChange >= 0 ? "↑" : "↓"} ${Math.abs(totalChange).toFixed(1)}%
					</div>
				`
						: ""
				}
			</td>
		`;
		tbody.appendChild(row);
	});

	// Add address row at the bottom if available
	if (address && sortedYears.length > 0) {
		const addressRow = document.createElement("tr");
		addressRow.className = "bg-gray-50 dark:bg-slate-700/30 border-t-2 border-gray-300 dark:border-slate-600";
		addressRow.innerHTML = `
			<td colspan="6" class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-center">
				<span class="font-medium">Adresse:</span> ${address}
			</td>
		`;
		tbody.appendChild(addressRow);
	}

	if (sortedYears.length === 0) {
		tbody.innerHTML = `
			<tr>
				<td colspan="6" class="text-center py-12 text-gray-500 dark:text-gray-400">
					Keine Daten für die ausgewählten Filter verfügbar
				</td>
			</tr>
		`;
	}
}

// Display Miete quarterly analysis
function displayMieteQuarterAnalysis(yearFilter) {
	const tbody = document.getElementById("mieteQuarterBody");
	if (!tbody) return;

	tbody.innerHTML = "";

	if (!parsedData || !parsedData.miete || parsedData.miete.length === 0) {
		tbody.innerHTML = `
			<tr>
				<td colspan="5" class="text-center py-8 text-gray-500 dark:text-gray-400">
					Keine Mietdaten verfügbar
				</td>
			</tr>
		`;
		return;
	}

	// Group miete data by year and quarter
	const quarterlyData = {};

	parsedData.miete.forEach((item) => {
		const monthNum = getMonthNumber(item.month);
		if (monthNum === 0) return; // Skip invalid months

		const quarter = Math.ceil(monthNum / 3); // Q1: 1-3, Q2: 4-6, Q3: 7-9, Q4: 10-12
		const key = `${item.year}-Q${quarter}`;

		if (!quarterlyData[key]) {
			quarterlyData[key] = {
				year: item.year,
				quarter: quarter,
				months: [],
				total: 0,
			};
		}

		quarterlyData[key].months.push(item.amount);
		quarterlyData[key].total += item.amount;
	});

	// Convert to array and sort descending (newest first)
	let sortedQuarters = Object.values(quarterlyData)
		.map((q) => ({
			...q,
			avgPerMonth: q.total / q.months.length,
			monthsCount: q.months.length,
		}))
		.sort((a, b) => {
			if (a.year !== b.year) return b.year - a.year;
			return b.quarter - a.quarter;
		});

	// Filter by year if needed
	if (yearFilter !== "all") {
		sortedQuarters = sortedQuarters.filter((item) => item.year === parseInt(yearFilter));
	}

	// Create table rows
	sortedQuarters.forEach((item, index) => {
		const prevItem = sortedQuarters[index + 1]; // Next item is previous quarter (because desc sorted)

		// Calculate change compared to previous quarter
		const change = prevItem ? ((item.avgPerMonth - prevItem.avgPerMonth) / prevItem.avgPerMonth) * 100 : 0;

		const row = document.createElement("tr");
		row.className = "border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150";

		const quarterName = `Q${item.quarter}`;
		const quarterFullName = item.quarter === 1 ? "Jän - Mär" : item.quarter === 2 ? "Apr - Jun" : item.quarter === 3 ? "Jul - Sep" : "Okt - Dez";

		row.innerHTML = `
			<td class="py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">${item.year}</td>
			<td class="py-3 px-4 text-gray-700 dark:text-gray-300">
				<span class="font-semibold">${quarterName}</span>
				<span class="text-xs text-gray-500 dark:text-gray-400 ml-2">(${quarterFullName})</span>
				${item.monthsCount < 3 ? `<span class="text-xs text-orange-600 dark:text-orange-400 ml-2">⚠ ${item.monthsCount} Mon.</span>` : ""}
			</td>
			<td class="py-3 px-4 text-right font-semibold text-gray-800 dark:text-gray-100">
				${formatCurrency(item.avgPerMonth)}
			</td>
			<td class="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
				${formatCurrency(item.total)}
			</td>
			<td class="py-3 px-4 text-right">
				${
					prevItem
						? `
					<div class="flex items-center justify-end gap-2">
						<span class="text-sm font-semibold ${change >= 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}">
							${change >= 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(2)}%
						</span>
						<span class="text-xs text-gray-500 dark:text-gray-400">
							${change >= 0 ? "+" : ""}${formatCurrency(item.avgPerMonth - prevItem.avgPerMonth)}
						</span>
					</div>
				`
						: '<span class="text-gray-400 dark:text-gray-500 text-sm">-</span>'
				}
			</td>
		`;

		tbody.appendChild(row);
	});

	if (sortedQuarters.length === 0) {
		tbody.innerHTML = `
			<tr>
				<td colspan="5" class="text-center py-8 text-gray-500 dark:text-gray-400">
					Keine Daten für die ausgewählten Filter verfügbar
				</td>
			</tr>
		`;
	}
}

// Calculate and display yearly strom projections
function updateStromProjections(data) {
	const container = document.getElementById("stromProjections");
	if (!container) return;

	// Group by year
	const yearlyData = {};
	data.forEach((item) => {
		if (!yearlyData[item.year]) {
			yearlyData[item.year] = [];
		}
		yearlyData[item.year].push(item);
	});

	// Get the 3 most recent years (desc)
	const recentYears = Object.keys(yearlyData)
		.map((y) => parseInt(y))
		.sort((a, b) => b - a)
		.slice(0, 3);

	container.innerHTML = "";

	recentYears.forEach((year, index) => {
		const monthsData = yearlyData[year];
		const totalConsumption = monthsData.reduce((sum, m) => sum + m.consumption, 0);
		const avgPrice = monthsData.reduce((sum, m) => sum + m.pricePerKwh, 0) / monthsData.length;
		const monthsCount = monthsData.length;

		// Hochrechnung auf 12 Monate
		const projectedYearlyConsumption = (totalConsumption / monthsCount) * 12;
		const projectedYearlyCost = (projectedYearlyConsumption * avgPrice) / 100; // Convert from Cent to Euro

		const card = document.createElement("div");
		const isCurrentYear = index === 0;
		card.className = `p-4 rounded-lg border ${
			isCurrentYear
				? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
				: "bg-gray-50 dark:bg-slate-700/30 border-gray-200 dark:border-slate-600"
		}`;

		card.innerHTML = `
			<div class="flex items-center justify-between mb-2">
				<span class="font-bold text-gray-800 dark:text-gray-100">${year}</span>
				${isCurrentYear ? '<span class="text-xs bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-full">Aktuell</span>' : ""}
			</div>
			<div class="space-y-1 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-gray-400">Ø Preis:</span>
					<span class="font-semibold text-gray-800 dark:text-gray-100">${avgPrice.toFixed(2)} Cent/kWh</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-gray-400">Verbrauch (${monthsCount} Mon.):</span>
					<span class="font-semibold text-gray-800 dark:text-gray-100">${totalConsumption.toFixed(0)} kWh</span>
				</div>
				<div class="border-t border-gray-300 dark:border-slate-600 pt-2 mt-2">
					<div class="flex justify-between items-center">
						<span class="text-gray-700 dark:text-gray-300 font-medium">Hochrechnung/Jahr:</span>
					</div>
					<div class="flex justify-between mt-1">
						<span class="text-gray-600 dark:text-gray-400 text-xs">Verbrauch:</span>
						<span class="font-bold text-blue-600 dark:text-blue-400">${projectedYearlyConsumption.toFixed(0)} kWh</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400 text-xs">Kosten:</span>
						<span class="font-bold text-lg ${isCurrentYear ? "text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-100"}">${formatCurrency(
			projectedYearlyCost
		)}</span>
					</div>
				</div>
			</div>
		`;

		container.appendChild(card);
	});

	if (recentYears.length === 0) {
		container.innerHTML = `
			<div class="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">
				Keine Daten für Hochrechnung verfügbar
			</div>
		`;
	}
}

// Update Strom chart
function updateStromChart() {
	if (!parsedData || !parsedData.stromMonthly.length) return;

	const ctx = document.getElementById("stromChart").getContext("2d");
	const isDark = htmlElement.classList.contains("dark");

	const data = parsedData.stromMonthly.sort((a, b) => {
		if (a.year !== b.year) return a.year - b.year;
		return getMonthNumber(a.month) - getMonthNumber(b.month);
	});

	const labels = data.map((d) => `${d.month} ${d.year}`);
	const consumption = data.map((d) => d.consumption);
	const prices = data.map((d) => d.pricePerKwh);

	// Calculate yearly projections
	updateStromProjections(data);

	if (stromChart) {
		stromChart.destroy();
	}

	stromChart = new Chart(ctx, {
		type: "line",
		data: {
			labels: labels,
			datasets: [
				{
					label: "Verbrauch (kWh)",
					data: consumption,
					borderColor: isDark ? "#60a5fa" : "#2563eb",
					backgroundColor: isDark ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.1)",
					yAxisID: "y",
					tension: 0.3,
				},
				{
					label: "Preis (Cent/kWh)",
					data: prices,
					borderColor: isDark ? "#f59e0b" : "#d97706",
					backgroundColor: isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(217, 119, 6, 0.1)",
					yAxisID: "y1",
					tension: 0.3,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			interaction: {
				mode: "index",
				intersect: false,
			},
			plugins: {
				legend: {
					labels: {
						color: isDark ? "#f1f5f9" : "#1e293b",
					},
				},
				tooltip: {
					backgroundColor: isDark ? "#1e293b" : "#ffffff",
					titleColor: isDark ? "#f1f5f9" : "#1e293b",
					bodyColor: isDark ? "#cbd5e1" : "#475569",
					borderColor: isDark ? "#334155" : "#e2e8f0",
					borderWidth: 1,
				},
			},
			scales: {
				x: {
					ticks: {
						color: isDark ? "#94a3b8" : "#64748b",
					},
					grid: {
						color: isDark ? "#334155" : "#e2e8f0",
					},
				},
				y: {
					type: "linear",
					display: true,
					position: "left",
					title: {
						display: true,
						text: "Verbrauch (kWh)",
						color: isDark ? "#f1f5f9" : "#1e293b",
					},
					ticks: {
						color: isDark ? "#94a3b8" : "#64748b",
					},
					grid: {
						color: isDark ? "#334155" : "#e2e8f0",
					},
				},
				y1: {
					type: "linear",
					display: true,
					position: "right",
					title: {
						display: true,
						text: "Preis (Cent/kWh)",
						color: isDark ? "#f1f5f9" : "#1e293b",
					},
					ticks: {
						color: isDark ? "#94a3b8" : "#64748b",
					},
					grid: {
						drawOnChartArea: false,
					},
				},
			},
		},
	});
}

// Update all charts (for theme changes)
function updateAllCharts() {
	updateStromChart();
}

// Helper function to convert month names to numbers
function getMonthNumber(monthName) {
	const months = {
		Jänner: 1,
		Januar: 1,
		Februar: 2,
		März: 3,
		April: 4,
		Mai: 5,
		Juni: 6,
		Juli: 7,
		August: 8,
		September: 9,
		Oktober: 10,
		November: 11,
		Dezember: 12,
	};
	return months[monthName] || 0;
}
