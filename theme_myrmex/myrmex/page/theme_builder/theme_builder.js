// Theme Builder — a visual editor for Theme Settings.
//
// The page never writes CSS files. It edits an in-memory copy of the settings,
// paints the resulting variables into a scoped preview so changes are visible
// immediately, and saves through theme_myrmex.api.save_theme, which runs the
// normal permission check.

frappe.pages["theme-builder"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Theme Builder"),
		single_column: true,
	});

	new ThemeBuilder(page);
};

const GROUPS = [
	{
		key: "general",
		label: __("General"),
		fields: [
			{ fieldname: "theme_preset", label: __("Preset"), type: "preset" },
			{
				fieldname: "default_appearance",
				label: __("Default appearance"),
				type: "select",
				options: ["Light", "Dark", "System"],
			},
			{
				fieldname: "density",
				label: __("Density"),
				type: "select",
				options: ["Comfortable", "Compact"],
			},
			{ fieldname: "enable_animations", label: __("Use transitions"), type: "check" },
			{ fieldname: "enable_theme", label: __("Theme enabled"), type: "check" },
		],
	},
	{
		key: "colors",
		label: __("Colours"),
		fields: [
			{ fieldname: "primary_color", label: __("Primary"), type: "color" },
			{ fieldname: "secondary_color", label: __("Secondary"), type: "color" },
			{ fieldname: "background_color", label: __("Background"), type: "color" },
			{ fieldname: "surface_color", label: __("Surface"), type: "color" },
			{ fieldname: "text_color", label: __("Text"), type: "color" },
			{ fieldname: "muted_text_color", label: __("Muted text"), type: "color" },
			{ fieldname: "border_color", label: __("Border"), type: "color" },
			{ fieldname: "success_color", label: __("Success"), type: "color" },
			{ fieldname: "warning_color", label: __("Warning"), type: "color" },
			{ fieldname: "error_color", label: __("Error"), type: "color" },
		],
	},
	{
		key: "sidebar",
		label: __("Sidebar"),
		fields: [
			{ fieldname: "sidebar_background", label: __("Background"), type: "color" },
			{ fieldname: "sidebar_text", label: __("Text"), type: "color" },
			{ fieldname: "sidebar_active", label: __("Active"), type: "color" },
			{ fieldname: "sidebar_hover", label: __("Hover"), type: "color" },
			{ fieldname: "sidebar_icon", label: __("Icon"), type: "color" },
			{ fieldname: "sidebar_width", label: __("Width (px)"), type: "number", min: 180, max: 380 },
			{ fieldname: "collapse_sidebar_by_default", label: __("Start collapsed"), type: "check" },
		],
	},
	{
		key: "navbar",
		label: __("Navbar"),
		fields: [
			{ fieldname: "navbar_background", label: __("Background"), type: "color" },
			{ fieldname: "navbar_text", label: __("Text"), type: "color" },
			{ fieldname: "navbar_border", label: __("Border"), type: "color" },
			{ fieldname: "navbar_search_background", label: __("Search background"), type: "color" },
			{ fieldname: "navbar_height", label: __("Height (px)"), type: "number", min: 48, max: 88 },
		],
	},
	{
		key: "components",
		label: __("Components"),
		fields: [
			{ fieldname: "card_radius", label: __("Card radius (px)"), type: "number", min: 0, max: 32 },
			{ fieldname: "card_padding", label: __("Card padding (px)"), type: "number", min: 8, max: 40 },
			{ fieldname: "button_radius", label: __("Button radius (px)"), type: "number", min: 0, max: 32 },
			{ fieldname: "input_radius", label: __("Input radius (px)"), type: "number", min: 0, max: 32 },
			{
				fieldname: "shadow_size",
				label: __("Shadow"),
				type: "select",
				options: ["None", "Small", "Medium", "Large"],
			},
		],
	},
	{
		key: "tables",
		label: __("Table Styles"),
		fields: [
			{ type: "heading", label: __("Header") },
			{ fieldname: "table_header_background", label: __("Header background"), type: "color" },
			{ fieldname: "table_header_text", label: __("Header text"), type: "color" },
			{
				fieldname: "table_header_weight",
				label: __("Header weight"),
				type: "select",
				options: ["Regular", "Medium", "Semibold"],
			},
			{ fieldname: "table_header_uppercase", label: __("Uppercase headers"), type: "check" },

			{ type: "heading", label: __("Rows") },
			{ fieldname: "table_row_background", label: __("Row background"), type: "color" },
			{ fieldname: "table_row_text", label: __("Row text"), type: "color" },
			{ fieldname: "zebra_tables", label: __("Striped rows"), type: "check" },
			{ fieldname: "table_stripe_background", label: __("Stripe background"), type: "color" },
			{ fieldname: "table_selected_background", label: __("Selected row"), type: "color" },

			{ type: "heading", label: __("Hover") },
			{
				fieldname: "table_hover_effect",
				label: __("Row hover"),
				type: "select",
				options: ["None", "Background tint", "Accent edge"],
			},
			{ fieldname: "table_row_hover", label: __("Hover background"), type: "color" },

			{ type: "heading", label: __("Borders") },
			{
				fieldname: "table_border_style",
				label: __("Borders"),
				type: "select",
				options: ["All borders", "Horizontal lines", "None"],
			},
			{ fieldname: "table_border_color", label: __("Border colour"), type: "color" },
			{ fieldname: "table_border_width", label: __("Border width (px)"), type: "number", min: 0, max: 3 },
			{ fieldname: "table_radius", label: __("Table radius (px)"), type: "number", min: 0, max: 24 },

			{ type: "heading", label: __("Spacing") },
			{ fieldname: "table_row_height", label: __("Row height (px)"), type: "number", min: 28, max: 64 },
			{ fieldname: "table_cell_padding", label: __("Cell padding (px)"), type: "number", min: 4, max: 28 },

			{ type: "heading", label: __("Pagination") },
			{
				fieldname: "table_pagination_style",
				label: __("Pagination style"),
				type: "select",
				options: ["Pills", "Buttons", "Minimal"],
			},
			{
				fieldname: "table_pagination_align",
				label: __("Pagination alignment"),
				type: "select",
				options: ["Edges", "Left", "Centre", "Right"],
			},
		],
	},
	{
		key: "advanced",
		label: __("Advanced"),
		fields: [{ fieldname: "custom_css", label: __("Custom CSS"), type: "code" }],
	},
];

