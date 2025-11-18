// Stable Coin Lending Calculator
$(document).ready(function () {
	// Initialize calculator
	updateCalculations();

	// Event listeners
	$("#starting-amount, #apy-rate, #monthly-savings").on("input", updateCalculations);
	$("#enable-savings").on("change", toggleSavingsPlan);

	// APY slider display update
	$("#apy-rate").on("input", function () {
		$("#apy-display").text(parseFloat($(this).val()).toFixed(1));
		updateCalculations();
	});

	// Toggle savings plan functionality
	function toggleSavingsPlan() {
		const isEnabled = $("#enable-savings").is(":checked");
		const monthlySavingsInput = $("#monthly-savings");

		if (isEnabled) {
			monthlySavingsInput.prop("disabled", false);
			monthlySavingsInput.parent().removeClass("disabled");
		} else {
			monthlySavingsInput.prop("disabled", true);
			monthlySavingsInput.val(0);
			monthlySavingsInput.parent().addClass("disabled");
		}

		updateCalculations();
	}

	// Main calculation function
	function updateCalculations() {
		const startingAmount = parseFloat($("#starting-amount").val()) || 0;
		const apyRate = parseFloat($("#apy-rate").val()) || 5;
		const monthlySavings = parseFloat($("#monthly-savings").val()) || 0;
		const enableSavings = $("#enable-savings").is(":checked");

		const effectiveMonthlySavings = enableSavings ? monthlySavings : 0;
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

		// Calculate yearly returns with compound interest and monthly contributions
		let balance = startingAmount;
		let totalGrossInterest = 0;
		let totalContributions = effectiveMonthlySavings * 12;

		// Simulate monthly compound interest with contributions
		for (let month = 1; month <= 12; month++) {
			// Add monthly contribution at beginning of month
			if (effectiveMonthlySavings > 0) {
				balance += effectiveMonthlySavings;
			}

			// Calculate monthly gross interest
			const monthlyGross = balance * (apyRate / 100 / 12);
			totalGrossInterest += monthlyGross;

			// Add net interest to balance (compound)
			const monthlyTaxAmount = monthlyGross * taxRate;
			const monthlyNet = monthlyGross - monthlyTaxAmount;
			balance += monthlyNet;
		}

		const yearlyGrossInterest = totalGrossInterest;
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
			totalBalance: balance,
			startingAmount: startingAmount,
			totalContributions: totalContributions,
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

		$("#total-balance").text(formatCurrency(results.totalBalance));

		// Update balance breakdown
		const principal = results.startingAmount + results.totalContributions;
		const interest = results.yearlyNet;
		$("#balance-breakdown").text(
			`€${formatNumber(principal)} principal + €${formatNumber(interest)} interest (after tax)${
				results.totalContributions > 0 ? ` + €${formatNumber(results.totalContributions)} contributions` : ""
			}`
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

	// Initialize savings plan toggle
	toggleSavingsPlan();

	// Add some interactive animations
	$(".result-card").hover(
		function () {
			$(this).addClass("hovered");
		},
		function () {
			$(this).removeClass("hovered");
		}
	);

	// Smooth scroll for any internal navigation
	$('a[href^="#"]').on("click", function (e) {
		e.preventDefault();
		const target = $(this.hash);
		if (target.length) {
			$("html, body").animate(
				{
					scrollTop: target.offset().top - 80,
				},
				500
			);
		}
	});

	// Add input validation
	$("#starting-amount, #monthly-savings").on("blur", function () {
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
