(function () {
    "use strict";

    // ── Logging ─────────────────────────────────────────────────────────────
    var PREFIX = "[SitePilot Analytics]";
    function log() { var a = [PREFIX]; for (var i = 0; i < arguments.length; i++) a.push(arguments[i]); console.log.apply(console, a); }
    function warn() { var a = [PREFIX]; for (var i = 0; i < arguments.length; i++) a.push(arguments[i]); console.warn.apply(console, a); }
    function err() { var a = [PREFIX]; for (var i = 0; i < arguments.length; i++) a.push(arguments[i]); console.error.apply(console, a); }

    function init() {
        log("Tracker script loaded");

        // Resolve the script tag — document.currentScript works reliably for defer scripts
        var scriptTag = document.currentScript ||
            document.querySelector('script[data-site]') ||
            document.querySelector('script[src*="tracker.js"]');

        if (!scriptTag) {
            warn("Could not find tracker script tag — aborting");
            return;
        }

        var siteId = scriptTag.getAttribute('data-site');
        var pageSlug = scriptTag.getAttribute('data-page') || window.location.pathname || '/';

        // ── Dynamic API Base Resolution ─────────────────────────────────────
        // 1. Explicit data-api attribute on the script tag (preferred)
        // 2. Origin of the script itself (if loaded from https://app.sitepilot.../tracker.js)
        // 3. Current page origin (for local testing / preview)
        var apiBase = scriptTag.getAttribute('data-api');
        if (!apiBase && scriptTag.src) {
            try {
                var scriptUrl = new URL(scriptTag.src, window.location.href);
                if (scriptUrl.origin && scriptUrl.origin !== 'null') {
                    apiBase = scriptUrl.origin;
                }
            } catch (e) {}
        }
        if (!apiBase) {
            apiBase = window.location.origin;
        }
        apiBase = apiBase.replace(/\/+$/, '');

        if (!siteId) {
            warn("Missing data-site attribute — aborting");
            return;
        }
        log("Initialized", { siteId: siteId, pageSlug: pageSlug, apiBase: apiBase });

        var pageViewId = null;
        var sessionId = getStoredSession();

        if (sessionId) {
            log("Existing session found:", sessionId);
        } else {
            log("No existing session — will create new one");
        }

        // ── Enter event ─────────────────────────────────────────────────────
        var enterUrl = apiBase + '/api/analytics/enter';
        log("Sending enter event →", enterUrl);

        fetch(enterUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId: siteId,
                pageSlug: pageSlug,
                sessionId: sessionId,
                userAgent: navigator.userAgent,
                referrer: document.referrer || null
            }),
            keepalive: true
        })
            .then(function (res) {
                log("Enter response status:", res.status);
                return res.json();
            })
            .then(function (data) {
                if (data.error) {
                    warn("Enter API returned error:", data.error);
                    return;
                }
                if (data.sessionId) {
                    setStoredSession(data.sessionId, 30);
                    sessionId = data.sessionId;
                    log("Session ID set:", sessionId);
                }
                if (data.pageViewId) {
                    pageViewId = data.pageViewId;
                    log("✅ User visited — pageViewId:", pageViewId);
                }
            })
            .catch(function (e) {
                err("Enter request failed:", e.message || e);
            });

        // ── Exit event ──────────────────────────────────────────────────────
        var exitUrl = apiBase + '/api/analytics/exit';
        var exitSent = false;

        function sendExit() {
            if (!pageViewId || exitSent) return;
            exitSent = true;

            log("Sending exit event → pageViewId:", pageViewId);
            var payload = JSON.stringify({ pageViewId: pageViewId });

            if (navigator.sendBeacon) {
                var sent = navigator.sendBeacon(exitUrl, new Blob([payload], { type: 'application/json' }));
                log("Exit sent via sendBeacon:", sent ? "success" : "failed");
            } else {
                log("sendBeacon unavailable — using fetch for exit");
                fetch(exitUrl, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true
                });
            }
            pageViewId = null;
        }

        // pagehide is the most reliable unload event for modern browsers
        window.addEventListener('pagehide', function () {
            log("pagehide fired");
            sendExit();
        });
        // visibilitychange covers mobile tab switches and app backgrounding
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') {
                log("visibilitychange → hidden");
                sendExit();
            }
        });

        log("Event listeners attached (pagehide, visibilitychange)");
    }

    // ── Cookie & Storage helpers ─────────────────────────────────────────────
    function setCookie(name, value, minutes) {
        var expires = '';
        if (minutes) {
            var d = new Date();
            d.setTime(d.getTime() + minutes * 60000);
            expires = '; expires=' + d.toUTCString();
        }
        var isSecure = window.location.protocol === 'https:';
        document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax' + (isSecure ? '; Secure' : '');
    }

    function getCookie(name) {
        var eq = name + '=';
        var parts = document.cookie.split(';');
        for (var i = 0; i < parts.length; i++) {
            var c = parts[i].replace(/^ +/, '');
            if (c.indexOf(eq) === 0) return c.substring(eq.length);
        }
        return null;
    }

    function getStoredSession() {
        var sid = getCookie('_sp_sid');
        if (sid) return sid;
        try {
            return window.sessionStorage.getItem('_sp_sid') || window.localStorage.getItem('_sp_sid');
        } catch (e) {
            return null;
        }
    }

    function setStoredSession(sid, minutes) {
        setCookie('_sp_sid', sid, minutes);
        try {
            window.sessionStorage.setItem('_sp_sid', sid);
            window.localStorage.setItem('_sp_sid', sid);
        } catch (e) {}
    }

    // Prevent multiple executions
    if (!window._spTrackerInitialized) {
        window._spTrackerInitialized = true;
        init();
    } else {
        log("Already initialized — skipping duplicate");
    }
})();
