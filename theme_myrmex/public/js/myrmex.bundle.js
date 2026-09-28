// Theme Myrmex — Desk bundle entry.
//
// Import order is the initialisation order: utils create the namespace, compat
// works out which Desk shell we are in, theme paints the variables, and the
// surface modules attach. Logout is loaded early and is independent of the
// rest, so a styling problem can never take the session controls with it.

import "./myrmex-utils.js";
import "./myrmex-compat.js";
import "./myrmex-theme.js";
import "./myrmex-logout.js";
import "./myrmex-sidebar.js";
import "./myrmex-navbar.js";
import "./myrmex-workspace.js";
