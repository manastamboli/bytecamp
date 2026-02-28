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
        var scriptTag = document.currentScript || document.querySelector('script[data-site]');
        if (!scriptTag) {
            warn("Could not find tracker script tag — aborting");
            return;
        }

        var siteId = scriptTag.getAttribute('data-site');
        var pageSlug = scriptTag.getAttribute('data-page') || window.location.pathname;

        // Hardcoded API base URL
        var apiBase = 'https://jeanene-unexposed-ingrid.ngrok-free.dev';

        if (!siteId) {
            warn("Missing data-site attribute — aborting");
            return;
        }
        log("Initialized", { siteId: siteId, pageSlug: pageSlug, apiBase: apiBase });

        var pageViewId = null;
        var sessionId = getCookie('_sp_sid');

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
                    setCookie('_sp_sid', data.sessionId, 30);
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

    // ── Cookie helpers ──────────────────────────────────────────────────────
    function setCookie(name, value, minutes) {
        var expires = '';
        if (minutes) {
            var d = new Date();
            d.setTime(d.getTime() + minutes * 60000);
            expires = '; expires=' + d.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax; Secure';
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

    // Prevent multiple executions
    if (!window._spTrackerInitialized) {
        window._spTrackerInitialized = true;
        init();
    } else {
        log("Already initialized — skipping duplicate");
    }
})();
