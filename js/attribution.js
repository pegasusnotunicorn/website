(function () {
  var STORAGE_KEY = "uww_utms";
  var TRACKED_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
  ];
  // Domains where appending UTMs is useful (Pegasus-owned sites that consume them,
  // plus the Kickstarter project page).
  var TAGGED_HOSTS = [
    "lovecareermagic.com",
    "www.lovecareermagic.com",
    "sysifuscorp.com",
    "www.sysifuscorp.com",
    "kickstarter.com",
    "www.kickstarter.com",
  ];

  function readStored() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function writeStored(obj) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  // Capture incoming UTMs (incoming params win over previously stored ones).
  var incoming = {};
  try {
    var params = new URLSearchParams(window.location.search);
    TRACKED_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) incoming[k] = v;
    });
  } catch (e) {}

  if (Object.keys(incoming).length) {
    var merged = readStored();
    Object.keys(incoming).forEach(function (k) {
      merged[k] = incoming[k];
    });
    writeStored(merged);
  }

  function tagAnchor(a) {
    var href = a.getAttribute("href");
    if (!href) return;
    if (href.charAt(0) === "#") return;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;

    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (e) {
      return;
    }
    if (TAGGED_HOSTS.indexOf(url.hostname) === -1) return;

    var stored = readStored();
    // If visitor has no captured source, attribute as a uww referral.
    if (!stored.utm_source) {
      stored.utm_source = "unicornwithwings";
      stored.utm_medium = "referral";
    }

    TRACKED_KEYS.forEach(function (k) {
      if (stored[k] && !url.searchParams.has(k)) {
        url.searchParams.set(k, stored[k]);
      }
    });

    a.href = url.toString();
  }

  // Use capture-phase listener so href is updated before navigation triggers,
  // including programmatic clicks fired by the share button etc.
  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var a = t.closest("a[href]");
      if (a) tagAnchor(a);
    },
    true
  );

  // Also tag once on load so right-click "copy link" gives a tagged URL.
  function tagAllOnLoad() {
    var anchors = document.querySelectorAll("a[href]");
    for (var i = 0; i < anchors.length; i++) tagAnchor(anchors[i]);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tagAllOnLoad);
  } else {
    tagAllOnLoad();
  }
})();
