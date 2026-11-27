"""Myrmex Conversation — one user's thread with the assistant.

Rows are created and read only through theme_myrmex.myrmex_assistant.api, which checks
ownership on every call. The DocType itself is readable by System Manager for
audit purposes; ordinary users have no Desk access to it.
"""

import frappe
from frappe.model.document import Document


class MyrmexConversation(Document):
	def on_trash(self):
		frappe.db.delete("Myrmex Message", {"conversation": self.name})
