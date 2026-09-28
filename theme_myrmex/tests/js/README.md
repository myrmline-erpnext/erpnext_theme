# Browser-side tests

These run the theme's JavaScript against the **real markup** of both Desks,
copied from Frappe's own templates:

* `logout.test.js` — the v15 navbar user dropdown
  (`frappe/public/js/frappe/ui/toolbar/navbar.html`, action items rendered as
  `<button class="btn-reset dropdown-item" onclick="return frappe.app.logout()">`)
  and the v16 sidebar header menu
  (`frappe/public/js/frappe/ui/sidebar/sidebar_header.js`,
  `.dropdown-menu-item[data-name="logout"]`).
* `compat.test.js` — shell detection and the selectors each shell exposes.

They need only Node and jsdom, not a bench:

```bash
npm install jsdom
node theme_myrmex/tests/js/logout.test.js
node theme_myrmex/tests/js/compat.test.js
```

If Frappe changes either menu's markup, these fail loudly instead of the
logout button quietly doing nothing.