// ---------------------------------------------------------------------------
// Image / Branding definitions (used by BrandingManager)
// ---------------------------------------------------------------------------
const BRANDING_IMAGES = [
	{
		key: "app_logo",
		label: __("App Logo"),
		hint: __("Main application logo. PNG, SVG or WebP recommended."),
		dims: "240 × 80 px",
		preview: "checkerboard",
		accepts: ".png,.jpg,.jpeg,.svg,.webp",
	},
	{
		key: "navbar_logo",
		label: __("Navbar Logo"),
		hint: __("Shown in the top navigation bar. Leave blank to use the app logo."),
		dims: "240 × 64 px",
		preview: "dark",
		accepts: ".png,.jpg,.jpeg,.svg,.webp",
	},
	{
		key: "login_logo",
		label: __("Login Logo"),
		hint: __("Shown on the sign-in page above the form."),
		dims: "280 × 100 px",
		preview: "checkerboard",
		accepts: ".png,.jpg,.jpeg,.svg,.webp",
	},
	{
		key: "favicon",
		label: __("Favicon"),
		hint: __("Browser tab icon. Use a square .ico or 32 × 32 PNG."),
		dims: "32 × 32 px",
		preview: "checkerboard",
		accepts: ".ico,.png,.svg",
	},
	{
		key: "login_background",
		label: __("Login Background"),
		hint: __("Full-screen background image on the login page."),
		dims: "1920 × 1080 px",
		preview: "dark",
		accepts: ".png,.jpg,.jpeg,.webp",
	},
	{
		key: "loader_image",
		label: __("Loader Logo"),
		hint: __("Static logo shown while the application is loading."),
		dims: "160 × 100 px",
		preview: "checkerboard",
		accepts: ".png,.jpg,.jpeg,.svg,.webp",
	},
	{
		key: "loader_animation",
		label: __("Loader Animation"),
		hint: __("Animated GIF or WebP shown during loading. Replaces the spinner."),
		dims: "120 × 120 px",
		preview: "checkerboard",
		accepts: ".gif,.webp,.png,.svg",
	},
];

