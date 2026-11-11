/**
 * Myrmex Branding — apply logo, favicon, loader and login images
 * from frappe.boot.myrmex_branding at first frame.
 *
 * Also handles the live-update realtime event and injects the custom
 * loading splash screen before Frappe's own loader appears.
 */

const myrmex = window.myrmex;

const BRANDING_STYLE_ID = "myrmex-branding-vars";

myrmex.branding = {
	payload: null,

	/** Called from myrmex.theme.init() — apply boot payload immediately. */
	init() {
		const payload = (frappe.boot && frappe.boot.myrmex_branding) || null;
		this.apply(payload);

		// Live-update when an admin saves Branding Settings.
		if (frappe.realtime && frappe.realtime.on) {
			frappe.realtime.on("myrmex_branding_updated", (updated) => {
				this.apply(updated);
				frappe.show_alert({ message: __("Branding updated"), indicator: "blue" });
			});
		}
	},

	apply(payload) {
		if (!payload) return;
		this.payload = payload;

		this._writeVariables(payload);
		this._applyFavicon(payload.favicon);
		this._applyNavbarLogo(payload);
		this._applyCustomCss(payload.custom_css_branding);
	},

	// -------------------------------------------------------------------------
	// CSS custom property variables
	// -------------------------------------------------------------------------

	_writeVariables(payload) {
		const vars = {};

		// Image vars — convert file paths to url() values
		const imageFields = {
			"--mx-brand-logo":               payload.app_logo,
			"--mx-brand-login-logo":         payload.login_logo,
			"--mx-brand-favicon":            payload.favicon,
			"--mx-brand-login-bg":           payload.login_background,
			"--mx-brand-loader-image":       payload.loader_image,
			"--mx-brand-loader-animation":   payload.loader_animation,
			"--mx-brand-navbar-logo":        payload.navbar_logo || payload.app_logo,
		};

		Object.entries(imageFields).forEach(([prop, value]) => {
			vars[prop] = value ? `url("${value}")` : "none";
		});

		// Scalar vars
		if (payload.logo_max_height) {
			vars["--mx-brand-logo-height"] = `${payload.logo_max_height}px`;
			vars["--mx-brand-navbar-logo-height"] = `${payload.logo_max_height}px`;
		}
		if (payload.loader_bg_color)      vars["--mx-brand-loader-bg"]      = payload.loader_bg_color;
		if (payload.loader_spinner_color) vars["--mx-brand-loader-spinner"] = payload.loader_spinner_color;

		if (Object.keys(vars).length === 0) return;

		const body = Object.entries(vars)
			.map(([k, v]) => `\t${k}: ${v};`)
			.join("\n");

		let style = document.getElementById(BRANDING_STYLE_ID);
		if (!style) {
			style = document.createElement("style");
			style.id = BRANDING_STYLE_ID;
			document.head.appendChild(style);
		}
		style.textContent = `:root {\n${body}\n}`;
	},

	// -------------------------------------------------------------------------
	// Favicon
	// -------------------------------------------------------------------------

	_applyFavicon(faviconUrl) {
		if (!faviconUrl) return;

		// Remove all existing favicon links first
		document.querySelectorAll('link[rel*="icon"]').forEach((el) => el.remove());

		const link = document.createElement("link");
		link.rel = "shortcut icon";
		link.type = faviconUrl.endsWith(".ico") ? "image/x-icon" : "image/png";
		link.href = faviconUrl + "?v=" + Date.now();
		document.head.appendChild(link);

		// Also set apple-touch-icon if applicable
		if (!faviconUrl.endsWith(".ico")) {
			const apple = document.createElement("link");
			apple.rel = "apple-touch-icon";
			apple.href = faviconUrl;
			document.head.appendChild(apple);
		}
	},

	// -------------------------------------------------------------------------
	// Navbar logo replacement
	// -------------------------------------------------------------------------

	_applyNavbarLogo(payload) {
		const logoUrl = payload.navbar_logo || payload.app_logo;
		if (!logoUrl) return;

		const height = payload.logo_max_height || 32;
		const appName = payload.app_name_override;

		// Wait for the navbar to be in the DOM
		const _apply = () => {
			// Frappe renders the brand as: .navbar-home > .navbar-brand
			// Inside there may be an <img class="navbar-brand-logo"> or text
			const navbrand = document.querySelector(".navbar-home .navbar-brand, .navbar-brand");
			if (!navbrand) return;

			// Don't double-apply
			if (navbrand.dataset.myrmexBrandApplied) return;
			navbrand.dataset.myrmexBrandApplied = "1";

			const existing = navbrand.querySelector("img");
			if (existing) {
				existing.src = logoUrl;
				existing.style.maxHeight = `${height}px`;
				existing.style.width = "auto";
				existing.alt = appName || existing.alt;
			} else {
				// No img — replace text with an image
				const img = document.createElement("img");
				img.src = logoUrl;
				img.alt = appName || "Logo";
				img.style.maxHeight = `${height}px`;
				img.style.width = "auto";
				img.style.objectFit = "contain";
				navbrand.prepend(img);
			}

			// Override app name text if configured
			if (appName) {
				navbrand.querySelectorAll(".navbar-brand-name, .brand-name").forEach((el) => {
					el.textContent = appName;
				});
			}
		};

		if (document.readyState !== "loading") {
			_apply();
		} else {
			document.addEventListener("DOMContentLoaded", _apply);
		}

		// Also re-apply on route change since Frappe may re-render the navbar
		myrmex.onRoute(() => {
			delete document.querySelector(".navbar-home .navbar-brand, .navbar-brand")
				?.dataset.myrmexBrandApplied;
			_apply();
		});
	},

	// -------------------------------------------------------------------------
	// Custom branding CSS
	// -------------------------------------------------------------------------

	_applyCustomCss(css) {
		if (!css) return;

		const id = "myrmex-branding-custom-css";
		let style = document.getElementById(id);
		if (!style) {
			style = document.createElement("style");
			style.id = id;
			document.head.appendChild(style);
		}
		style.textContent = `/* Myrmex Branding Custom CSS */\n${css}`;
	},
};

