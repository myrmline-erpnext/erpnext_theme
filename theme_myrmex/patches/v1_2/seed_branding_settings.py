"""Patch v1.2 — Seed Branding Settings with safe defaults.

Run once after migration; idempotent — skipped when the doc already has values.
"""

import frappe


def execute():
	if not frappe.db.exists("DocType", "Branding Settings"):
		return

	from theme_myrmex.install import ensure_branding_settings

	ensure_branding_settings()
