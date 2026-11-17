// router.js — a tiny hash router.
//
// Routes are patterns like "#/bounty/:slug". The router parses the
// current hash, finds the first matching pattern, and calls its handler
// with the captured params plus the query string as a plain object.

export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#/, "") || "/";
  const [pathPart, queryPart] = raw.split("?");
  const segments = pathPart.split("/").filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryPart ?? ""));
  return { segments, query };
}

function matchSegments(pattern, segments) {
  const parts = pattern.split("/").filter(Boolean);
  if (parts.length !== segments.length) return null;
  const params = {};
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(":")) {
      params[parts[i].slice(1)] = decodeURIComponent(segments[i]);
    } else if (parts[i] !== segments[i]) {
      return null;
    }
  }
  return params;
}

export function createRouter(routes, fallback) {
  function dispatch() {
    const { segments, query } = parseHash();
    for (const [pattern, handler] of routes) {
      const params = matchSegments(pattern, segments);
      if (params) {
        handler({ ...params, query });
        return;
      }
    }
    fallback();
  }
  return {
    start() {
      addEventListener("hashchange", dispatch);
      dispatch();
    },
    go(path) {
      location.hash = path;
    },
  };
}

/** Build a hash link for a route, e.g. link("/bounty/abc") -> "#/bounty/abc". */
export function link(path) {
  return "#" + (path.startsWith("/") ? path : "/" + path);
}
