// Conversations are read-only in the Desk; they are written by the assistant API.

frappe.ui.form.on("Myrmex Conversation", {
	refresh(frm) {
		frm.disable_save();
		frm.add_custom_button(__("Messages"), () => {
			frappe.set_route("List", "Myrmex Message", { conversation: frm.doc.name });
		});
	},
});
