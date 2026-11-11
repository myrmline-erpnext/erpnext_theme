"""Branding settings — read, cache, and serve image references.

Branding Settings is a Single DocType that stores file paths for logos,
favicon, login background, loader, etc. This module reads those paths and
makes them available to the browser via bootinfo and CSS custom properties.
"""

import frappe

CACHE_KEY = "myrmex_branding_payload"

# Fields and their CSS variable / boot key
BRANDING_IMAGE_FIELDS = {
	"app_logo":          "--mx-brand-logo",
	"login_logo":        "--mx-brand-login-logo",
	"favicon":           "--mx-brand-favicon",
	"app_icon":          "--mx-brand-app-icon",
	"login_background":  "--mx-brand-login-bg",
	"login_illustration":"--mx-brand-login-illustration",
	"loader_image":      "--mx-brand-loader-image",
	"loader_animation":  "--mx-brand-loader-animation",
	"navbar_logo":       "--mx-brand-navbar-logo",
	"email_header_logo": "--mx-brand-email-header-logo",
	"email_footer_logo": "--mx-brand-email-footer-logo",
	"pwa_icon_192":      "--mx-brand-pwa-192",
	"pwa_icon_512":      "--mx-brand-pwa-512",
}

BRANDING_SCALAR_FIELDS = {
	"logo_max_height":          "--mx-brand-logo-height",
	"navbar_logo_max_height":   "--mx-brand-navbar-logo-height",
	"login_bg_overlay_color":   "--mx-brand-login-overlay-color",
	"login_bg_overlay_opacity": "--mx-brand-login-overlay-opacity",
	"loader_bg_color":          "--mx-brand-loader-bg",
	"loader_spinner_color":     "--mx-brand-loader-spinner",
}

