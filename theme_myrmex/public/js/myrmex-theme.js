// Core: paint the saved palette, track appearance, flag the current route.
//
// The payload arrives inside frappe.boot (extend_bootinfo hook), so the
// variables are written during the first frame — no fetch, no flash.

const myrmex = window.myrmex;

const STYLE_ID = "myrmex-theme-vars";

myrmex.theme = {
	payload: null,

	/** Read the boot payload and apply everything it describes. */
	init() {
		const payload = (frappe.boot && frappe.boot.myrmex_theme) || null;
		this.apply(payload);

		// Live updates when an administrator saves Theme Settings.
		if (frappe.realtime && frappe.realtime.on) {
			frappe.realtime.on("myrmex_theme_updated", (updated) => {
				this.apply(updated);
				frappe.show_alert({ message: __("Theme updated"), indicator: "blue" });
			});
		}

		myrmex.bindRouting();
		myrmex.onRoute(() => this.flagRoute());
		myrmex._booted = true;
	},

	apply(payload) {
		if (!payload || !payload.enabled) {
			myrmex.ROOT.classList.remove("myrmex-enabled");
			const existing = document.getElementById(STYLE_ID);
			if (existing) existing.remove();
			return;
		}

		this.payload = payload;
		myrmex.ROOT.classList.add("myrmex-enabled");
		myrmex.ROOT.dataset.myrmexDensity = (payload.density || "Comfortable").toLowerCase();
		myrmex.ROOT.classList.toggle("myrmex-zebra", !!payload.zebra_tables);
		// Table hover and pagination need a selector rather than a variable,
		// so they travel as attributes on <html>.
		const table = payload.table || {};
		myrmex.ROOT.dataset.myrmexTableHover = table.hover || "tint";
		myrmex.ROOT.dataset.myrmexTablePaging = table.pagination || "pills";
		this.writeVariables(payload);
		this.applyDefaultAppearance(payload.appearance);
	},

	writeVariables(payload) {
		const blocks = [
			[":root", payload.shared_vars],
			// Light values are scoped so they never fight the dark block.
			[':root:not([data-theme="dark"])', payload.vars],
			['[data-theme="dark"]', payload.dark_vars],
		];

		const css = blocks
			.filter(([, vars]) => vars && Object.keys(vars).length)
			.map(([selector, vars]) => {
				const body = Object.entries(vars)
					.map(([name, value]) => `\t${name}: ${value};`)
					.join("\n");
				return `${selector} {\n${body}\n}`;
			})
			.join("\n\n");

		let style = document.getElementById(STYLE_ID);
		if (!style) {
			style = document.createElement("style");
			style.id = STYLE_ID;
			document.head.appendChild(style);
		}
		style.textContent = css + (payload.custom_css ? `\n\n/* Custom CSS */\n${payload.custom_css}` : "");
	},

	/**
	 * Apply the configured default appearance the first time a user opens the
	 * Desk. Frappe stores the user's own choice; that always wins afterwards,
	 * and the native theme switcher in the user menu keeps working.
	 *
	 * Compatible with Frappe v15 and v16:
	 * - v15: desk_theme lives at frappe.boot.user.desk_theme
	 * - v16: desk_theme may live at frappe.boot.user.desk_theme or
	 *        frappe.boot.user_info.desk_theme; frappe.ui.set_theme accepts
	 *        "light" | "dark" | "automatic" directly.
	 */
	applyDefaultAppearance(appearance) {
		if (!appearance || myrmex.storage.get("appearance-applied", false)) return;

		const target = { Light: "light", Dark: "dark", System: "automatic" }[appearance];
		if (!target) return;

		// Read desk_theme from wherever the running version puts it.
		const user = (frappe.boot && frappe.boot.user) || {};
		const userInfo = (frappe.boot && frappe.boot.user_info) || {};
		const userChoice = user.desk_theme || userInfo.desk_theme;

		// Frappe stores "Light" for users who never picked a theme; treat that as
		// "no deliberate choice", so the admin's default can be applied.
		if (userChoice && userChoice !== "Light") {
			myrmex.storage.set("appearance-applied", true);
			return;
		}

		// Apply the theme via Frappe's own API so its internal state stays in sync.
		myrmex.ROOT.setAttribute("data-theme-mode", target);
		if (frappe.ui && typeof frappe.ui.set_theme === "function") {
			// v16 accepts the mode string directly; v15 reads data-theme-mode.
			try {
				frappe.ui.set_theme(target);
			} catch (_) {
				// Older v15 build: set_theme() reads data-theme-mode itself.
				frappe.ui.set_theme();
			}
		} else {
			myrmex.ROOT.setAttribute("data-theme", target === "automatic" ? this.systemTheme() : target);
		}
		myrmex.storage.set("appearance-applied", true);
	},

	systemTheme() {
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	},

	/**
	 * Put the current view on <html> so CSS can target it without inspecting
	 * the URL. Frappe's own route is the source of truth.
	 */
	flagRoute() {
		const route = (frappe.get_route && frappe.get_route()) || [];
		const view = (route[0] || "workspace").toLowerCase();

		Array.from(myrmex.ROOT.classList)
			.filter((name) => name.startsWith("myrmex-route-"))
			.forEach((name) => myrmex.ROOT.classList.remove(name));

		myrmex.ROOT.classList.add(`myrmex-route-${view.replace(/[^a-z0-9-]/g, "-")}`);
	},
};

// Keep "System" honest when the OS flips while the Desk is open.
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
	if (myrmex.ROOT.getAttribute("data-theme-mode") === "automatic") {
		myrmex.ROOT.setAttribute("data-theme", event.matches ? "dark" : "light");
	}
});

myrmex.ready(() => myrmex.theme.init());

export default myrmex.theme;