// Add Branding as a special tab (rendered by BrandingManager, not from GROUPS fields)
const BRANDING_TAB_KEY = "branding";

class ThemeBuilder {
	constructor(page) {
		this.page = page;
		this.settings = {};
		this.presets = [];
		this.activeGroup = "general";
		this.dirty = false;

		this.render_shell();
		this.load();
		this.bind_page_actions();
		this._brandingManager = new BrandingManager(this.page);
	}

	// --- data ---------------------------------------------------------------

	load() {
		frappe.call({
			method: "theme_myrmex.api.get_settings_and_presets",
			freeze: true,
			freeze_message: __("Loading theme"),
			callback: (r) => {
				if (!r.message) return;
				this.settings = Object.assign({}, r.message.settings);
				this.defaults = r.message.defaults;
				this.presets = r.message.presets;
				this.render_fields();
				this.refresh_preview();
			},
		});
	}

	set_value(fieldname, value) {
		this.settings[fieldname] = value;
		this.dirty = true;
		this.page.set_indicator(__("Unsaved"), "orange");
		this.refresh_preview();
	}

	// --- shell --------------------------------------------------------------

	render_shell() {
		this.page.main.html(`
			<div class="myrmex-builder">
				<div class="myrmex-builder__panel">
					<p class="myrmex-builder__hint">
						${__("Changes preview on the right. Nothing is applied to the Desk until you save.")}
					</p>
					<div class="myrmex-builder__tabs" role="tablist"></div>
					<div class="myrmex-builder__groups"></div>
					<div class="myrmex-builder__branding-panel" style="display:none;"></div>
					<div class="myrmex-builder__actions">
						<button class="btn btn-primary btn-sm" data-action="save">${__("Save theme")}</button>
						<button class="btn btn-default btn-sm" data-action="revert">${__("Discard changes")}</button>
						<button class="btn btn-default btn-sm" data-action="reset">${__("Reset to default")}</button>
					</div>
				</div>
				<div class="myrmex-preview" id="myrmex-preview">
					<div class="myrmex-preview__bar">
						<span>Myrmex</span>
						<span class="myrmex-preview__search"></span>
					</div>
					<div class="myrmex-preview__body">
						<div class="myrmex-preview__rail">
							<div class="myrmex-preview__item is-active"><span class="dot"></span>${__("Home")}</div>
							<div class="myrmex-preview__item"><span class="dot"></span>${__("Accounting")}</div>
							<div class="myrmex-preview__item"><span class="dot"></span>${__("Selling")}</div>
							<div class="myrmex-preview__item"><span class="dot"></span>${__("Stock")}</div>
							<div class="myrmex-preview__item"><span class="dot"></span>${__("Settings")}</div>
						</div>
						<div class="myrmex-preview__main">
							<div class="myrmex-preview__card">
								<div class="label">${__("Customers")}</div>
								<div class="value">1,245</div>
							</div>
							<div class="myrmex-preview__card">
								<div class="label">${__("Quotations")}</div>
								<div class="value">348</div>
							</div>
							<div class="myrmex-preview__card">
								<div class="label">${__("Sales Orders")}</div>
								<div class="value">782</div>
							</div>
							<div class="myrmex-preview__table">
								<div class="myrmex-preview__thead">
									<span>${__("Title")}</span>
									<span>${__("Status")}</span>
									<span class="num">${__("Amount")}</span>
								</div>
								<div class="myrmex-preview__trow">
									<span>SO-00348</span><span>${__("Draft")}</span><span class="num">12,400</span>
								</div>
								<div class="myrmex-preview__trow is-selected">
									<span>SO-00347</span><span>${__("Submitted")}</span><span class="num">3,150</span>
								</div>
								<div class="myrmex-preview__trow is-hover">
									<span>SO-00346</span><span>${__("Draft")}</span><span class="num">880</span>
								</div>
								<div class="myrmex-preview__paging">
									<span class="myrmex-preview__page is-active">20</span>
									<span class="myrmex-preview__page">100</span>
									<span class="myrmex-preview__page">500</span>
								</div>
							</div>
							<div class="myrmex-preview__row">
								<span class="myrmex-preview__btn primary">${__("Create")}</span>
								<span class="myrmex-preview__btn secondary">${__("Filter")}</span>
								<span class="myrmex-preview__btn success">${__("Submit")}</span>
								<span class="myrmex-preview__btn danger">${__("Cancel")}</span>
								<span class="myrmex-preview__input"></span>
							</div>
						</div>
					</div>
				</div>
			</div>
		`);

		const tabs = this.page.main.find(".myrmex-builder__tabs");
		GROUPS.forEach((group) => {
			$(`<button class="myrmex-builder__tab" role="tab" data-group="${group.key}">${group.label}</button>`)
				.attr("aria-selected", group.key === this.activeGroup)
				.on("click", () => this.activate(group.key))
				.appendTo(tabs);
		});
		// Branding tab (special — rendered by BrandingManager)
		$(`<button class="myrmex-builder__tab" role="tab" data-group="${BRANDING_TAB_KEY}">${__("Branding")}</button>`)
			.attr("aria-selected", false)
			.on("click", () => this.activate(BRANDING_TAB_KEY))
			.appendTo(tabs);

		this.page.main.on("click", "[data-action]", (event) => {
			const action = $(event.currentTarget).data("action");
			if (action === "save") this.save();
			if (action === "revert") this.load();
			if (action === "reset") this.reset();
		});
	}

