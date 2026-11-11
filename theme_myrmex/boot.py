"""Deliver the theme and the assistant config with the page instead of after it."""

import frappe

from theme_myrmex.api import get_theme_payload


def boot_session(bootinfo):
	"""extend_bootinfo hook: attach the palette and the assistant config."""
	try:
		bootinfo.myrmex_theme = get_theme_payload()
	except Exception:
		# A broken theme must never block the Desk from booting.
		frappe.log_error(title="Theme Myrmex: bootinfo failed")

	try:
		from theme_myrmex.branding import get_branding_payload

		bootinfo.myrmex_branding = get_branding_payload()
	except Exception:
		bootinfo.myrmex_branding = {}
		frappe.log_error(title="Theme Myrmex: branding bootinfo failed")

	try:
		from theme_myrmex.chatbot.service import public_config

		# Filtered per user; contains no provider details or secrets.
		bootinfo.myrmex_chatbot = public_config()
	except Exception:
		bootinfo.myrmex_chatbot = {"enabled": False}
		frappe.log_error(title="Myrmex Assistant: bootinfo failed")


def update_website_context(context):
	"""Make the palette and branding available to portal and login templates.

	Also injects an inline <style> into the page <head> that overrides the
	Frappe/ERPNext loading screen with the custom loader image — this must be
	server-side so the CSS is present before any JavaScript runs.
	"""
	try:
		context.myrmex_theme = get_theme_payload()
	except Exception:
		context.myrmex_theme = None

	try:
		from theme_myrmex.branding import get_branding_payload

		branding = get_branding_payload()
		context.myrmex_branding = branding

		# ── Inject custom loader inline styles ────────────────────────────────
		# Frappe's loading screen renders before ANY JS runs, so CSS variables
		# and runtime JS cannot affect it.  We bake the URLs directly into an
		# inline <style> so the custom loader is visible from the first frame.
		loader_animation = branding.get("loader_animation") or ""
		loader_image = branding.get("loader_image") or ""
		loader_bg = branding.get("loader_bg_color") or ""
		loader_spinner = branding.get("loader_spinner_color") or ""

		# Animated GIF/WebP takes priority over the static image
		effective_loader = loader_animation or loader_image

		if effective_loader or loader_bg or loader_spinner:
			css_parts = []

			if loader_bg:
				css_parts.append(f"""
#freeze, #loading, .splash, .app-loader {{
	background: {loader_bg} !important;
}}""")

			if effective_loader:
				# Hide ALL default loader images/SVGs Frappe may show
				css_parts.append(f"""
#freeze .loading-logo > img,
#freeze .loading-logo > svg,
#freeze > svg,
#loading > img,
#loading > svg,
.splash > img,
.splash > svg,
.app-loader > img,
.app-loader > svg {{
	display: none !important;
}}
#freeze .loading-logo::before,
#freeze::before {{
	content: '' !important;
	display: block !important;
	width: 120px !important;
	height: 120px !important;
	background: url('{effective_loader}') center / contain no-repeat !important;
	margin: 0 auto !important;
}}""")

			if loader_spinner:
				css_parts.append(f"""
.loading-indicator,
#freeze .loading-state .loading-indicator span,
.loading-spinner {{
	border-top-color: {loader_spinner} !important;
	border-left-color: {loader_spinner} !important;
}}""")

			if css_parts:
				inline = "<style id='mx-loader-inline'>" + "\n".join(css_parts) + "\n</style>"
				context["head_html"] = (context.get("head_html") or "") + inline

	except Exception:
		context.myrmex_branding = {}
		frappe.log_error(title="Theme Myrmex: website context failed")

	return context
