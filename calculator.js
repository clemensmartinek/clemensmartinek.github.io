// Lending Calculators with Tab Support
$(document).ready(function () {
	// Initialize
	updateBitpandaSelfCalculations();
	updateDeFiWalletCalculations();
	updatePortfolioCalculations();

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
		} else if (targetTab === "defi-wallet") {
			updateDeFiWalletCalculations();
		} else if (targetTab === "portfolio-return") {
			updatePortfolioCalculations();
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
	$("#starting-amount-self, #starting-amount-defi, #all-world-etf, #day-money, #vsn, #eurcv").on("blur", function () {
		const value = parseFloat($(this).val());
		if (isNaN(value) || value < 0) {
			$(this).val(0);
			if ($(this).attr("id").includes("self")) {
				updateBitpandaSelfCalculations();
			} else if ($(this).attr("id").includes("defi")) {
				updateDeFiWalletCalculations();
			} else {
				updatePortfolioCalculations();
			}
		}
	});
	// Portfolio Return Calculator event listeners
	$("#all-world-etf, #day-money, #vsn, #eurcv, #years-projection").on("input", updatePortfolioCalculations);
	$("#apply-tax").on("change", updatePortfolioCalculations);
	$("#years-projection").on("input", function() {
		$("#years-display").text($(this).val());
		updatePortfolioCalculations();
	});

	// Format large numbers on input
	$("#starting-amount-self, #starting-amount-defi, #all-world-etf, #day-money, #vsn, #eurcv").on("input", function () {
		const value = parseFloat($(this).val());
		if (value >= 10000) {
			$(this).addClass("large-number");
		} else {
			$(this).removeClass("large-number");
		}
	});
	// Portfolio Return calculation function
	function updatePortfolioCalculations() {
		const etfAmount = parseFloat($("#all-world-etf").val()) || 0;
		const dayMoneyAmount = parseFloat($("#day-money").val()) || 0;
		const vsnAmount = parseFloat($("#vsn").val()) || 0;
		const eurcvAmount = parseFloat($("#eurcv").val()) || 0;
		const years = parseFloat($("#years-projection").val()) || 1;
		const applyTax = $("#apply-tax").is(":checked");
		const taxRate = 0.275; // 27.5%

		// APY rates
		const etfAPY = 0.07; // 7%
		const dayMoneyAPY = 0.02; // 2%
		const vsnAPY = 0.10; // 10%
		const eurcvAPY = 0.05; // 5%

		// Calculate compound growth for each investment
		const etfFinalAmount = etfAmount * Math.pow(1 + etfAPY, years);
		const dayMoneyFinalAmount = dayMoneyAmount * Math.pow(1 + dayMoneyAPY, years);
		const vsnFinalAmount = vsnAmount * Math.pow(1 + vsnAPY, years);
		const eurcvFinalAmount = eurcvAmount * Math.pow(1 + eurcvAPY, years);

		// Calculate gains
		let etfGains = etfFinalAmount - etfAmount;
		let dayMoneyGains = dayMoneyFinalAmount - dayMoneyAmount;
		let vsnGains = vsnFinalAmount - vsnAmount;
		let eurcvGains = eurcvFinalAmount - eurcvAmount;

		// Apply tax if checked
		if (applyTax) {
			etfGains = etfGains * (1 - taxRate);
			dayMoneyGains = dayMoneyGains * (1 - taxRate);
			vsnGains = vsnGains * (1 - taxRate);
			eurcvGains = eurcvGains * (1 - taxRate);
		}

		// Calculate final amounts after tax (principal + gains after tax)
		const etfFinalAfterTax = etfAmount + etfGains;
		const dayMoneyFinalAfterTax = dayMoneyAmount + dayMoneyGains;
		const vsnFinalAfterTax = vsnAmount + vsnGains;
		const eurcvFinalAfterTax = eurcvAmount + eurcvGains;

		// Calculate totals
		const totalFinalAmount = etfFinalAfterTax + dayMoneyFinalAfterTax + vsnFinalAfterTax + eurcvFinalAfterTax;
		const totalGains = etfGains + dayMoneyGains + vsnGains + eurcvGains;

		// Update display
		$("#etf-result").text(formatCurrency(etfFinalAfterTax));
		$("#etf-gains").text(formatCurrency(etfGains) + " gains");
		
		$("#day-money-result").text(formatCurrency(dayMoneyFinalAfterTax));
		$("#day-money-gains").text(formatCurrency(dayMoneyGains) + " gains");
		
		$("#vsn-result").text(formatCurrency(vsnFinalAfterTax));
		$("#vsn-gains").text(formatCurrency(vsnGains) + " gains");
		
		$("#eurcv-result").text(formatCurrency(eurcvFinalAfterTax));
		$("#eurcv-gains").text(formatCurrency(eurcvGains) + " gains");
		
		$("#total-portfolio").text(formatCurrency(totalFinalAmount));
		$("#total-gains").text(formatCurrency(totalGains) + " total gains");
	}

	console.log("🧮 Lending Calculators initialized");
	console.log("💰 Compare Bitpanda Self vs DeFi Wallet returns!");
	console.log("📊 Portfolio Return Calculator added!");
});
