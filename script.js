// Current language
let currentLang = "de";

// DOM Content Loaded
$(document).ready(function () {
	// Initialize age calculation
	calculateAge();

	// Smooth scrolling for any anchor links
	$('a[href^="#"]').click(function (e) {
		e.preventDefault();
		const target = $($(this).attr("href"));
		if (target.length) {
			$("html, body").animate(
				{
					scrollTop: target.offset().top - 20,
				},
				800
			);
		}
	});

	// Add hover effects to tech items
	$(".tech-item").hover(
		function () {
			$(this).css("transform", "translateY(-3px) scale(1.05)");
		},
		function () {
			$(this).css("transform", "translateY(0) scale(1)");
		}
	);

	// Add click effect to social links
	$(".social-link").click(function () {
		const link = $(this);
		link.css("transform", "scale(0.95)");
		setTimeout(() => {
			link.css("transform", "translateY(-3px) scale(1)");
		}, 150);
	});
});

// Calculate age based on birthdate (15.12.2001)
function calculateAge() {
	const birthDate = new Date(2001, 11, 15); // Month is 0-indexed
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}
	$("#age-display").text(age + " years old");
}

// Console easter egg
console.log(`
🚀 Welcome to my Portfolio Website!

Built with ❤️ by Clemens Martinek

🌐 LinkedIn: https://www.linkedin.com/in/clemens-m-958212332/
`);

// Add some fun console commands
window.clemens = {
	age: () => {
		const birthDate = new Date(2001, 11, 15);
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	},
	skills: ["C#", ".NET", "Elixir", "Phoenix", "JavaScript/jQuery", "PostgreSQL", "Tailwind CSS", "Docker"],
	location: "Austria",
	workplace: "FH Wr. Neustadt",
	tools: ["Jira", "Bitbucket", "GitHub", "GitLab", "CI/CD"],
};
