// Lending Calculators with Tab Support
$(document).ready(function () {
	// Initialize
	updateBitpandaSelfCalculations();
	updateDeFiWalletCalculations();

	// Tab switching
	$(".tab-button").on("click", function () {
		const targetTab = $(this).data("tab");

		// Sync invested amount values between tabs
		const currentAmount = targetTab === "bitpanda-self"
			? $("#starting-amount-defi").val()
			: $("#starting-amount-self").val();

		const targetAmountInput = targetTab === "bitpanda-self"
			? "#starting-amount-self"
			: "#starting-amount-defi";

		$(targetAmountInput).val(currentAmount);

		// Sync APY values between tabs
		const currentAPY = targetTab === "bitpanda-self"
			? $("#apy-rate-defi").val()
			: $("#apy-rate-self").val();

		const targetAPYInput = targetTab === "bitpanda-self"
			? "#apy-rate-self"
			: "#apy-rate-defi";

		const targetAPYDisplay = targetTab === "bitpanda-self"
			? "#apy-display-self"
			: "#apy-display-defi";

		$(targetAPYInput).val(currentAPY);
		$(targetAPYDisplay).text(parseFloat(currentAPY).toFixed(1));

		// Update tab buttons
		$(".tab-button").removeClass("active");
		$(this).addClass("active");

		// Update tab content
		$(".tab-content").removeClass("active");
		$("#" + targetTab).addClass("active");

		// Recalculate for the new tab
		if (targetTab === "bitpanda-self") {
			updateBitpandaSelfCalculations();
		} else {
			updateDeFiWalletCalculations();
		}
	});

	// Bitpanda Self event listeners
	$("#starting-amount-self, #apy-rate-self").on("input", updateBitpandaSelfCalculations);
	$("#apy-rate-self").on("input", function () {
		$("#apy-display-self").text(parseFloat($(this).val()).toFixed(1));
		updateBitpandaSelfCalculations();
	});

	// DeFi Wallet event listeners
	$("#starting-amount-defi, #apy-rate-defi").on("input", updateDeFiWalletCalculations);
	$("#apy-rate-defi").on("input", function () {
		$("#apy-display-defi").text(parseFloat($(this).val()).toFixed(1));
		updateDeFiWalletCalculations();
	});

	// Bitpanda Self calculation function
	function updateBitpandaSelfCalculations() {
		const startingAmount = parseFloat($("#starting-amount-self").val()) || 0;
		const apyRate = parseFloat($("#apy-rate-self").val()) || 5;
		const taxRate = 0.275; // 27.5% tax

		// Calculate bi-weekly returns (tax applied immediately)
		const biweeklyRate = apyRate / 100 / 26; // 26 bi-weekly periods per year
		const biweeklyGrossInterest = startingAmount * biweeklyRate;
		const biweeklyTax = biweeklyGrossInterest * taxRate;
		const biweeklyNetInterest = biweeklyGrossInterest - biweeklyTax;

		// Calculate monthly returns
		const monthlyGrossInterest = biweeklyGrossInterest * 2.17; // ~26/12 periods per month
		const monthlyTax = monthlyGrossInterest * taxRate;
		const monthlyNetInterest = monthlyGrossInterest - monthlyTax;

		// Calculate yearly returns with compound interest on net amounts
		let balance = startingAmount;
		for (let i = 0; i < 26; i++) {
			const grossInterest = balance * biweeklyRate;
			const netInterest = grossInterest * (1 - taxRate);
			balance += netInterest;
		}
		const yearlyGrossInterest = startingAmount * (apyRate / 100);
		const yearlyNetInterest = balance - startingAmount;

		// Update Bitpanda Self display
		$("#biweekly-gross-self").text(formatCurrency(biweeklyGrossInterest));
		$("#biweekly-net-self").text(formatCurrency(biweeklyNetInterest) + " after tax");
		$("#monthly-gross-self").text(formatCurrency(monthlyGrossInterest));
		$("#monthly-net-self").text(formatCurrency(monthlyNetInterest) + " after tax");
		$("#yearly-gross-self").text(formatCurrency(yearlyGrossInterest));
		$("#yearly-net-self").text(formatCurrency(yearlyNetInterest) + " after tax");
	}

	// DeFi Wallet calculation function
	function updateDeFiWalletCalculations() {
		const startingAmount = parseFloat($("#starting-amount-defi").val()) || 0;
		const apyRate = parseFloat($("#apy-rate-defi").val()) || 5;
		const taxRate = 0.275; // 27.5% tax

		// Calculate continuous compounding (e^rt)
		const yearlyGrossBalance = startingAmount * Math.exp(apyRate / 100);
		const yearlyGrossInterest = yearlyGrossBalance - startingAmount;
		const yearlyTax = yearlyGrossInterest * taxRate;
		const yearlyNetBalance = yearlyGrossBalance - yearlyTax;
		const yearlyNetInterest = yearlyNetBalance - startingAmount;

		// Daily compound growth (approximate)
		const dailyRate = apyRate / 100 / 365;
		const dailyGrowth = startingAmount * dailyRate;

		// Monthly compound growth (approximate)
		const monthlyGrossBalance = startingAmount * Math.exp((apyRate / 100) / 12);
		const monthlyCompoundGrowth = monthlyGrossBalance - startingAmount;

		// Update DeFi Wallet display
		$("#daily-compound-defi").text(formatCurrency(dailyGrowth));
		$("#monthly-compound-defi").text(formatCurrency(monthlyCompoundGrowth));
		$("#yearly-total-defi").text(formatCurrency(yearlyNetInterest));
		$("#yearly-breakdown-defi").text(
			`€${formatNumber(yearlyGrossInterest)} gross interest - €${formatNumber(yearlyTax)} tax`
		);
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
	$("#starting-amount-self, #starting-amount-defi").on("blur", function () {
		const value = parseFloat($(this).val());
		if (isNaN(value) || value < 0) {
			$(this).val(0);
			if ($(this).attr("id").includes("self")) {
				updateBitpandaSelfCalculations();
			} else {
				updateDeFiWalletCalculations();
			}
		}
	});

	// Format large numbers on input
	$("#starting-amount-self, #starting-amount-defi").on("input", function () {
		const value = parseFloat($(this).val());
		if (value >= 10000) {
			$(this).addClass("large-number");
		} else {
			$(this).removeClass("large-number");
		}
	});

	console.log("🧮 Lending Calculators initialized");
	console.log("💰 Compare Bitpanda Self vs DeFi Wallet returns!");
});
