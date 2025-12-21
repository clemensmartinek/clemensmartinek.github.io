// ETF Rechner mit Chart und Entnahmeplan

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
	});
}

// Inputs
const investmentInput = document.getElementById("investmentAmount");
const apySlider = document.getElementById("apySlider");
const apyValueDisplay = document.getElementById("apyValue");
const distApyInput = document.getElementById("distApyInput");
const yearsInput = document.getElementById("yearsInput");
const reinvestCheckbox = document.getElementById("reinvestCheckbox");
const withdrawalPercentInput = document.getElementById("withdrawalPercent");

// Outputs
const yearsLabel = document.getElementById("yearsLabel");
const finalAmountDisplay = document.getElementById("finalAmount");
const totalDistDisplay = document.getElementById("totalDist");
const totalWithdrawalDisplay = document.getElementById("totalWithdrawal");
const yearlyWithdrawalDisplay = document.getElementById("yearlyWithdrawal");
const monthlyWithdrawalDisplay = document.getElementById("monthlyWithdrawal");

// Chart
let etfChart;

function formatCurrency(value) {
	return new Intl.NumberFormat("de-AT", {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

function calculateETF() {
	const startAmount = parseFloat(investmentInput.value) || 0;
	const apy = parseFloat(apySlider.value) / 100;
	const distApy = parseFloat(distApyInput.value) / 100;
	const years = parseInt(yearsInput.value) || 1;
	const withdrawalPercent = parseFloat(withdrawalPercentInput.value) / 100 || 0;
	const reinvest = reinvestCheckbox.checked;
	yearsLabel.textContent = years;
	apyValueDisplay.textContent = parseFloat(apySlider.value).toFixed(1) + "%";

	// UI-Elemente für dynamisches Ein-/Ausblenden
	const reinvestContainer = document.getElementById("reinvestContainer");
	const withdrawalResultBox = document.getElementById("withdrawalResultBox");
	const withdrawalDetails = document.getElementById("withdrawalDetails");
	const totalDistBox = document.getElementById("totalDistBox");

	// Logik für Anzeige der Container
	if (withdrawalPercent > 0) {
		// Entnahmeplan aktiv
		reinvestContainer.classList.add("hidden");
		withdrawalResultBox.classList.remove("hidden");
		withdrawalDetails.classList.remove("hidden");
		totalDistBox.classList.add("hidden");
	} else {
		// Kein Entnahmeplan
		reinvestContainer.classList.remove("hidden");
		withdrawalResultBox.classList.add("hidden");
		withdrawalDetails.classList.add("hidden");

		// Ausschüttungen-Box nur anzeigen wenn NICHT reinvestiert wird
		if (reinvest) {
			totalDistBox.classList.add("hidden");
		} else {
			totalDistBox.classList.remove("hidden");
		}
	}
	let capital = startAmount;
	let totalDist = 0;
	let totalWithdrawal = 0;
	let chartData = [capital];
	let yearlyWithdrawal = 0;
	let yearlyDetailsData = []; // Array für detaillierte Jahresübersicht

	for (let i = 1; i <= years; i++) {
		let capitalStart = capital;

		// 1. Ausschüttung berechnen (vor Steuer)
		let distGross = capital * distApy;
		// Nach KESt (27,5%)
		let distNet = distGross * 0.725;
		let distNetOriginal = distNet; // Für die Anzeige speichern

		// 2. Entnahme-Logik
		let withdrawalTarget = startAmount * withdrawalPercent; // Ziel-Entnahme basierend auf Startkapital
		let actualWithdrawal = 0;

		if (withdrawalPercent > 0) {
			// Erst aus Ausschüttungen nehmen
			if (distNet >= withdrawalTarget) {
				actualWithdrawal = withdrawalTarget;
				distNet -= withdrawalTarget;
			} else {
				// Ausschüttung reicht nicht, Rest aus Kapital verkaufen
				actualWithdrawal = distNet;
				let needFromCapital = withdrawalTarget - distNet;
				// Verkauf unterliegt 27,5% Steuer, daher müssen wir mehr verkaufen
				let sellAmount = needFromCapital / 0.725;

				if (capital >= sellAmount) {
					capital -= sellAmount;
					actualWithdrawal += needFromCapital;
				} else {
					// Nicht genug Kapital, nehmen was da ist
					let availableNet = capital * 0.725;
					actualWithdrawal += availableNet;
					capital = 0;
				}
				distNet = 0; // Ausschüttung komplett aufgebraucht
			}

			totalWithdrawal += actualWithdrawal;
			yearlyWithdrawal = actualWithdrawal; // Für Anzeige
		}

		// 3. Reinvestieren (nur wenn kein Entnahmeplan)
		let reinvestedAmount = 0;
		if (withdrawalPercent === 0 && reinvest && distNet > 0) {
			capital += distNet;
			reinvestedAmount = distNet;
			distNet = 0;
		}

		// Ausschüttungen die nicht reinvestiert oder entnommen wurden, tracken
		if (withdrawalPercent === 0) {
			totalDist += distNet;
		}

		// 4. Wertsteigerung auf verbleibendes Kapital
		let capitalBeforeGrowth = capital;
		if (capital > 0) {
			capital = capital * (1 + apy);
		}
		let growthAmount = capital - capitalBeforeGrowth;

		chartData.push(capital);

		// Detaillierte Daten für das Jahr speichern
		yearlyDetailsData.push({
			year: i,
			capitalStart: capitalStart,
			distribution: distNetOriginal,
			action: withdrawalPercent > 0 ? actualWithdrawal : reinvest ? reinvestedAmount : distNet,
			actionType: withdrawalPercent > 0 ? "withdrawal" : reinvest ? "reinvest" : "payout",
			growth: growthAmount,
			capitalEnd: capital,
		});
	}

	// Anzeige aktualisieren
	finalAmountDisplay.textContent = formatCurrency(capital);
	totalDistDisplay.textContent = formatCurrency(totalDist);

	if (withdrawalPercent > 0) {
		totalWithdrawalDisplay.textContent = formatCurrency(totalWithdrawal);
		yearlyWithdrawalDisplay.textContent = formatCurrency(yearlyWithdrawal);
		monthlyWithdrawalDisplay.textContent = formatCurrency(yearlyWithdrawal / 12);
	}

	updateChart(chartData, years);
	updateYearlyDetailsTable(yearlyDetailsData, withdrawalPercent > 0, reinvest);
}

function updateYearlyDetailsTable(data, hasWithdrawal, isReinvesting) {
	const tableBody = document.getElementById("yearlyDetailsTable");
	const actionHeader = document.getElementById("actionHeader");

	// Header anpassen basierend auf Strategie
	if (hasWithdrawal) {
		actionHeader.textContent = "Entnahme";
	} else if (isReinvesting) {
		actionHeader.textContent = "Reinvestiert";
	} else {
		actionHeader.textContent = "Ausgezahlt";
	}

	// Tabelle leeren
	tableBody.innerHTML = "";

	// Zeilen hinzufügen
	data.forEach((yearData, index) => {
		const row = document.createElement("tr");
		row.className = index % 2 === 0 ? "bg-white dark:bg-slate-900/20" : "bg-gray-50 dark:bg-slate-900/40";

		const actionValue = yearData.action;
		const actionColor = hasWithdrawal
			? "text-purple-600 dark:text-purple-400"
			: isReinvesting
			? "text-green-600 dark:text-green-400"
			: "text-blue-600 dark:text-blue-400";

		row.innerHTML = `
			<td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">${yearData.year}</td>
			<td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">${formatCurrency(yearData.capitalStart)}</td>
			<td class="px-4 py-3 text-right text-green-600 dark:text-green-400">${formatCurrency(yearData.distribution)}</td>
			<td class="px-4 py-3 text-right ${actionColor}">${formatCurrency(actionValue)}</td>
			<td class="px-4 py-3 text-right text-blue-600 dark:text-blue-400">${formatCurrency(yearData.growth)}</td>
			<td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">${formatCurrency(yearData.capitalEnd)}</td>
		`;

		tableBody.appendChild(row);
	});
}

function updateChart(data, years) {
	const ctx = document.getElementById("etfChart").getContext("2d");
	const isDark = htmlElement.classList.contains("dark");

	if (etfChart) {
		etfChart.destroy();
	}

	etfChart = new Chart(ctx, {
		type: "line",
		data: {
			labels: Array.from({ length: years + 1 }, (_, i) => "Jahr " + i),
			datasets: [
				{
					label: "Kapitalentwicklung",
					data: data,
					borderColor: isDark ? "#60a5fa" : "#2563eb",
					backgroundColor: isDark ? "rgba(96,165,250,0.1)" : "rgba(37,99,235,0.1)",
					fill: true,
					tension: 0.4,
					pointRadius: 3,
					pointHoverRadius: 6,
					borderWidth: 2,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					backgroundColor: isDark ? "#1e293b" : "#ffffff",
					titleColor: isDark ? "#f1f5f9" : "#1e293b",
					bodyColor: isDark ? "#94a3b8" : "#64748b",
					borderColor: isDark ? "#334155" : "#e2e8f0",
					borderWidth: 1,
					callbacks: {
						label: function (context) {
							return "Kapital: " + formatCurrency(context.parsed.y);
						},
					},
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					grid: {
						color: isDark ? "#334155" : "#e2e8f0",
					},
					ticks: {
						color: isDark ? "#94a3b8" : "#64748b",
						callback: function (value) {
							return new Intl.NumberFormat("de-AT", {
								style: "currency",
								currency: "EUR",
								minimumFractionDigits: 0,
								maximumFractionDigits: 0,
							}).format(value);
						},
					},
				},
				x: {
					grid: {
						color: isDark ? "#334155" : "#e2e8f0",
					},
					ticks: {
						color: isDark ? "#94a3b8" : "#64748b",
					},
				},
			},
		},
	});
}

// Event listeners
investmentInput.addEventListener("input", calculateETF);
apySlider.addEventListener("input", calculateETF);
distApyInput.addEventListener("input", calculateETF);
yearsInput.addEventListener("input", calculateETF);
reinvestCheckbox.addEventListener("change", calculateETF);
withdrawalPercentInput.addEventListener("input", calculateETF);

// Quick select functions
function setInvestmentAmount(amount) {
	investmentInput.value = amount;
	calculateETF();
}

function setYears(years) {
	yearsInput.value = years;
	calculateETF();
}

// Toggle yearly details dropdown
function toggleYearlyDetails() {
	const content = document.getElementById("yearlyDetailsContent");
	const icon = document.getElementById("dropdownIcon");

	if (content.classList.contains("hidden")) {
		content.classList.remove("hidden");
		icon.style.transform = "rotate(180deg)";
	} else {
		content.classList.add("hidden");
		icon.style.transform = "rotate(0deg)";
	}
}

// Initial calculation
calculateETF();