	activate(key) {
		this.activeGroup = key;
		this.page.main
			.find(".myrmex-builder__tab")
			.each((_, el) => $(el).attr("aria-selected", $(el).data("group") === key));

		const isBranding = key === BRANDING_TAB_KEY;
		// Show/hide the theme fields panel vs branding panel
		this.page.main.find(".myrmex-builder__groups").toggle(!isBranding);
		this.page.main.find(".myrmex-builder__branding-panel").toggle(isBranding);
		this.page.main.find(".myrmex-builder__actions").toggle(!isBranding);

		if (isBranding) {
			this._brandingManager.mount(this.page.main.find(".myrmex-builder__branding-panel"));
		} else {
			this.page.main
				.find(".myrmex-builder__group")
				.each((_, el) => $(el).toggleClass("is-active", $(el).data("group") === key));
		}
	}

	// --- fields -------------------------------------------------------------

	render_fields() {
		const host = this.page.main.find(".myrmex-builder__groups").empty();

		GROUPS.forEach((group) => {
			const section = $(`<div class="myrmex-builder__group" data-group="${group.key}"></div>`)
				.toggleClass("is-active", group.key === this.activeGroup)
				.appendTo(host);

			group.fields.forEach((field) => section.append(this.render_field(field)));
		});
	}

