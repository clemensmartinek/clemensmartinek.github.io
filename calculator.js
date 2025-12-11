// Broker | Stablecoin Lending Calculator
$(document).ready(function () {
	// Initialize
	updateCalculations();

	// Event listeners
	$("#starting-amount, #apy-rate, #weeks-duration").on("input", updateCalculations);

	$("#apy-rate").on("input", function () {
		$("#apy-display").text(parseFloat($(this).val()).toFixed(1));
		updateCalculations();
	});

	$("#weeks-duration").on("input", function () {
		$("#weeks-display").text($(this).val());
		$("#weeks-display-2").text($(this).val());
		updateCalculations();
	});
	// Reinvestment toggle
	$("#reinvest-toggle").on("change", function () {
		const isChecked = $(this).is(":checked");

		// Toggle duration input with animation
		if (isChecked) {
			$("#duration-group").slideDown(300);
			$("#weeks-duration").prop("disabled", false);
			$("#standard-returns").fadeOut(200, function () {
				$("#reinvest-returns").fadeIn(300);
			});
		} else {
			$("#duration-group").slideUp(300);
			$("#weeks-duration").prop("disabled", true);
			$("#reinvest-returns").fadeOut(200, function () {
				$("#standard-returns").fadeIn(300);
			});
		}

		updateCalculations();
	});

	// Preset duration buttons
	$(".preset-btn").on("click", function () {
		const weeks = $(this).data("weeks");
		$("#weeks-duration").val(weeks);

		// Update active button
		$(".preset-btn").removeClass("active");
		$(this).addClass("active");

		// Update displays and recalculate
		$("#weeks-display").text(weeks);
		$("#weeks-display-2").text(weeks);
		updateCalculations();
	});

	// When custom weeks input is used, remove active from presets
	$("#weeks-duration").on("input", function () {
		const customWeeks = parseInt($(this).val());
		let matchesPreset = false;

		$(".preset-btn").each(function () {
			if ($(this).data("weeks") === customWeeks) {
				$(".preset-btn").removeClass("active");
				$(this).addClass("active");
				matchesPreset = true;
				return false;
			}
		});

		if (!matchesPreset) {
			$(".preset-btn").removeClass("active");
		}
	});

	// Main calculation function
	function updateCalculations() {
		const startingAmount = parseFloat($("#starting-amount").val()) || 0;
		const apyRate = parseFloat($("#apy-rate").val()) || 5;
		const weeks = parseInt($("#weeks-duration").val()) || 26;
		const taxRate = 0.275; // 27.5% tax
		const isReinvesting = $("#reinvest-toggle").is(":checked");

		// Calculate bi-weekly rate
		const biweeklyRate = apyRate / 100 / 26; // 26 bi-weekly periods per year

		if (!isReinvesting) {
			// Standard calculations (no reinvestment)
			calculateStandardReturns(startingAmount, biweeklyRate, taxRate);
		} else {
			// Reinvestment calculations
			calculateReinvestmentReturns(startingAmount, biweeklyRate, taxRate, weeks);
		}
	}

	// Calculate standard returns without reinvestment
	function calculateStandardReturns(principal, biweeklyRate, taxRate) {
		// Bi-weekly
		const biweeklyGross = principal * biweeklyRate;
		const biweeklyNet = biweeklyGross * (1 - taxRate);

		// Monthly (approximately 2.17 bi-weekly periods per month)
		const monthlyGross = biweeklyGross * 2.17;
		const monthlyNet = monthlyGross * (1 - taxRate);

		// Yearly (26 bi-weekly periods per year)
		const yearlyGross = biweeklyGross * 26;
		const yearlyNet = yearlyGross * (1 - taxRate);

		// Update display
		$("#biweekly-gross").text(formatCurrency(biweeklyGross));
		$("#biweekly-net").text(formatCurrency(biweeklyNet) + " after tax");
		$("#monthly-gross").text(formatCurrency(monthlyGross));
		$("#monthly-net").text(formatCurrency(monthlyNet) + " after tax");
		$("#yearly-gross").text(formatCurrency(yearlyGross));
		$("#yearly-net").text(formatCurrency(yearlyNet) + " after tax");
	}

	// Calculate reinvestment returns with compounding
	function calculateReinvestmentReturns(startingAmount, biweeklyRate, taxRate, weeks) {
		const numberOfPayouts = Math.floor(weeks / 2);

		// Initial payouts (before any compounding)
		const initialBiweekly = startingAmount * biweeklyRate * (1 - taxRate);
		const initialMonthly = initialBiweekly * 2.17;
		const initialYearly = initialBiweekly * 26;

		// Simulate compounding
		let balance = startingAmount;
		let totalNetInterest = 0;

		for (let i = 0; i < numberOfPayouts; i++) {
			const grossInterest = balance * biweeklyRate;
			const netInterest = grossInterest * (1 - taxRate);
			totalNetInterest += netInterest;
			balance += netInterest;
		}

		// Final payouts (after compounding)
		const finalBiweekly = balance * biweeklyRate * (1 - taxRate);
		const finalMonthly = finalBiweekly * 2.17;
		const finalYearly = finalBiweekly * 26;
		// Calculate growth percentages
		const biweeklyGrowth = ((finalBiweekly - initialBiweekly) / initialBiweekly) * 100;

		// Update summary cards
		$("#weeks-display").text(weeks);
		$("#weeks-display-2").text(weeks);
		$("#final-balance").text(formatCurrency(balance));
		$("#total-profit").text(formatCurrency(totalNetInterest) + " total profit after tax");
		$("#total-payouts").text(numberOfPayouts);
		$("#total-interest-earned").text(formatCurrency(totalNetInterest) + " net interest");

		// Update initial payouts
		$("#initial-biweekly").text(formatCurrency(initialBiweekly));
		$("#initial-monthly").text(formatCurrency(initialMonthly));
		$("#initial-yearly").text(formatCurrency(initialYearly));

		// Update final payouts
		$("#final-biweekly").text(formatCurrency(finalBiweekly));
		$("#final-monthly").text(formatCurrency(finalMonthly));
		$("#final-yearly").text(formatCurrency(finalYearly));

		// Update overall growth badge (only once, at the top)
		$("#overall-growth").text("+" + biweeklyGrowth.toFixed(1) + "% Growth");

		// Update bar widths (scaled relative to the maximum value)
		const maxValue = Math.max(finalYearly, initialYearly);
		updateProgressBar("initial-biweekly-bar", initialBiweekly, maxValue);
		updateProgressBar("initial-monthly-bar", initialMonthly, maxValue);
		updateProgressBar("initial-yearly-bar", initialYearly, maxValue);
		updateProgressBar("final-biweekly-bar", finalBiweekly, maxValue);
		updateProgressBar("final-monthly-bar", finalMonthly, maxValue);
		updateProgressBar("final-yearly-bar", finalYearly, maxValue);
	}

	// Update progress bar width
	function updateProgressBar(id, value, maxValue) {
		const percentage = (value / maxValue) * 100;
		$("#" + id).css("width", percentage + "%");
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
	$("#starting-amount, #weeks-duration").on("blur", function () {
		const value = parseFloat($(this).val());
		if (isNaN(value) || value < 0) {
			$(this).val($(this).attr("id") === "weeks-duration" ? 26 : 0);
			updateCalculations();
		}
	});

	// Ensure weeks is even (for bi-weekly payouts)
	$("#weeks-duration").on("blur", function () {
		let weeks = parseInt($(this).val());
		if (weeks % 2 !== 0) {
			weeks = Math.floor(weeks / 2) * 2;
			$(this).val(weeks);
		}
		updateCalculations();
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

	console.log("🧮 Broker | Stablecoin Lending Calculator initialized");
	console.log("💰 Calculate your bi-weekly compounding returns!");
});
