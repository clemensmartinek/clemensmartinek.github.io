// Stable Coin Lending Calculator
$(document).ready(function () {
	// Initialize calculator
	updateCalculations();

	// Event listeners
	$("#starting-amount, #apy-rate").on("input", updateCalculations);

	// APY slider display update
	$("#apy-rate").on("input", function () {
		$("#apy-display").text(parseFloat($(this).val()).toFixed(1));
		updateCalculations();
	});

	// Main calculation function
	function updateCalculations() {
		const startingAmount = parseFloat($("#starting-amount").val()) || 0;
		const apyRate = parseFloat($("#apy-rate").val()) || 5;
		const taxRate = 0.275; // 27.5% tax

		// Calculate bi-weekly returns
		const biweeklyRate = apyRate / 100 / 26; // 26 bi-weekly periods per year
		const biweeklyGrossInterest = startingAmount * biweeklyRate;
		const biweeklyTax = biweeklyGrossInterest * taxRate;
		const biweeklyNetInterest = biweeklyGrossInterest - biweeklyTax;

		// Calculate monthly returns
		const monthlyGrossInterest = biweeklyGrossInterest * 2.17; // ~26/12 periods per month
		const monthlyTax = monthlyGrossInterest * taxRate;
		const monthlyNetInterest = monthlyGrossInterest - monthlyTax;

		// Calculate yearly returns with compound interest
		const yearlyGrossInterest = startingAmount * (apyRate / 100);
		const yearlyTax = yearlyGrossInterest * taxRate;
		const yearlyNetInterest = yearlyGrossInterest - yearlyTax;

		// Update display
		updateDisplay({
			biweeklyGross: biweeklyGrossInterest,
			biweeklyNet: biweeklyNetInterest,
			monthlyGross: monthlyGrossInterest,
			monthlyNet: monthlyNetInterest,
			yearlyGross: yearlyGrossInterest,
			yearlyNet: yearlyNetInterest,
		});
	}

	// Update display with calculated values
	function updateDisplay(results) {
		$("#biweekly-gross").text(formatCurrency(results.biweeklyGross));
		$("#biweekly-net").text(formatCurrency(results.biweeklyNet) + " after tax");

		$("#monthly-gross").text(formatCurrency(results.monthlyGross));
		$("#monthly-net").text(formatCurrency(results.monthlyNet) + " after tax");

		$("#yearly-gross").text(formatCurrency(results.yearlyGross));
		$("#yearly-net").text(formatCurrency(results.yearlyNet) + " after tax");
	}

	// Format currency helper
	function formatCurrency(amount) {
		return "€" + formatNumber(amount);
	}

	// Format number helper
	function formatNumber(amount) {
		return new Intl.NumberFormat("en-EU", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	}

	// Add input validation
	$("#starting-amount").on("blur", function () {
		const value = parseFloat($(this).val());
		if (isNaN(value) || value < 0) {
			$(this).val(0);
			updateCalculations();
		}
	});

	// Format large numbers on input
	$("#starting-amount").on("input", function () {
		const value = parseFloat($(this).val());
		if (value >= 10000) {
			$(this).addClass("large-number");
		} else {
			$(this).removeClass("large-number");
		}
	});

	console.log("🧮 Stable Coin Lending Calculator initialized");
	console.log("💰 Calculate your crypto lending returns with precision!");
});