	render_field(field) {
		if (field.type === "heading") {
			return $('<p class="myrmex-builder__subhead"></p>').text(field.label);
		}

		const value = this.settings[field.fieldname];
		const row = $('<div class="myrmex-builder__field"></div>');
		$("<label></label>").text(field.label).appendTo(row);
		const control = $('<div class="myrmex-builder__control"></div>').appendTo(row);

		if (field.type === "color") {
			const swatch = $('<input type="color" class="myrmex-builder__swatch">').val(value || "#000000");
			const hex = $('<input type="text" class="form-control input-sm myrmex-builder__hex">').val(value || "");

			swatch.on("input", () => {
				hex.val(swatch.val().toUpperCase());
				this.set_value(field.fieldname, swatch.val().toUpperCase());
			});
			hex.on("change", () => {
				const cleaned = this.normalise_hex(hex.val());
				if (!cleaned) {
					hex.val(this.settings[field.fieldname]);
					frappe.show_alert({ message: __("Enter a hex colour like #1DA1F2"), indicator: "orange" });
					return;
				}
				hex.val(cleaned);
				swatch.val(cleaned);
				this.set_value(field.fieldname, cleaned);
			});

			control.append(swatch, hex);
		} else if (field.type === "number") {
			const input = $('<input type="number" class="form-control input-sm myrmex-builder__number">')
				.attr({ min: field.min, max: field.max })
				.val(value);
			input.on("change", () => {
				let next = cint(input.val());
				next = Math.max(field.min, Math.min(field.max, next));
				input.val(next);
				this.set_value(field.fieldname, next);
			});
			control.append(input);
		} else if (field.type === "select") {
			const select = $('<select class="form-control input-sm"></select>');
			field.options.forEach((option) =>
				select.append($("<option></option>").attr("value", option).text(__(option)))
			);
			select.val(value);
			select.on("change", () => this.set_value(field.fieldname, select.val()));
			control.append(select);
		} else if (field.type === "preset") {
			const select = $('<select class="form-control input-sm"></select>');
			this.presets.concat(["Custom"]).forEach((option) =>
				select.append($("<option></option>").attr("value", option).text(__(option)))
			);
			select.val(value || "Myrmex Default");
			select.on("change", () => this.apply_preset(select.val()));
			control.append(select);
		} else if (field.type === "check") {
			const input = $('<input type="checkbox">').prop("checked", !!cint(value));
			input.on("change", () => this.set_value(field.fieldname, input.is(":checked") ? 1 : 0));
			control.append(input);
		} else if (field.type === "code") {
			row.css({ display: "block" });
			const area = $('<textarea class="form-control" rows="10" spellcheck="false"></textarea>')
				.val(value || "")
				.css({ "font-family": "var(--font-stack-mono, monospace)", "font-size": "12px", "margin-top": "8px" });
			area.on("change", () => this.set_value(field.fieldname, area.val()));
			row.append(area);
			return row;
		}

		return row;
	}

	normalise_hex(value) {
		let cleaned = (value || "").trim().replace(/^#/, "");
		if (cleaned.length === 3) cleaned = cleaned.split("").map((c) => c + c).join("");
		if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
		return "#" + cleaned.toUpperCase();
	}

	// --- preview ------------------------------------------------------------

	refresh_preview() {
		frappe.call({
			method: "theme_myrmex.api.preview_payload",
			args: { values: this.settings },
			callback: (r) => {
				if (!r.message) return;
				const preview = document.getElementById("myrmex-preview");
				if (!preview) return;

				const dark = document.documentElement.getAttribute("data-theme") === "dark";
				const vars = Object.assign(
					{},
					r.message.shared_vars,
					dark ? r.message.dark_vars : r.message.vars
				);

				// Scope the variables to the preview element, so the Desk around
				// it keeps the currently saved theme until the user saves.
				for (const [name, value] of Object.entries(vars)) {
					preview.style.setProperty(name, value);
				}

				// Table hover and pagination are selector-driven; the preview
				// carries the same attributes the Desk puts on <html>.
				const table = r.message.table || {};
				preview.dataset.myrmexTableHover = table.hover || "tint";
				preview.dataset.myrmexTablePaging = table.pagination || "pills";
				preview.classList.toggle("is-zebra", !!r.message.zebra_tables);
			},
		});
	}

	// --- actions ------------------------------------------------------------

	apply_preset(preset) {
		if (preset === "Custom") return;

		frappe.call({
			method: "theme_myrmex.api.apply_preset",
			args: { preset },
			callback: (r) => {
				if (!r.message) return;
				this.settings = Object.assign({}, r.message.settings, {
					custom_css: this.settings.custom_css,
				});
				this.dirty = true;
				this.page.set_indicator(__("Unsaved"), "orange");
				this.render_fields();
				this.refresh_preview();
			},
		});
	}

	save() {
		frappe.call({
			method: "theme_myrmex.api.save_theme",
			args: { values: this.settings },
			freeze: true,
			freeze_message: __("Saving theme"),
			callback: (r) => {
				if (!r.message) return;
				this.dirty = false;
				this.page.set_indicator(__("Saved"), "green");
				// Apply straight away in this tab; other open tabs get it over
				// realtime from the server.
				if (window.myrmex && window.myrmex.theme) window.myrmex.theme.apply(r.message);
			},
		});
	}

	reset() {
		frappe.confirm(__("Replace the current palette with Myrmex Default?"), () => {
			frappe.call({
				method: "theme_myrmex.api.reset_theme",
				freeze: true,
				freeze_message: __("Resetting theme"),
				callback: (r) => {
					if (r.message && window.myrmex && window.myrmex.theme) {
						window.myrmex.theme.apply(r.message);
					}
					this.load();
					this.page.set_indicator(__("Reset"), "blue");
				},
			});
		});
	}

	bind_page_actions() {
		this.page.set_primary_action(__("Save theme"), () => this.save());

		this.page.set_secondary_action(__("Open Theme Settings"), () =>
			frappe.set_route("Form", "Theme Settings")
		);

		this.page.add_menu_item(__("Toggle dark preview"), () => {
			const root = document.documentElement;
			const dark = root.getAttribute("data-theme") === "dark";
			frappe.ui.set_theme(dark ? "light" : "dark");
			this.refresh_preview();
		});

		this.page.add_menu_item(__("Open Branding Settings"), () =>
			frappe.set_route("Form", "Branding Settings")
		);

		// Leaving with unsaved edits should be a deliberate choice.
		$(window).on("beforeunload.myrmex-builder", () => (this.dirty ? true : undefined));
		this.page.wrapper.on("remove", () => $(window).off("beforeunload.myrmex-builder"));
	}
}

// ===========================================================================
// BrandingManager — Image upload / preview tab inside Theme Builder
// ===========================================================================

class BrandingManager {
	constructor(page) {
		this.page = page;
		this._mounted = false;
		this._host = null;
		this._data = {};
	}

