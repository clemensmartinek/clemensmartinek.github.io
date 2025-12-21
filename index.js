// Calculate age dynamically
function calculateAge() {
	const birthDate = new Date(2001, 11, 15); // Month is 0-indexed (11 = December)
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}

	return age;
}

// Update age on page load
document.addEventListener("DOMContentLoaded", function () {
	const ageElement = document.getElementById("age");
	if (ageElement) {
		ageElement.textContent = calculateAge() + " Jahre alt";
	}

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
});
