import frappe

from theme_myrmex.install import ensure_myrmex_settings


def execute():
	"""Create Myrmex Settings with the default suggestions. The assistant stays off."""
	ensure_myrmex_settings()
	frappe.clear_cache(doctype="Myrmex Settings")
