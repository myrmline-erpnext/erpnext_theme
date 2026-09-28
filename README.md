# Theme Myrmex

A modern UI/UX layer for ERPNext.

> **This is the ERPNext v16 build.** It is pinned to Frappe/ERPNext v16 and
> falls back to the v16 shell if the running version cannot be read. The v15
> build is the same source tree with the pin and fallback set to v15 — if you
> install this one on a v15 bench it still works, because the shell is chosen at
> runtime, but the v15 package is the cleaner download.

The source supports **v15 and v16**; see [Versions](#2-versions-v15-and-v16).

Theme Myrmex restyles the whole Desk — sidebar, navbar, workspaces, forms, list
views, tables, dialogs — without touching a single line of Frappe or ERPNext
source code. All business logic, permissions and the native ERPNext icon set are
left exactly as they are.

---

## 1. What it does

| Area | What changes |
|---|---|
| Sidebar | Modern spacing, active/hover states, collapsed rail mode, mobile drawer, persisted state |
| Navbar | Taller, cleaner, restyled search, avatar, notifications, breadcrumbs |
| Workspaces | Card-based dashboard look for widgets, shortcuts, number cards, charts |
| Forms | Cleaner sections, labels, inputs, tabs, sidebar, comments, attachments |
| List views | Restyled header, filters, rows, status pills, pagination, bulk actions |
| Tables & grids | Fully configurable: header colours, borders (all / horizontal / none), row height, cell padding, stripes, sticky headers — applied to list views, report tables, child tables and datatables alike |
| Components | Buttons, inputs, selects, dropdowns, dialogs, tabs, badges |
| Theming | ~50 configurable colours and sizes as CSS custom properties |
| Dark mode | Light / Dark / System, derived automatically from your palette |
| Theme Builder | Visual editor with live preview, presets, save and reset — ten tabs: General, Colours, Sidebar, Navbar, Cards, Buttons, Forms, Tables, Dark Mode, Advanced |

### What it deliberately does **not** do

* It does not modify `frappe/` or `erpnext/`.
* It does not replace the ERPNext icon system. Native SVG sprite icons are kept;
  only size, alignment, spacing and colour are adjusted.
* It does not hide, add or bypass any permission-controlled UI. Rendering is
  still entirely Frappe's job.
* It does not add React/Vue/Angular or any large UI library. Plain CSS + vanilla
  JS on top of Frappe's own APIs.

---

## 2. Versions: v15 and v16

The two Desks are not cosmetically different, they are **structurally**
different, so the theme carries one shell layer per version and loads exactly
one of them.

| | v15 | v16 |
|---|---|---|
| Top navbar | `header.navbar` — brand, `#navbar-search`, notifications, help, user dropdown `#toolbar-user` | **Gone.** `navbar.html` renders only the announcement widget |
| Sidebar root | `.layout-side-section > .list-sidebar > .desk-sidebar` (inside the page layout) | `.body-sidebar-container(.expanded) > .body-sidebar` (global shell) |
| Sidebar item | `.sidebar-item-container > .desk-sidebar-item.standard-sidebar-item.selected` | `.sidebar-item-container > .standard-sidebar-item` |
| Collapse | none — the theme supplies the rail, the tooltips and the mobile drawer | native `.collapse-sidebar-link`, `.sidebar-resize-handle`, own overlay — the theme keeps its hands off |
| Logout | user dropdown, `onclick="return frappe.app.logout()"` | sidebar header menu, `.dropdown-menu-item[data-name="logout"]` |
| Design tokens | semantic vars only | semantic vars **plus** espresso `--ink-*`, `--surface-*`, `--outline-*` |

Unchanged, and therefore shared: `app_include_css` / `app_include_js`,
`extend_bootinfo`, Single DocTypes, standard Desk Pages,
`frappe.router.on("change")`, the `page-change` event, and the theme switcher
(`frappe.ui.set_theme`, `data-theme` on `<html>`).

### How a version is chosen

`theme_myrmex/compat.py` reads `frappe.__version__` at import time.
`hooks.py` asks it which stylesheets to register, so the correct shell layer is
the only one the browser ever downloads:

```
myrmex-variables → myrmex-base → myrmex-shell-v15 │ myrmex-shell-v16
                 → components → workspace → forms → lists → dark → responsive
```

The browser gets the same answer through `frappe.boot.myrmex_theme.shell`, and
`myrmex-compat.js` puts it on `<html>` as `myrmex-v15` / `myrmex-v16`. The JS
modules branch on it: `myrmex-navbar.js` returns immediately on v16, and
`myrmex-sidebar.js` forwards `toggle()` to v16's own collapse button instead of
adding a competing one.

### Which package should I install?

Install the one matching your bench. If you install the other, **nothing
breaks**: detection happens at runtime, so the right shell still loads — you
just get a note during `install`/`migrate` telling you the other package is the
better download. The two packages differ only in:

* `PACKAGE_TARGET` in `compat.py` (the fallback when the version is unreadable),
* the `[tool.bench.frappe-dependencies]` pin in `pyproject.toml`,
* this README.

## 3. Architecture

Theme Myrmex works through four official Frappe v15 extension points:

1. **`app_include_css` / `app_include_js`** — esbuild bundles injected into the Desk.
2. **`extend_bootinfo`** — the saved theme is delivered inside `frappe.boot`, so
   there is no extra network round-trip and no flash of unstyled content.
3. **A Single DocType (`Theme Settings`)** — stores the configuration and is
   subject to normal Frappe permissions (System Manager writes, everyone reads).
4. **A standard Desk Page (`theme-builder`)** — the visual editor.

Stylesheets are registered individually in `app_include_css` rather than
through one entry file that `@import`s the rest. Frappe copies each style
bundle into a temp directory before running postcss, so relative imports cannot
resolve and `bench build` fails with `ENOENT ... myrmex-variables.css`. The
hook list keeps the modular sources and makes the cascade order explicit.

The CSS is built as a **variable bridge**. Myrmex declares its own
`--myrmex-*` custom properties and then re-points Frappe's native variables
(`--primary`, `--bg-color`, `--fg-color`, `--text-color`, `--border-color`, …)
at them. That means a large part of the Desk is restyled by variables alone
rather than by brittle selector overrides, and anything Myrmex does not
explicitly target still inherits the palette.

```
theme_myrmex/
├── pyproject.toml
├── license.txt
├── README.md
└── theme_myrmex/
    ├── __init__.py
    ├── hooks.py
    ├── boot.py                  # extend_bootinfo + website context
    ├── api.py                   # whitelisted read/save/preset/reset endpoints
    ├── presets.py               # the five shipped presets + variable map
    ├── install.py               # after_install / after_migrate
    ├── modules.txt
    ├── patches.txt
    ├── templates/
    ├── compat.py                    # the v15/v16 delta, in one place
    ├── tests/js/                    # run the JS against both Desks' real markup
    ├── public/
    │   ├── css/                         # each file is its own esbuild bundle,
    │   │   │                            # ordered by app_include_css in hooks.py
    │   │   ├── myrmex-variables.bundle.css   # tokens + bridge to Frappe variables
    │   │   ├── myrmex-base.bundle.css
    │   │   ├── myrmex-shell-v15.bundle.css   # navbar + page-layout sidebar
    │   │   ├── myrmex-shell-v16.bundle.css   # body sidebar, espresso bridge
    │   │   ├── myrmex-components.bundle.css
    │   │   ├── myrmex-workspace.bundle.css
    │   │   ├── myrmex-forms.bundle.css
    │   │   ├── myrmex-lists.bundle.css
    │   │   ├── myrmex-dark.bundle.css
    │   │   ├── myrmex-responsive.bundle.css
    │   │   └── myrmex-login.bundle.css       # login / website only
    │   └── js/
    │       ├── myrmex.bundle.js         # desk bundle entry
    │       ├── myrmex-web.bundle.js     # login / website bundle entry
    │       ├── myrmex-utils.js          # namespace, route + observer helpers
    │       ├── myrmex-compat.js         # which shell am I in
    │       ├── myrmex-theme.js          # applies variables, dark mode, body flags
    │       ├── myrmex-logout.js         # deterministic logout, both shells
    │       ├── myrmex-sidebar.js
    │       ├── myrmex-navbar.js         # v15 only
    │       └── myrmex-workspace.js
    └── myrmex/                          # the "Myrmex" module
        ├── doctype/theme_settings/
        └── page/theme_builder/
```

> Note on layout: the brief sketched `doctype/` and `page/` directly under the
> app package. Frappe v15 requires them to live inside a **module folder** whose
> name matches an entry in `modules.txt`, so they are under `theme_myrmex/myrmex/`
> (module `Myrmex`). Everything else follows the brief.

---

## 4. Installation

Works the same on v15 and v16.

```bash
cd ~/frappe-bench

# 1. pull the app into the bench
bench get-app /path/to/theme_myrmex
# or: bench get-app https://your-git-host/theme_myrmex.git --branch main

# 2. install it on the site
bench --site your-site.local install-app theme_myrmex

# 3. build the assets
bench build --app theme_myrmex

# 4. run migrations (creates Theme Settings + Theme Builder page)
bench --site your-site.local migrate

# 5. restart
bench restart
```

If the theme does not appear immediately:

```bash
bench --site your-site.local clear-cache
bench --site your-site.local clear-website-cache
bench build --app theme_myrmex --force
bench restart
```

In development, `bench watch` rebuilds the bundles on save.

### If `bench build` fails

`ENOENT: no such file or directory ... public/css/*.css` from the `postcss2`
plugin means a style bundle is trying to `@import` a sibling file. Frappe's
build cannot resolve those. Every stylesheet in this app is a standalone
`*.bundle.css` listed in `app_include_css`; if you add one, follow the same
pattern instead of importing it.

### Uninstalling

```bash
bench --site your-site.local uninstall-app theme_myrmex
bench --site your-site.local clear-cache
bench restart
```

Because nothing outside the app is patched, removing it returns the Desk to
stock ERPNext.

---

## 5. Using it

**Theme Builder** — `/app/theme-builder` (System Manager only), or from the
Awesomebar type "Theme Builder". Pick a preset, adjust colours and radii, watch
the preview update live, then **Save theme**. Saved changes are pushed to every
open session over Frappe's realtime channel.

**Theme Settings** — `/app/theme-settings` is the raw DocType form for the same
values, useful for scripting or `bench --site … set-config`-style automation.

**Presets** — Myrmex Default, Myrmex Blue, Myrmex Dark, Myrmex Minimal,
Myrmex Enterprise.

### Table styles

The **Tables** tab drives every table the Desk renders — list views, report
view (DataTable), plain tables and the child-table grid on a form — so they
stay consistent instead of each being themed separately.

| Setting | What it does |
|---|---|
| Header background / text | Header row colours |
| Border | Rule colour, shared by all four table kinds |
| Row hover | Highlight under the pointer |
| Stripe + Striped rows | Alternating row colour, off by default |
| Borders | `All` (every cell outlined), `Horizontal` (row separators only, the default), `None` |
| Row height / Cell padding | Row rhythm, in px |
| Header font size | In px |
| Keep header visible | Sticky header while the body scrolls — offset for the v15 navbar, flush to the top on v16 |
| Uppercase headers | Off by default |

Colours, sizes and font size are CSS custom properties
(`--myrmex-table-*`). The last three are not single values — border style is
three mutually exclusive rule sets, the others are switches — so they are
applied as classes on `<html>` (`myrmex-table-borders-*`,
`myrmex-table-sticky`, `myrmex-table-upper`) and the rule sets live in
`myrmex-lists.bundle.css`.

Table colours are **not** carried into dark mode: a pale header on a dark table
is unreadable, so the dark equivalents are re-derived from the resolved dark
surfaces. Density `Compact` deliberately leaves the table row height alone —
it is an explicit setting, and silently overriding it would make the Tables tab
look broken.

### Dark mode colours

The **Dark Mode** tab sets the appearance default and, optionally, overrides the
four dark surfaces (background, surface, text, border). Leave one empty and it
is derived from your palette; the placeholder reads *derived*, and each has a
**Clear** button to go back to that. Accent colours (primary, secondary, status)
always carry over from the main palette, so a brand colour stays recognisable in
dark mode.

**Dark mode** — Myrmex piggybacks on Frappe's own theme switcher
(`data-theme="dark"` on `<html>`), so the user menu → *Toggle theme* keeps
working. Dark values are derived from your palette automatically; your accent
colours carry over.

**Custom CSS** — the *Advanced* section of Theme Settings takes raw CSS that is
appended last, for site-specific tweaks.

---

## 6. Testing checklist

Run through this after installing or after changing colours.

- [ ] Login page renders with the theme palette
- [ ] Desk loads with no flash of unstyled content
- [ ] Sidebar: expand, collapse, tooltips in collapsed mode, active item
- [ ] Sidebar state survives a full page reload
- [ ] Navbar: search, notifications, help, user menu, avatar dropdown
- [ ] Breadcrumbs and back navigation
- [ ] Workspace: cards, shortcuts, number cards, charts, links, recent documents
- [ ] Workspace edit mode still works (drag, add widget, save)
- [ ] List view: search, filters, sort, sidebar, status pills, pagination
- [ ] List view: row selection, bulk actions, "Edit" bulk dialog
- [ ] Report view, Kanban, Calendar, Gantt
- [ ] Form: sections, tabs, collapsible sections, grids, comments, attachments
- [ ] Form: save, submit, cancel, amend; grid row expand dialog
- [ ] Dialogs, dropdowns, awesomplete suggestions, date picker, multiselect
- [ ] Dark mode across every screen above; contrast is readable
- [ ] Theme Builder: all ten tabs open, preset, live preview, save, reset
- [ ] Tables tab: change header colour, borders, row height, stripes —
      the sample table reacts immediately, and the Desk only after saving
- [ ] After saving, the same table styling appears on a list view, a report
      view, a child table on a form, and a datatable
- [ ] Sticky header: scroll a long list — the header stays put and clears the
      navbar on v15
- [ ] Dark Mode tab: clear a colour (placeholder reads "derived") and confirm
      it falls back to the palette
- [ ] Colour change reflected in another open browser tab without reload
- [ ] Responsive: desktop, tablet (compact sidebar), mobile (drawer)
- [ ] Permissions: log in as a limited user — no extra links or actions appear
- [ ] Standard ERPNext flows: Sales Order → Delivery Note → Sales Invoice
- [ ] **Log out** from the user menu (v15) / sidebar header menu (v16):
      confirm dialog appears, one `/api/method/logout` request, lands on `/login`
- [ ] After logging out, **Back** does not return to the Desk
- [ ] Visit Theme Builder, change a colour without saving, then log out —
      no stale "unsaved changes" prompt blocks the redirect
- [ ] v16 only: native sidebar collapse, resize handle and mobile overlay still work
- [ ] v16 only: no stray empty navbar strip at the top of the Desk

---

## 7. Compatibility notes

* Targets Frappe/ERPNext v15 and v16. Every selector that differs between them
  lives in a `myrmex-shell-v*.bundle.css` file, and the reasoning is recorded in
  `compat.py`. Shared layers use only classes present in both.
* Text on primary-coloured surfaces is chosen by comparing real WCAG contrast
  ratios, so a mid-tone brand colour gets dark text rather than white. That can
  look unfamiliar next to stock Frappe, but it is the readable choice; override
  `--myrmex-primary-contrast` in Custom CSS if you need the other one.
* Nothing is module-specific; the theme applies across Accounting, Selling,
  Buying, Stock, Manufacturing, CRM, Projects, HR, Assets, Support and Website.
* The JS never uses timed guesses. It listens to `frappe.router.on("change")`
  and the `page-change` event, and where a MutationObserver is genuinely needed
  it is scoped to one container, guarded against double-init and disconnected on
  route change (see `myrmex-utils.js`).

## 8. The logout fix

### What Frappe actually does

Both versions wire logout through an **inline attribute** on the menu item:

* **v15** — `frappe/public/js/frappe/ui/toolbar/navbar.html` renders every
  Navbar Settings *Action* item as
  `<button class="btn-reset dropdown-item" onclick="return {{ item.action }}">`,
  and `hooks.py` gives "Log out" the action `frappe.app.logout()`.
* **v16** — the item moved to the sidebar header menu
  (`ui/sidebar/sidebar_header.js`) as
  `.dropdown-menu-item[data-name="logout"]`, whose handler also calls
  `frappe.app.logout()`.

`frappe.app.logout()` (`desk.js`, identical in both) opens a `frappe.confirm`
dialog and only **after** you confirm calls the `logout` endpoint and sets
`window.location.href = "/login?redirect-to=..."`.

### Why it looks dead

That chain has three links, and each breaks on its own — all three producing the
same symptom: you click **Log out** and nothing happens, with no error shown.

1. **The inline `onclick` never runs.** Any Content-Security-Policy without
   `'unsafe-inline'` disables inline handlers. Menu entries that are plain
   links (My Profile, Apps) keep working, so only the *Action* items — Log out,
   Toggle Theme, Reload — appear broken. This is the most common cause on
   hardened v15 installs, and it is visible as a CSP violation in the console.
2. **`frappe.app` is not what the attribute expects**, giving
   `frappe.app.logout is not a function` — thrown inside an attribute, where the
   browser swallows it.
3. **The redirect is cancelled by a stale `beforeunload` handler** left behind
   by some other page. Theme Myrmex had exactly this bug: the Theme Builder
   registered a "you have unsaved changes" guard and released it on the
   wrapper's `remove` event, which jQuery never fires — so after one visit to
   the Theme Builder the guard survived every later navigation, including the
   logout redirect. **Fixed**: the guard is now released when the router leaves
   the page, and again on any click on a logout control.

### What the theme does now

`public/js/myrmex-logout.js` claims the click in the **capture phase**, before
the inline attribute can run, and performs the logout itself:

1. identify the control **by structure, never by its label** — `data-name="logout"`
   on v16, an `onclick` naming logout inside `#toolbar-user` on v15, plus
   `[data-myrmex-logout]` as an opt-in hook. (Matching on the words "Log out"
   would break on every non-English site.)
2. `preventDefault()` + `stopImmediatePropagation()` so the native chain cannot
   also fire and open a second dialog;
3. confirm, using `frappe.confirm` when it exists and the browser's dialog if it
   does not;
4. call the documented `logout` endpoint — the server clears the session record
   and expires the `sid` cookie;
5. clear per-session client state: `sessionStorage`, plus the few `localStorage`
   keys Frappe and this theme write per user. A blanket `localStorage.clear()`
   would be a bug, not a security measure, so other apps' settings are left
   alone;
6. `window.location.replace("/login")` — a full document load, not a router
   push, and `replace()` so **Back cannot return to the authenticated Desk**.

Failure is handled rather than hidden: a server error reports and stays put, and
a `401`/`403` is treated as "already logged out" and redirects.

If this module fails to load, nothing is patched and Frappe's own path still
works.

### Verifying it

```bash
npm install jsdom
node theme_myrmex/tests/js/logout.test.js
node theme_myrmex/tests/js/compat.test.js
node theme_myrmex/tests/js/theme_builder.test.js
```

The suite drives the module against the real v15 navbar dropdown and the real
v16 sidebar header menu, and asserts the endpoint is called exactly once, the
native handler is suppressed, non-logout items are untouched, and the redirect
happens. If Frappe changes either menu, this fails loudly instead of the button
quietly doing nothing.

In the browser: open the console, click **Log out**, and you should see one
request to `/api/method/logout` followed by a load of `/login`. If instead you
see a CSP violation, cause 1 above is yours and this fix resolves it.

## 9. Licence

MIT — see `license.txt`.
