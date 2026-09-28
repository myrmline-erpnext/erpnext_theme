import frappe
from frappe.tests.utils import FrappeTestCase

from theme_myrmex.api import build_payload, get_settings


class TestThemeSettings(FrappeTestCase):
	def test_short_hex_is_expanded(self):
		doc = frappe.get_single("Theme Settings")
		doc.primary_color = "#abc"
		doc.validate()
		self.assertEqual(doc.primary_color, "#AABBCC")

	def test_invalid_hex_is_rejected(self):
		doc = frappe.get_single("Theme Settings")
		doc.primary_color = "not-a-colour"
		with self.assertRaises(frappe.ValidationError):
			doc.validate()

	def test_sidebar_width_is_clamped(self):
		doc = frappe.get_single("Theme Settings")
		doc.sidebar_width = 9000
		doc.validate()
		self.assertLessEqual(doc.sidebar_width, 380)

	def test_payload_has_both_colour_schemes(self):
		payload = build_payload(get_settings())
		self.assertIn("--myrmex-primary", payload["vars"])
		self.assertIn("--myrmex-background", payload["dark_vars"])
		self.assertIn("--myrmex-card-radius", payload["shared_vars"])
		self.assertTrue(payload["shared_vars"]["--myrmex-card-radius"].endswith("px"))


class TestCompat(FrappeTestCase):
	"""The version layer must pick a shell for whatever Frappe is running."""

	def test_shell_matches_running_version(self):
		from theme_myrmex.compat import frappe_major, shell

		major = frappe_major()
		expected = "v16" if major >= 16 else "v15"
		self.assertEqual(shell(), expected)

	def test_css_list_has_exactly_one_shell(self):
		from theme_myrmex.compat import SHELL_CSS, desk_css

		sheets = desk_css()
		shells = [s for s in sheets if s.startswith("myrmex-shell-")]
		self.assertEqual(len(shells), 1, "exactly one shell layer must be loaded")
		self.assertIn(shells[0], SHELL_CSS["v15"] + SHELL_CSS["v16"])

	def test_tokens_load_before_the_shell(self):
		"""Cascade order is load order, so the variables must come first."""
		sheets = self._sheets()
		self.assertEqual(sheets[0], "myrmex-variables.bundle.css")
		shell_at = next(i for i, s in enumerate(sheets) if s.startswith("myrmex-shell-"))
		self.assertLess(sheets.index("myrmex-variables.bundle.css"), shell_at)
		self.assertGreater(sheets.index("myrmex-dark.bundle.css"), shell_at)
		self.assertEqual(sheets[-1], "myrmex-responsive.bundle.css")

	def test_payload_reports_the_shell(self):
		from theme_myrmex.api import build_payload
		from theme_myrmex.compat import shell

		payload = build_payload()
		self.assertEqual(payload["shell"], shell())
		self.assertIn(payload["shell"], ("v15", "v16"))

	def _sheets(self):
		from theme_myrmex.compat import desk_css

		return desk_css()
