// Stablecoin Lending Calculator

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

// Vault APY Anzeige
async function fetchVaultApy() {
	const query = `query { vaultByAddress(address: \"0x34eCe536d2ae03192B06c0A67030D1Faf4c0Ba43\" chainId: 1) { address state { netApy } } }`;
	try {
		const response = await fetch("https://api.morpho.org/graphql", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query }),
		});
		const result = await response.json();
		const apy = result?.data?.vaultByAddress?.state?.netApy;
		const apyDisplay = document.getElementById("vaultApy");
		if (apyDisplay) {
			apyDisplay.textContent = apy ? (apy * 100).toFixed(2) + "%" : "Nicht verfügbar";
		}
	} catch (err) {
		const apyDisplay = document.getElementById("vaultApy");
		if (apyDisplay) apyDisplay.textContent = "Fehler beim Laden";
	}
}

// Beim Laden der Seite ausführen
fetchVaultApy();

// Calculator functionality
document.addEventListener("DOMContentLoaded", function () {
	const investmentInput = document.getElementById("investmentAmount");
	const apySlider = document.getElementById("apySlider");
	const apyValueDisplay = document.getElementById("apyValue");
	const kestCheckbox = document.getElementById("kestCheckbox");

	const weeklyEarningsDisplay = document.getElementById("weeklyEarnings");
	const monthlyEarningsDisplay = document.getElementById("monthlyEarnings");
	const yearlyEarningsDisplay = document.getElementById("yearlyEarnings");

	// Format number as currency
	function formatCurrency(value) {
		return new Intl.NumberFormat("de-AT", {
			style: "currency",
			currency: "EUR",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(value);
	}

	// Calculate earnings
	function calculateEarnings() {
		const investmentAmount = parseFloat(investmentInput.value) || 0;
		const apy = parseFloat(apySlider.value) / 100;
		const applyKest = kestCheckbox.checked;

		// Calculate yearly earnings
		let yearlyEarnings = investmentAmount * apy;

		// Apply KESt if checked (27.5%)
		if (applyKest) {
			yearlyEarnings = yearlyEarnings * (1 - 0.275);
		}

		// Calculate monthly and weekly earnings
		const monthlyEarnings = yearlyEarnings / 12;
		const weeklyEarnings = yearlyEarnings / 52;

		// Update displays
		weeklyEarningsDisplay.textContent = formatCurrency(weeklyEarnings);
		monthlyEarningsDisplay.textContent = formatCurrency(monthlyEarnings);
		yearlyEarningsDisplay.textContent = formatCurrency(yearlyEarnings);

		// Update APY display
		apyValueDisplay.textContent = apySlider.value + "%";
	}

	// Event listeners
	investmentInput.addEventListener("input", calculateEarnings);
	apySlider.addEventListener("input", calculateEarnings);
	kestCheckbox.addEventListener("change", calculateEarnings);

	// Initial calculation
	calculateEarnings();
});
