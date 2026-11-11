// Copyright (c) 2024, Myrmex and contributors
// For license information, please see license.txt

frappe.ui.form.on("Branding Settings", {
	refresh(frm) {
		frm.add_custom_button(__("Preview in New Tab"), () => {
			window.open("/", "_blank");
		}, __("Actions"));

		frm.add_custom_button(__("Apply & Reload"), () => {
			frm.save().then(() => {
				frappe.show_alert({ message: __("Branding applied"), indicator: "green" });
				setTimeout(() => location.reload(), 1200);
			});
		}, __("Actions"));

		// Add image preview helpers beside each Attach Image field
		_addImagePreviews(frm);
	},

	after_save(frm) {
		frappe.show_alert({
			message: __("Branding settings saved. Changes will take effect on next page load."),
			indicator: "green",
		});
	},
});

function _addImagePreviews(frm) {
	const imageFields = [
		{ field: "app_logo", label: __("Main Logo Preview") },
		{ field: "login_logo", label: __("Login Logo Preview") },
		{ field: "favicon", label: __("Favicon Preview") },
		{ field: "app_icon", label: __("App Icon Preview") },
		{ field: "login_background", label: __("Login Background Preview") },
		{ field: "loader_image", label: __("Loader Image Preview") },
		{ field: "navbar_logo", label: __("Navbar Logo Preview") },
	];

	imageFields.forEach(({ field }) => {
		const value = frm.doc[field];
		if (!value) return;

		const $wrapper = frm.fields_dict[field]?.$wrapper;
		if (!$wrapper) return;
		if ($wrapper.find(".mx-img-preview").length) return;

		const isLogo = field.includes("logo") || field.includes("icon");
		const bgStyle = isLogo
			? "background: repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%) 0 0 / 12px 12px;"
			: "background: #0f172a;";

		$wrapper.append(`
			<div class="mx-img-preview" style="
				margin-top: 8px;
				border: 1px solid #e2e8f0;
				border-radius: 8px;
				padding: 10px;
				${bgStyle}
				display: flex;
				align-items: center;
				justify-content: center;
				min-height: 60px;
				overflow: hidden;
			">
				<img src="${frappe.utils.escape_html(value)}" style="
					max-height: 80px;
					max-width: 100%;
					object-fit: contain;
					border-radius: 4px;
				" onerror="this.parentElement.innerHTML='<span style=&quot;color:#94a3b8;font-size:12px&quot;>Preview unavailable</span>'" />
			</div>
		`);
	});
}
