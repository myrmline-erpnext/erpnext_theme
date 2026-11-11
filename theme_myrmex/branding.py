"""Branding settings — read, cache, and serve image references.

Branding Settings is a Single DocType that stores file paths for logos,
favicon, login background, loader, etc. This module reads those paths and
makes them available to the browser via bootinfo and CSS custom properties.
"""

import frappe

CACHE_KEY = "myrmex_branding_payload"

# Fields and their CSS variable / boot key
BRANDING_IMAGE_FIELDS = {
	"app_logo":         "--mx-brand-logo",
	"login_logo":       "--mx-brand-login-logo",
	"favicon":          "--mx-brand-favicon",
	"app_icon":         "--mx-brand-app-icon",
	"login_background": "--mx-brand-login-bg",
	"login_illustration":"--mx-brand-login-illustration",
	"loader_image":     "--mx-brand-loader-image",
	"loader_animation": "--mx-brand-loader-animation",
	"navbar_logo":      "--mx-brand-navbar-logo",
	"email_header_logo":"--mx-brand-email-header-logo",
	"email_footer_logo":"--mx-brand-email-footer-logo",
	"pwa_icon_192":     "--mx-brand-pwa-192",
	"pwa_icon_512":     "--mx-brand-pwa-512",
}

BRANDING_SCALAR_FIELDS = {
	"logo_max_height":          "--mx-brand-logo-height",
	"navbar_logo_max_height":   "--mx-brand-navbar-logo-height",
	"login_bg_overlay_color":   "--mx-brand-login-overlay-color",
	"login_bg_overlay_opacity": "--mx-brand-login-overlay-opacity",
	"loader_bg_color":          "--mx-brand-loader-bg",
	"loader_spinner_color":     "--mx-brand-loader-spinner",
}


def get_branding_doc():
	"""Return the Branding Settings doc, or None if not yet created."""
	try:
		if not frappe.db.exists("DocType", "Branding Settings"):
			return None
		return frappe.get_cached_doc("Branding Settings")
	except Exception:
		return None


def build_branding_payload() -> dict:
	"""Return branding tokens ready for the browser."""
	doc = get_branding_doc()
	if not doc:
		return _empty_payload()

	image_vars = {}
	for field, var in BRANDING_IMAGE_FIELDS.items():
		value = doc.get(field) or ""
		image_vars[var] = f'url("{value}")' if value else "none"

	scalar_vars = {}
	for field, var in BRANDING_SCALAR_FIELDS.items():
		value = doc.get(field)
		if value is not None and value != "":
			# Height fields → px suffix
			if "height" in field and str(value).isdigit():
				scalar_vars[var] = f"{value}px"
			else:
				scalar_vars[var] = str(value)

	return {
		"image_vars": image_vars,
		"scalar_vars": scalar_vars,
		# Flat copies for JS convenience
		"app_logo": doc.get("app_logo") or "",
		"login_logo": doc.get("login_logo") or "",
		"favicon": doc.get("favicon") or "",
		"navbar_logo": doc.get("navbar_logo") or doc.get("app_logo") or "",
		"login_background": doc.get("login_background") or "",
		"loader_image": doc.get("loader_image") or "",
		"loader_animation": doc.get("loader_animation") or "",
		"loader_bg_color": doc.get("loader_bg_color") or "#ffffff",
		"loader_spinner_color": doc.get("loader_spinner_color") or "#6366f1",
		"logo_max_height": frappe.utils.cint(doc.get("logo_max_height") or 32),
		"app_name_override": doc.get("app_name_override") or "",
		"custom_css_branding": doc.get("custom_css_branding") or "",
		"custom_head_html": doc.get("custom_head_html") or "",
	}


def _empty_payload() -> dict:
	return {
		"image_vars": {var: "none" for var in BRANDING_IMAGE_FIELDS.values()},
		"scalar_vars": {},
		"app_logo": "",
		"login_logo": "",
		"favicon": "",
		"navbar_logo": "",
		"login_background": "",
		"loader_image": "",
		"loader_animation": "",
		"loader_bg_color": "#ffffff",
		"loader_spinner_color": "#6366f1",
		"logo_max_height": 32,
		"app_name_override": "",
		"custom_css_branding": "",
		"custom_head_html": "",
	}


def get_branding_payload() -> dict:
	"""Cached payload — used by bootinfo and website context."""
	from theme_myrmex.compat import get_cache

	cached = get_cache().get_value(CACHE_KEY)
	if cached:
		return cached

	payload = build_branding_payload()
	get_cache().set_value(CACHE_KEY, payload)
	return payload


def clear_branding_cache(doc=None, method=None):
	"""Invalidate the cached payload and push an update via realtime."""
	from theme_myrmex.compat import get_cache

	get_cache().delete_value(CACHE_KEY)
	frappe.clear_cache(doctype="Branding Settings")

	try:
		frappe.publish_realtime(
			"myrmex_branding_updated",
			message=build_branding_payload(),
			after_commit=True,
		)
	except Exception:
		frappe.log_error(title="Theme Myrmex: branding realtime publish failed")


# ---------------------------------------------------------------------------
# Whitelisted endpoints
# ---------------------------------------------------------------------------


@frappe.whitelist(allow_guest=True)
def get_branding() -> dict:
	"""Guest-readable branding payload (login page needs it)."""
	return get_branding_payload()


@frappe.whitelist()
def save_branding(values: str | dict) -> dict:
	"""Persist branding settings. Only System Manager may call this."""
	frappe.only_for("System Manager")
	values = frappe.parse_json(values) or {}

	doc = frappe.get_doc("Branding Settings")
	doc.check_permission("write")

	allowed = set(BRANDING_IMAGE_FIELDS.keys()) | set(BRANDING_SCALAR_FIELDS.keys()) | {
		"app_name_override", "custom_css_branding", "custom_head_html",
	}
	for field, value in values.items():
		if field in allowed:
			doc.set(field, value)

	doc.save()
	frappe.msgprint(frappe._("Branding settings saved"), alert=True, indicator="green")
	return build_branding_payload()


@frappe.whitelist()
def get_branding_settings() -> dict:
	"""Return current branding for the Theme Builder image manager tab."""
	frappe.only_for("System Manager")
	doc = get_branding_doc()
	if not doc:
		return {}
	return {f: doc.get(f) or "" for f in list(BRANDING_IMAGE_FIELDS.keys()) + list(BRANDING_SCALAR_FIELDS.keys()) + [
		"app_name_override", "custom_css_branding", "custom_head_html",
	]}
