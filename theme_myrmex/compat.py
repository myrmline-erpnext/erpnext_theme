"""Frappe version compatibility shims for Theme Myrmex.

Frappe v16 changed the cache API from a callable method to a direct property:
    v15: frappe.cache().get_value(...)
    v16: frappe.cache.get_value(...)

Use get_cache() from this module everywhere instead of accessing frappe.cache
directly so the app runs on both v15 and v16 without branching at every call site.
"""

import frappe


def get_cache():
    """Return the Frappe cache object, compatible with both v15 and v16.

    In Frappe v15, ``frappe.cache`` is a callable that returns a RedisWrapper.
    In Frappe v16, ``frappe.cache`` is the RedisWrapper directly (not callable).
    Calling it in v16 raises ``TypeError``; this helper abstracts the difference.
    """
    cache = frappe.cache
    # v15: frappe.cache is a bound method — call it to get the wrapper.
    if callable(cache):
        return cache()
    # v16: frappe.cache already is the wrapper.
    return cache


def get_frappe_version() -> tuple[int, ...]:
    """Return the running Frappe version as a comparable tuple, e.g. (16, 0, 0).

    Falls back to (0,) if the version cannot be determined.
    """
    try:
        import frappe as _frappe

        version_string = getattr(_frappe, "__version__", None) or ""
        return tuple(int(part) for part in version_string.split(".")[:3] if part.isdigit())
    except Exception:
        return (0,)


def is_v16_or_later() -> bool:
    """Return True when running on Frappe 16 or newer."""
    return get_frappe_version()[:1] >= (16,)