	mount(host) {
		this._host = host;
		if (this._mounted) return; // already rendered, just ensure visible
		this._mounted = true;
		this._render(host);
		this._load();
	}

	_render(host) {
		host.empty().append(`
			<div class="mx-branding-manager" style="padding: 16px 0;">
				<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
					<div>
						<h5 style="margin:0 0 2px; font-weight:700;">${__("Image & Branding")}</h5>
						<p style="margin:0; font-size:12px; color:var(--myrmex-muted,#64748b);">
							${__("Upload logos, favicon, and backgrounds. Changes take effect immediately after saving.")}
						</p>
					</div>
					<button class="btn btn-primary btn-sm mx-branding-save">${__("Save branding")}</button>
				</div>
				<div class="mx-branding-grid"></div>
				<div style="margin-top:20px; padding-top:14px; border-top:1px solid var(--myrmex-border,#e2e8f0);">
					<h6 style="margin:0 0 10px; font-size:12px; font-weight:700; text-transform:uppercase;
						letter-spacing:.05em; color:var(--myrmex-muted,#64748b);">${__("Display settings")}</h6>
					<div class="mx-branding-scalars"></div>
				</div>
			</div>
		`);

		const grid = host.find(".mx-branding-grid");
		BRANDING_IMAGES.forEach((def) => grid.append(this._card(def)));

		this._renderScalars(host.find(".mx-branding-scalars"));

		host.find(".mx-branding-save").on("click", () => this._save());

		// Delegate drop zone clicks to the hidden file input
		host.on("click", ".mx-drop-zone", (e) => {
			$(e.currentTarget).find('input[type="file"]').trigger("click");
		});
	}

