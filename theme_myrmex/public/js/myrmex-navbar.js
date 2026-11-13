// Navbar behaviour: branding injection, rail toggle, elevation on scroll,
// and a search placeholder that names the shortcut.
//
// Frappe v15 markup: .sticky-top > header.navbar > .container >
//   a.navbar-brand, ul#navbar-breadcrumbs, .navbar-collapse (search + controls).
// Every native control is restyled in CSS only; this file adds one button.

const myrmex = window.myrmex;

myrmex.navbar = {
	init() {
		// Branding runs once at boot — independent of route changes.
		this.mountBranding();

		myrmex.onRoute(() => {
			const navbar = document.querySelector("header.navbar");
			if (!navbar) return;
			this.mountToggle(navbar);
			this.labelSearch(navbar);
			this.syncToggle();
		});

		this.trackScroll();
	},

	/**
	 * Replace the default Frappe logo + text with the application's own name
	 * (or logo if one is set in Branding Settings / System Settings).
	 *
	 * Priority:
	 *   1. frappe.boot.app_logo_url     — custom logo uploaded via Branding Settings
	 *   2. frappe.boot.app_name         — application name string
	 *   3. frappe.sys_defaults.app_name — fallback from System Settings
	 *   4. frappe.app_name              — Frappe global default
	 */
	mountBranding() {
		const navbar = document.querySelector("header.navbar");
		if (!navbar) return;

		myrmex.once(navbar, "Branding", () => {
			const brand = navbar.querySelector(".navbar-brand, .navbar-home");
			if (!brand) return;

			// Collect name and logo from the boot payload (set by Frappe/ERPNext).
			const boot         = (window.frappe && frappe.boot) || {};
			const sysDefaults  = boot.sysdefaults || boot.sys_defaults || {};
			const logoUrl      = boot.app_logo_url || sysDefaults.app_logo_url || "";
			const appName      =
				boot.app_name ||
				sysDefaults.app_name ||
				(window.frappe && frappe.app_name) ||
				"";

			// Remove every existing child (the core "F" logo + "Frappe" text).
			while (brand.firstChild) brand.removeChild(brand.firstChild);

			if (logoUrl) {
				// Custom logo: render an <img> and an accessible label.
				const img = document.createElement("img");
				img.src       = logoUrl;
				img.alt       = appName || "Home";
				img.className = "myrmex-brand-logo";
				brand.appendChild(img);
			} else {
				// No logo: show the app name as styled text.
				const name = document.createElement("span");
				name.className   = "myrmex-brand-name";
				name.textContent = appName || "Home";
				brand.appendChild(name);
			}
		});
	},

	/**
	 * The toggle switches the workspace sidebar between full and rail. It is
	 * only shown on desktop pages that have a workspace sidebar (CSS keys off
	 * .myrmex-has-rail); list and form pages keep Frappe's own sidebar button.
	 */
	mountToggle(navbar) {
		const host = navbar.querySelector(".container") || navbar;
		myrmex.once(host, "Toggle", () => {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "myrmex-nav-toggle";
			button.setAttribute("aria-label", __("Collapse sidebar"));
			button.setAttribute("title", `${__("Collapse sidebar")} (${frappe.utils.is_mac() ? "⌘" : "Ctrl+"}B)`);
			button.innerHTML = `
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
					stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<rect x="3" y="4" width="18" height="16" rx="3"></rect>
					<line x1="9" y1="4" x2="9" y2="20"></line>
				</svg>
			`;
			button.addEventListener("click", () => myrmex.sidebar.toggle());
			host.prepend(button);
			this.toggleButton = button;
		});
	},

	syncToggle() {
		const button = this.toggleButton;
		if (!button) return;
		const collapsed = myrmex.sidebar.isCollapsed();
		const label = collapsed ? __("Expand sidebar") : __("Collapse sidebar");
		button.setAttribute("aria-pressed", String(collapsed));
		button.setAttribute("aria-label", label);
		button.setAttribute("title", `${label} (${frappe.utils.is_mac() ? "⌘" : "Ctrl+"}B)`);
	},

	labelSearch(navbar) {
		const input = navbar.querySelector("#navbar-search");
		if (!input) return;
		myrmex.once(input, "SearchLabel", () => {
			const shortcut = frappe.utils.is_mac() ? "⌘G" : "Ctrl+G";
			input.setAttribute("placeholder", `${__("Search or type a command")}  ${shortcut}`);
		});
	},

	/** Lift the navbar and page header once content scrolls beneath them. */
	trackScroll() {
		if (this._scrollBound) return;
		this._scrollBound = true;

		let frame = null;
		const update = () => {
			frame = null;
			const scrolled = window.scrollY > 4;
			const navbar = document.querySelector("header.navbar");
			const page = myrmex.currentPage();
			const head = page && page.querySelector(".page-head");
			if (navbar) navbar.classList.toggle("myrmex-scrolled", scrolled);
			if (head) head.classList.toggle("myrmex-stuck", scrolled);
		};

		window.addEventListener(
			"scroll",
			() => {
				if (!frame) frame = requestAnimationFrame(update);
			},
			{ passive: true }
		);
		document.addEventListener("myrmex:sidebar-change", () => this.syncToggle());
	},
};

myrmex.ready(() => myrmex.navbar.init());

export default myrmex.navbar;
