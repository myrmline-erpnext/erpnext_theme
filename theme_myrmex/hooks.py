app_name = "theme_myrmex"
app_title = "Theme Myrmex"
app_publisher = "Myrmex"
app_description = "Modern UI/UX theme and permission-aware AI assistant for ERPNext v15"
app_email = "hello@example.com"
app_license = "mit"

# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------
# Frappe v15 builds every file matching *.bundle.css / *.bundle.js found under
# public/ with esbuild, and resolves the bundle name through assets.json.
#
# Each stylesheet is registered as its own bundle rather than a single entry
# file that @imports the others. Frappe copies each style bundle into a temp
# directory before running postcss (once per output variant), so an entry that
# imports sibling files cannot resolve them and the build fails. Listing the
# files here keeps the same modular sources and puts the cascade order under
# explicit control: tokens first, then layers, then dark and responsive
# overrides last.
#
# Nothing here overwrites a Frappe or ERPNext asset; the bundles are appended
# after the core ones so the theme wins on equal specificity.

app_include_css = [
	# ── Foundation (original Myrmex bundles) ─────────────────────────────────
	"myrmex-variables.bundle.css",
	"myrmex-base.bundle.css",
	"myrmex-navbar.bundle.css",
	"myrmex-sidebar.bundle.css",
	"myrmex-components.bundle.css",
	"myrmex-workspace.bundle.css",
	"myrmex-forms.bundle.css",
	"myrmex-lists.bundle.css",
	"myrmex-states.bundle.css",
	"myrmex-chatbot.bundle.css",
	"myrmex-dark.bundle.css",
	"myrmex-responsive.bundle.css",
	# ── Enhanced layer — Tailwind-inspired richer palette & modern UI ────────
	# Loaded last so they win on equal specificity without !important wars.
	# Remove any of these to roll back an individual enhancement.
	"myrmex-enhanced-variables.bundle.css",   # richer token palette
	"myrmex-enhanced-sidebar.bundle.css",     # dark-indigo sidebar
	"myrmex-enhanced-navbar.bundle.css",      # gradient accent line + refinements
	"myrmex-enhanced-components.bundle.css",  # gradient buttons, vivid badges, dropdowns
	"myrmex-enhanced-dashboard.bundle.css",   # coloured KPI cards, widget polish
	"myrmex-enhanced-forms.bundle.css",       # section heads, grids, timeline
	"myrmex-enhanced-lists.bundle.css",       # table headers, rows, kanban, calendar
	"myrmex-enhanced-dark.bundle.css",        # zinc-950 dark surfaces + bright accents
	"myrmex-enhanced-overlays.bundle.css",    # z-index hierarchy, dropdowns, modals, tooltips, multi-selects
	"myrmex-dropdown-theme.bundle.css",       # theme-aware dropdown colours — dark/light mode, portal-mounted elements
	"myrmex-branding.bundle.css",             # dynamic branding (logo, favicon injection point)
]

app_include_js = "myrmex.bundle.js"

# Login page and any portal/website page.
web_include_css = [
	"myrmex-variables.bundle.css",
	"myrmex-login.bundle.css",
]

web_include_js = "myrmex-web.bundle.js"

# ---------------------------------------------------------------------------
# Boot
# ---------------------------------------------------------------------------
# The saved palette travels inside frappe.boot, so the Desk can paint the
# variables on the first frame instead of after an extra XHR.

extend_bootinfo = "theme_myrmex.boot.boot_session"
update_website_context = "theme_myrmex.boot.update_website_context"

# ---------------------------------------------------------------------------
# Installation lifecycle
# ---------------------------------------------------------------------------

after_install = "theme_myrmex.install.after_install"
after_migrate = "theme_myrmex.install.after_migrate"
after_app_install = "theme_myrmex.install.after_app_install"

# ---------------------------------------------------------------------------
# Document events
# ---------------------------------------------------------------------------
# Only the theme's own DocTypes and one cleanup on User are hooked. No ERPNext
# DocType is touched, so no business logic is affected.

doc_events = {
	"Theme Settings": {
		"on_update": "theme_myrmex.api.clear_theme_cache",
	},
	"Branding Settings": {
		"on_update": "theme_myrmex.branding.clear_branding_cache",
	},
	"User": {
		# Runs before Frappe's link check, so a user who used the assistant can
		# still be deleted, and their conversations go with them.
		"on_trash": "theme_myrmex.chatbot.tasks.delete_user_conversations",
	},
}

# Belt and braces for the same case: never let assistant records block a delete.
ignore_links_on_delete = ["Chatbot Conversation", "Chatbot Message"]

# ---------------------------------------------------------------------------
# Assistant
# ---------------------------------------------------------------------------
# Conversations idle past the configured retention period are removed daily.

scheduler_events = {
	"daily": [
		"theme_myrmex.chatbot.tasks.delete_expired_conversations",
	],
}

# Chatbot DocTypes are deliberately not exported as fixtures: settings hold an
# encrypted API key and conversations hold user data.