	_card(def) {
		const card = $(`
			<div class="mx-branding-card" data-key="${def.key}">
				<div class="mx-branding-card-header">
					<p class="mx-branding-card-title">${def.label}</p>
					<p class="mx-branding-card-hint">${def.hint}
						<span class="mx-dimension-badge">${def.dims}</span>
					</p>
				</div>
				<div class="mx-branding-preview ${def.preview === "dark" ? "mx-preview-dark" : "mx-preview-checkerboard"}">
					<div class="mx-no-image">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<rect x="3" y="3" width="18" height="18" rx="2"/>
							<circle cx="8.5" cy="8.5" r="1.5"/>
							<path d="m21 15-5-5L5 21"/>
						</svg>
						<span>${__("No image")}</span>
					</div>
				</div>
				<div class="mx-branding-controls">
					<div class="mx-drop-zone">
						<input type="file" accept="${def.accepts}" data-key="${def.key}">
						<span>${__("Click or drop to upload")}</span>
					</div>
					<div class="mx-branding-actions">
						<span class="mx-upload-status mx-status-empty">${__("Not set")}</span>
						<button class="btn btn-xs btn-danger mx-btn-remove" style="display:none;">${__("Remove")}</button>
					</div>
				</div>
			</div>
		`);

		// File input → upload
		card.find('input[type="file"]').on("change", (e) => {
			const file = e.target.files[0];
			if (file) this._upload(def.key, file, card);
		});

		// Drag-and-drop
		const dz = card.find(".mx-drop-zone");
		dz.on("dragover", (e) => { e.preventDefault(); dz.addClass("mx-drag-over"); });
		dz.on("dragleave", () => dz.removeClass("mx-drag-over"));
		dz.on("drop", (e) => {
			e.preventDefault();
			dz.removeClass("mx-drag-over");
			const file = e.originalEvent.dataTransfer.files[0];
			if (file) this._upload(def.key, file, card);
		});

		// Remove button
		card.find(".mx-btn-remove").on("click", () => this._removeImage(def.key, card));

		return card;
	}

	_renderScalars(host) {
		const scalars = [
			{ key: "logo_max_height", label: __("Logo max height (px)"), type: "number", min: 20, max: 80, default: 32 },
			{ key: "loader_bg_color", label: __("Loader background"), type: "color", default: "#ffffff" },
			{ key: "loader_spinner_color", label: __("Loader spinner colour"), type: "color", default: "#6366f1" },
			{ key: "login_bg_overlay_color", label: __("Login overlay colour"), type: "color", default: "#1e1b4b" },
			{ key: "login_bg_overlay_opacity", label: __("Login overlay opacity (0–1)"), type: "number", min: 0, max: 1, step: 0.05, default: 0.5 },
		];

		scalars.forEach((s) => {
			const row = $(`<div class="myrmex-builder__field" data-scalar="${s.key}"></div>`);
			$("<label></label>").text(s.label).appendTo(row);
			const ctrl = $('<div class="myrmex-builder__control"></div>').appendTo(row);

			if (s.type === "color") {
				const swatch = $('<input type="color" class="myrmex-builder__swatch">');
				const hex = $('<input type="text" class="form-control input-sm myrmex-builder__hex" maxlength="7">');
				const sync = (val) => { swatch.val(val); hex.val(val); this._data[s.key] = val; };
				swatch.on("input", () => sync(swatch.val().toUpperCase()));
				hex.on("change", () => { const c = this._normaliseHex(hex.val()); if (c) sync(c); });
				ctrl.append(swatch, hex);
			} else {
				const input = $('<input type="number" class="form-control input-sm myrmex-builder__number">')
					.attr({ min: s.min, max: s.max, step: s.step || 1 });
				input.on("change", () => { this._data[s.key] = parseFloat(input.val()); });
				ctrl.append(input);
			}

			host.append(row);
		});
	}

	_load() {
		frappe.call({
			method: "theme_myrmex.branding.get_branding_settings",
			callback: (r) => {
				if (!r.message) return;
				this._data = Object.assign({}, r.message);
				this._refresh();
			},
		});
	}

	_refresh() {
		if (!this._host) return;
		const data = this._data;

		// Update image cards
		BRANDING_IMAGES.forEach((def) => {
			const card = this._host.find(`.mx-branding-card[data-key="${def.key}"]`);
			const url = data[def.key];
			this._setCardImage(card, url);
		});

		// Update scalars
		[
			["logo_max_height", "number"],
			["loader_bg_color", "color"],
			["loader_spinner_color", "color"],
			["login_bg_overlay_color", "color"],
			["login_bg_overlay_opacity", "number"],
		].forEach(([key]) => {
			const row = this._host.find(`[data-scalar="${key}"]`);
			const val = data[key];
			if (val !== undefined && val !== null) {
				row.find('input[type="color"]').val(val);
				row.find('input[type="text"]').val(val);
				row.find('input[type="number"]').val(val);
			}
		});
	}