_SCALAR_DEFAULTS = {
	"logo_max_height":          32,
	"login_bg_overlay_color":   "#1e1b4b",
	"login_bg_overlay_opacity": 0.5,
	"loader_bg_color":          "#ffffff",
	"loader_spinner_color":     "#6366f1",
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _doctype_exists() -> bool:
	"""Return True only when the Branding Settings DocType is installed."""
	return bool(frappe.db.exists("DocType", "Branding Settings"))


def _has_singles_row() -> bool:
	"""Return True when at least one row for Branding Settings exists in tabSingles.

	frappe.db.exists("Branding Settings", "Branding Settings") always returns a
	truthy string on a Single DocType (it matches the DocType name, not a data row).
	Querying tabSingles directly is the only reliable check on Frappe v15/v16.
	"""
	return bool(
		frappe.db.sql(
			"SELECT 1 FROM `tabSingles` WHERE doctype = %s LIMIT 1",
			("Branding Settings",),
		)
	)


def _get_or_create_doc():
	"""Return the Branding Settings doc.

	• If tabSingles already has a row  → frappe.get_single() (uses cache).
	• If no row yet (fresh install)    → frappe.new_doc() with safe defaults.
	• If get_single() raises for any reason → fall back to frappe.new_doc().

	Never raises; always returns a usable document object.
	"""
	if not _doctype_exists():
		return None

	if _has_singles_row():
		try:
			return frappe.get_single("Branding Settings")
		except Exception:
			pass  # fall through to new_doc below

	# No row yet — create an in-memory doc with defaults so callers get
	# sensible values without a save (read-only paths like build_payload).
	doc = frappe.new_doc("Branding Settings")
	for field, value in _SCALAR_DEFAULTS.items():
		doc.set(field, value)
	return doc


def _get_or_create_doc_for_write():
	"""Same as _get_or_create_doc() but always returns a persistable doc.

	Used by save_branding() where we must .save() afterwards.
	"""
	if not _doctype_exists():
		frappe.throw(frappe._("Branding Settings DocType not found"))

	if _has_singles_row():
		try:
			doc = frappe.get_single("Branding Settings")
			# Ensure defaults are present for any field still empty
			for field, value in _SCALAR_DEFAULTS.items():
				if doc.get(field) in (None, ""):
					doc.set(field, value)
			return doc
		except Exception:
			pass

	# No row yet — create and immediately persist with defaults so the
	# subsequent caller can safely call .save() again with new values.
	doc = frappe.new_doc("Branding Settings")
	for field, value in _SCALAR_DEFAULTS.items():
		doc.set(field, value)
	doc.flags.ignore_permissions = True
	doc.flags.ignore_mandatory = True
	doc.save()
	frappe.db.commit()
	# Re-fetch so it is a "real" saved doc
	return frappe.get_single("Branding Settings")


# ---------------------------------------------------------------------------
# Public read helpers
# ---------------------------------------------------------------------------

def get_branding_doc():
	"""Return the Branding Settings doc, or None if not installed."""
	return _get_or_create_doc()


def _read_singles() -> dict:
	"""Read all Branding Settings fields directly from tabSingles.

	Avoids frappe.get_single() which throws DoesNotExistError on Frappe v15
	when no row has been saved yet.  Returns an empty dict on a fresh install.
	"""
	if not _doctype_exists():
		return {}
	rows = frappe.db.sql(
		"SELECT `field`, `value` FROM `tabSingles` WHERE `doctype` = %s",
		("Branding Settings",),
	)
	return {r[0]: r[1] for r in rows} if rows else {}


def build_branding_payload() -> dict:
	"""Return branding tokens ready for the browser."""
	if not _doctype_exists():
		return _empty_payload()

	data = _read_singles()
	# Merge in scalar defaults for any field not yet saved
	for field, default in _SCALAR_DEFAULTS.items():
		if not data.get(field):
			data[field] = str(default)

	image_vars = {}
	for field, var in BRANDING_IMAGE_FIELDS.items():
		value = data.get(field) or ""
		image_vars[var] = f'url("{value}")' if value else "none"

	scalar_vars = {}
	for field, var in BRANDING_SCALAR_FIELDS.items():
		value = data.get(field)
		if value is not None and value != "":
			if "height" in field and str(value).isdigit():
				scalar_vars[var] = f"{value}px"
			else:
				scalar_vars[var] = str(value)

	app_logo = data.get("app_logo") or ""
	return {
		"image_vars": image_vars,
		"scalar_vars": scalar_vars,
		"app_logo":            app_logo,
		"login_logo":          data.get("login_logo") or "",
		"favicon":             data.get("favicon") or "",
		"navbar_logo":         data.get("navbar_logo") or app_logo,
		"login_background":    data.get("login_background") or "",
		"loader_image":        data.get("loader_image") or "",
		"loader_animation":    data.get("loader_animation") or "",
		"loader_bg_color":     data.get("loader_bg_color") or "#ffffff",
		"loader_spinner_color": data.get("loader_spinner_color") or "#6366f1",
		"logo_max_height":     frappe.utils.cint(data.get("logo_max_height") or 32),
		"app_name_override":   data.get("app_name_override") or "",
		"custom_css_branding": data.get("custom_css_branding") or "",
		"custom_head_html":    data.get("custom_head_html") or "",
	}


def _empty_payload() -> dict:
	return {
		"image_vars":   {var: "none" for var in BRANDING_IMAGE_FIELDS.values()},
		"scalar_vars":  {},
		"app_logo":           "",
		"login_logo":         "",
		"favicon":            "",
		"navbar_logo":        "",
		"login_background":   "",
		"loader_image":       "",
		"loader_animation":   "",
		"loader_bg_color":    "#ffffff",
		"loader_spinner_color": "#6366f1",
		"logo_max_height":    32,
		"app_name_override":  "",
		"custom_css_branding": "",
		"custom_head_html":   "",
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

	allowed = (
		set(BRANDING_IMAGE_FIELDS.keys())
		| set(BRANDING_SCALAR_FIELDS.keys())
		| {"app_name_override", "custom_css_branding", "custom_head_html"}
	)

	# Use set_single_value() for every allowed field — this issues an
	# INSERT … ON DUPLICATE KEY UPDATE directly into tabSingles, so it
	# works whether the row exists or not, without ever calling get_single()
	# (which throws DoesNotExistError on Frappe v15 when no row exists yet).
	for field, value in values.items():
		if field in allowed:
			frappe.db.set_single_value(
				"Branding Settings",
				field,
				value if value is not None else "",
			)

	frappe.db.commit()
	clear_branding_cache()
	frappe.msgprint(frappe._("Branding settings saved"), alert=True, indicator="green")
	return build_branding_payload()


@frappe.whitelist()
def get_branding_settings() -> dict:
	"""Return current branding for the Theme Builder image manager tab."""
	frappe.only_for("System Manager")
	data = _read_singles()
	all_fields = (
		list(BRANDING_IMAGE_FIELDS.keys())
		+ list(BRANDING_SCALAR_FIELDS.keys())
		+ ["app_name_override", "custom_css_branding", "custom_head_html"]
	)
	return {f: data.get(f) or "" for f in all_fields}