// ---------------------------------------------------------------------------
// Loader splash screen
//
// Injected as the first thing in <body> so it appears before Frappe's own
// spinner. Fades out once frappe.boot has fired (page-change event).
// ---------------------------------------------------------------------------

myrmex.loader = {
	_el: null,

	inject(payload) {
		if (!payload || (!payload.loader_image && !payload.loader_animation)) return;
		if (document.getElementById("myrmex-loader")) return;

		const bg = payload.loader_bg_color || "#ffffff";
		const spinnerColor = payload.loader_spinner_color || "#6366f1";
		const imgUrl = payload.loader_animation || payload.loader_image;
		const isAnimation = !!payload.loader_animation;

		const div = document.createElement("div");
		div.id = "myrmex-loader";
		div.style.cssText = `
			position: fixed; inset: 0; z-index: 9999;
			display: flex; flex-direction: column; align-items: center; justify-content: center;
			background-color: ${bg}; gap: 20px; transition: opacity 350ms ease;
		`;

		if (imgUrl) {
			const img = document.createElement("img");
			img.src = imgUrl;
			img.className = isAnimation ? "mx-loader-animation" : "mx-loader-logo";
			img.style.cssText = "max-width: 160px; max-height: 100px; object-fit: contain;";
			img.onerror = () => img.remove();
			div.appendChild(img);
		}

		if (!isAnimation) {
			// Show spinner only when not using an animation
			const spinner = document.createElement("div");
			spinner.className = "mx-loader-spinner";
			spinner.style.cssText = `
				width: 36px; height: 36px;
				border: 3px solid rgba(0,0,0,0.08);
				border-top-color: ${spinnerColor};
				border-radius: 50%;
				animation: mx-spin 0.8s linear infinite;
			`;
			div.appendChild(spinner);
		}

		// Add the keyframe animation inline (in case the CSS bundle hasn't loaded)
		const style = document.createElement("style");
		style.textContent = "@keyframes mx-spin { to { transform: rotate(360deg); } }";
		div.appendChild(style);

		document.body.prepend(div);
		this._el = div;
	},

	dismiss() {
		if (!this._el) return;
		this._el.style.opacity = "0";
		this._el.style.pointerEvents = "none";
		setTimeout(() => {
			if (this._el && this._el.parentNode) {
				this._el.parentNode.removeChild(this._el);
			}
			this._el = null;
		}, 400);
	},
};

// Inject loader as early as possible, then dismiss on page-change
myrmex.ready(() => {
	const payload = (frappe.boot && frappe.boot.myrmex_branding) || null;
	if (payload) {
		myrmex.loader.inject(payload);
	}
});

// Dismiss once the desk boots
$(document).on("page-change", () => myrmex.loader.dismiss());
$(document).ready(() => setTimeout(() => myrmex.loader.dismiss(), 2000)); // hard fallback

export default myrmex.branding;