	_setCardImage(card, url) {
		const preview = card.find(".mx-branding-preview");
		const statusBadge = card.find(".mx-upload-status");
		const removeBtn = card.find(".mx-btn-remove");

		if (url) {
			preview.html(`<img src="${url}" alt="" loading="lazy">`);
			statusBadge
				.removeClass("mx-status-empty mx-status-uploading")
				.addClass("mx-status-ok")
				.text(__("Uploaded"));
			removeBtn.show();
		} else {
			preview.html(`
				<div class="mx-no-image">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<rect x="3" y="3" width="18" height="18" rx="2"/>
						<circle cx="8.5" cy="8.5" r="1.5"/>
						<path d="m21 15-5-5L5 21"/>
					</svg>
					<span>${__("No image")}</span>
				</div>
			`);
			statusBadge
				.removeClass("mx-status-ok mx-status-uploading")
				.addClass("mx-status-empty")
				.text(__("Not set"));
			removeBtn.hide();
		}
	}

	_upload(key, file, card) {
		// Validate file type
		const def = BRANDING_IMAGES.find((d) => d.key === key);
		const ext = "." + file.name.split(".").pop().toLowerCase();
		if (def && !def.accepts.split(",").includes(ext)) {
			frappe.show_alert({ message: __("File type not supported: {0}", [ext]), indicator: "red" });
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			frappe.show_alert({ message: __("File is too large (max 5 MB)"), indicator: "red" });
			return;
		}

		const statusBadge = card.find(".mx-upload-status");
		statusBadge.removeClass("mx-status-ok mx-status-empty").addClass("mx-status-uploading").text(__("Uploading…"));

		const formData = new FormData();
		formData.append("file", file, file.name);
		formData.append("is_private", "0");
		formData.append("folder", "Home/Branding");

		frappe.call({
			method: "upload_file",
			args: {},
			type: "POST",
			filedata: file,
			callback: () => {}, // handled below via raw fetch
		});

		// Use raw fetch for file upload (Frappe's upload_file endpoint)
		fetch("/api/method/upload_file", {
			method: "POST",
			headers: { "X-Frappe-CSRF-Token": frappe.csrf_token },
			body: formData,
		})
			.then((res) => res.json())
			.then((data) => {
				const url = data.message && (data.message.file_url || data.message.file_name);
				if (!url) throw new Error("No file URL returned");

				this._data[key] = url;
				this._setCardImage(card, url);
				frappe.show_alert({ message: __("{0} uploaded", [def ? def.label : key]), indicator: "green" });
			})
			.catch((err) => {
				statusBadge.removeClass("mx-status-uploading").addClass("mx-status-empty").text(__("Failed"));
				frappe.show_alert({ message: __("Upload failed: {0}", [err.message]), indicator: "red" });
			});
	}

	_removeImage(key, card) {
		frappe.confirm(__("Remove this image?"), () => {
			this._data[key] = null;
			this._setCardImage(card, null);
		});
	}

	_save() {
		frappe.call({
			method: "theme_myrmex.branding.save_branding",
			args: { values: JSON.stringify(this._data) },
			freeze: true,
			freeze_message: __("Saving branding…"),
			callback: (r) => {
				if (r.message && r.message.ok) {
					frappe.show_alert({ message: __("Branding saved"), indicator: "green" });
					// Apply immediately in this tab
					if (window.myrmex && window.myrmex.branding) {
						window.myrmex.branding.apply(r.message.payload || this._data);
					}
				} else {
					frappe.show_alert({ message: __("Failed to save branding"), indicator: "red" });
				}
			},
		});
	}

	_normaliseHex(value) {
		let cleaned = (value || "").trim().replace(/^#/, "");
		if (cleaned.length === 3) cleaned = cleaned.split("").map((c) => c + c).join("");
		if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
		return "#" + cleaned.toUpperCase();
	}
}
