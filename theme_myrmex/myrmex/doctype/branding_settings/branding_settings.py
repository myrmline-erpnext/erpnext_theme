# Copyright (c) 2024, Myrmex and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class BrandingSettings(Document):
	def on_update(self):
		"""Clear theme cache and push branding update to all open sessions."""
		from theme_myrmex.api import clear_theme_cache
		from theme_myrmex.branding import clear_branding_cache

		clear_branding_cache()
		clear_theme_cache()
