// resources/assets/js/core/router.js
var Router = class {
  constructor() {
    this.routes = [];
    this.currentRoute = null;
    this.currentCleanup = null;
    this.notFoundHandler = null;
    window.addEventListener("popstate", () => this.resolve());
  }
  get(path, handler) {
    this.routes.push({
      path,
      handler,
      matcher: this.compilePath(path)
    });
  }
  navigate(path) {
    if (path !== location.pathname) {
      history.pushState({}, "", path);
    }
    this.resolve();
  }
  async resolve() {
    const path = location.pathname;
    const match = this.match(path);
    if (!match) {
      if (typeof this.notFoundHandler === "function") {
        if (typeof this.currentCleanup === "function") {
          this.currentCleanup();
        }
        this.currentRoute = null;
        this.currentCleanup = await this.notFoundHandler({
          path,
          params: {}
        });
      }
      console.error("404 returned route:", path);
      return;
    }
    if (typeof this.currentCleanup === "function") {
      this.currentCleanup();
    }
    this.currentRoute = match.route;
    this.currentCleanup = await match.route.handler({
      path,
      params: match.params
    });
  }
  init() {
    this.resolve();
  }
  notFound(handler) {
    this.notFoundHandler = handler;
  }
  match(path) {
    for (const route of this.routes) {
      const result = path.match(route.matcher);
      if (!result) continue;
      return {
        route,
        params: result.groups ?? {}
      };
    }
    return null;
  }
  compilePath(path) {
    const normalized = path.replace(/\/+$/, "") || "/";
    const pattern = normalized === "/" ? "^/$" : "^" + normalized.replace(/\{(\w+)\}/g, "(?<$1>[^/]+)") + "/?$";
    return new RegExp(pattern);
  }
};
var router = new Router();

// resources/assets/js/core/template.js
var templateCache = /* @__PURE__ */ new Map();
async function loadTemplate(path) {
  if (!templateCache.has(path)) {
    const request = fetch(path).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load template: ${path}`);
      }
      return response.text();
    });
    templateCache.set(path, request);
  }
  return templateCache.get(path);
}
function renderTemplate(template, data = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

// resources/assets/js/core/runtime.js
function runtimeConfig() {
  return window.ZIRO_CONF || {};
}
function appName() {
  return runtimeConfig().APP_NAME || "Ziro";
}
function appEnv() {
  return runtimeConfig().ENV || "production";
}
function isDevelopmentEnv() {
  return ["local", "development", "dev"].includes(String(appEnv()).toLowerCase());
}
function apiBaseUrl() {
  return runtimeConfig().API_BASE_URL || "/api/v1";
}
function assetBaseUrl() {
  return runtimeConfig().ASSET_URL || "";
}
function assetUrl(logicalPath) {
  const normalized = String(logicalPath || "").replace(/^\/+/, "");
  const base = assetBaseUrl().replace(/\/$/, "");
  const publicPath = `${runtimeConfig().ASSET_BASE_PATH || "/assets"}/${normalized}`.replace(/\/+/g, "/");
  return base ? `${base}${publicPath}` : publicPath;
}

// resources/assets/js/core/dom.js
var DomUtils = class {
  /**
   * returns the `document.body` property.
   * @returns {HTMLElement}
   */
  docBody = document.body;
  /**
   * Find an element by id.
   *
   * @param {string} value
   * @returns {HTMLElement|null}
   */
  id(value) {
    return document.getElementById(value);
  }
  /**
   * Find the first element matching a selector.
   *
   * @param {string} selector
   * @returns {Element|null}
   */
  select(selector) {
    return document.querySelector(selector);
  }
  /**
   * Find all elements matching a selector.
   *
   * @param {string} selector
   * @returns {NodeListOf<Element>}
   */
  selectAll(selector) {
    return document.querySelectorAll(selector);
  }
  /**
   * Create a DOM element by tag name.
   *
   * @param {string} tagName
   * @returns {HTMLElement}
   */
  createEl(tagName) {
    return document.createElement(tagName);
  }
  /**
   * Resolve either a selector string or a direct DOM target to one element.
   *
   * @param {string|Element|Document|Window|null|undefined} target
   * @returns {Element|Document|Window|null|undefined}
   */
  resolveElement(target) {
    return typeof target === "string" ? this.select(target) : target;
  }
  /**
   * Resolve a selector, array, NodeList, or single element into an iterable list.
   *
   * @param {string|NodeListOf<Element>|Element[]|Element|null|undefined} target
   * @returns {NodeListOf<Element>|Element[]}
   */
  resolveElements(target) {
    if (typeof target === "string") return this.selectAll(target);
    if (NodeList.prototype.isPrototypeOf(target) || Array.isArray(target)) return target;
    return target ? [target] : [];
  }
  /**
   * Attach an event listener to one target.
   *
   * Local usage:
   *
   * `dom.on("#save-btn", "click", handler)`
   *
   * @param {string|Element|Document|Window|null|undefined} target
   * @param {string} eventName
   * @param {EventListenerOrEventListenerObject} handler
   * @param {boolean|AddEventListenerOptions} [options]
   * @returns {EventListenerOrEventListenerObject}
   */
  on(target, eventName, handler, options) {
    const element = this.resolveElement(target);
    element?.addEventListener(eventName, handler, options);
    return handler;
  }
  /**
   * Attach an event listener to multiple targets.
   *
   * Local usage:
   * `dom.onAll(".action-btn", "click", handler)`
   *
   * @param {string|NodeListOf<Element>|Element[]|Element|null|undefined} target
   * @param {string} eventName
   * @param {EventListenerOrEventListenerObject} handler
   * @param {boolean|AddEventListenerOptions} [options]
   * @returns {EventListenerOrEventListenerObject}
   */
  onAll(target, eventName, handler, options) {
    const elements = this.resolveElements(target);
    elements.forEach((element) => element?.addEventListener(eventName, handler, options));
    return handler;
  }
  /**
   * Remove an event listener from one target.
   *
   * @param {string|Element|Document|Window|null|undefined} target
   * @param {string} eventName
   * @param {EventListenerOrEventListenerObject} handler
   * @param {boolean|EventListenerOptions} [options]
   */
  off(target, eventName, handler, options) {
    const element = this.resolveElement(target);
    element?.removeEventListener(eventName, handler, options);
  }
  /**
   * Replace the current `?display` query parameter without reloading the page.
   *
   * @param {string} to
   * @returns {void}
   */
  setHREF(to) {
    const currentURL = new URL(window.location.href);
    currentURL.search = "";
    currentURL.searchParams.set("display", to);
    window.history.pushState({ page: 1 }, "", currentURL.href);
  }
  setDocTitle(pageTitle) {
    const name = appName();
    document.title = pageTitle ? `${pageTitle}` : name;
  }
  /**
   * Return the last segment of a file path.
   *
   * @param {string} path
   * @returns {string}
   */
  basename(path) {
    const normalized = String(path ?? "");
    const lastSlashIndex = Math.max(normalized.lastIndexOf("/"), normalized.lastIndexOf("\\"));
    return normalized.substring(lastSlashIndex + 1);
  }
  /**
   * Silence noisy debug logs outside the local environment.
   *
   * @returns {void}
   */
  silenceConsoleInProduction() {
    if (!isDevelopmentEnv()) {
      console.log = () => {
      };
      console.debug = () => {
      };
    }
  }
};
var dom = new DomUtils();
dom.silenceConsoleInProduction();

// resources/assets/js/components/header.js
var headerTemplatePath = assetUrl("templates/components/header.html");
async function renderHeader(title = appName()) {
  const template = await loadTemplate(headerTemplatePath);
  return renderTemplate(template, { title });
}
function bindHeaderInteractions() {
  const nav = dom.select(".nav");
  const toggle = dom.select(".nav-toggle");
  const menu = dom.id("primary-nav");
  if (!nav || !toggle || !menu) return () => {
  };
  const closeMenu = () => {
    nav.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  const openMenu = () => {
    nav.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
  };
  const toggleMenu = () => {
    if (nav.classList.contains("nav-open")) {
      closeMenu();
      return;
    }
    openMenu();
  };
  const onToggleClick = () => toggleMenu();
  const onMenuClick = (event) => {
    if (event.target.closest("a")) closeMenu();
  };
  const onResize = () => {
    if (window.innerWidth > 900) closeMenu();
  };
  dom.on(toggle, "click", onToggleClick);
  dom.on(menu, "click", onMenuClick);
  dom.on(window, "resize", onResize);
  return () => {
    dom.off(toggle, "click", onToggleClick);
    dom.off(menu, "click", onMenuClick);
    dom.off(window, "resize", onResize);
  };
}

// resources/assets/js/components/footer.js
var footerTemplatePath = assetUrl("templates/components/footer.html");
async function renderFooter() {
  return loadTemplate(footerTemplatePath);
}

// resources/assets/js/pages/landing.js
var landingTemplatePath = assetUrl("templates/pages/landing.html");
async function renderLandingShell() {
  const [header, landingPage, footer] = await Promise.all([
    renderHeader(appName()),
    loadTemplate(landingTemplatePath),
    renderFooter()
  ]);
  return `${header}<main id="page-root">${landingPage}</main>${footer}`;
}
async function mountLandingPage() {
  const appShell = dom.id("app");
  const pageRoot = dom.id("page-root");
  if (!appShell) return () => {
  };
  dom.setDocTitle("Home | Ziro");
  if (pageRoot) {
    pageRoot.innerHTML = await loadTemplate(landingTemplatePath);
  } else {
    appShell.innerHTML = await renderLandingShell();
  }
  dom.docBody.classList.remove("route-login");
  if (typeof window.hljs !== "undefined") {
    window.hljs.highlightAll();
  }
  const cleanups = [];
  cleanups.push(bindHeaderInteractions());
  const navLinks = dom.selectAll('.nav a[href^="#"]');
  const sections = dom.selectAll("section[id]");
  const onScroll = () => {
    let current = "";
    sections.forEach((section) => {
      if (window.scrollY >= section.offsetTop - 100) {
        current = section.id;
      }
    });
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${current}`);
    });
  };
  dom.on(window, "scroll", onScroll);
  cleanups.push(() => dom.off(window, "scroll", onScroll));
  onScroll();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  dom.selectAll(".card, .step, pre").forEach((el) => {
    el.classList.add("reveal-ready");
    observer.observe(el);
  });
  cleanups.push(() => observer.disconnect());
  const codeEl = dom.select(".hero .code-block code");
  let typingTimer = null;
  if (codeEl) {
    const text = codeEl.textContent;
    codeEl.textContent = "";
    const type = (index = 0) => {
      if (index >= text.length) return;
      codeEl.textContent += text[index];
      typingTimer = window.setTimeout(() => type(index + 1), 20);
    };
    type();
    cleanups.push(() => {
      if (typingTimer) window.clearTimeout(typingTimer);
      codeEl.textContent = text;
    });
  }
  dom.selectAll(".btn").forEach((btn) => {
    const onClick = (event) => {
      const circle = dom.createEl("span");
      circle.className = "ripple";
      const rect = btn.getBoundingClientRect();
      circle.style.left = `${event.clientX - rect.left}px`;
      circle.style.top = `${event.clientY - rect.top}px`;
      btn.appendChild(circle);
      window.setTimeout(() => circle.remove(), 500);
    };
    dom.on(btn, "click", onClick);
    cleanups.push(() => dom.off(btn, "click", onClick));
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}

// resources/assets/js/services/api.js
var ApiClient = class {
  /**
   * @param {{ baseUrl?: string, defaultHeaders?: Record<string, string>, credentials?: RequestCredentials }} [config]
   */
  constructor({ baseUrl, defaultHeaders, credentials } = {}) {
    this.baseUrl = baseUrl || "";
    this.defaultHeaders = defaultHeaders || { Accept: "application/json" };
    this.credentials = credentials || "include";
    this.activeController = null;
  }
  /**
   * Normalize relative URLs against the configured API base.
   *
   * Local usage:
   * `api.buildUrl("/users/profile")`
   *
   * @param {string} url
   * @returns {string}
   */
  buildUrl(url) {
    if (!url) return this.baseUrl;
    if (/^https?:\/\//i.test(url)) return url;
    const root = this.baseUrl;
    return `${root}${url}`;
  }
  /**
   * Merge default headers, request headers, and auto-added client headers.
   *
   * @param {string} method
   * @param {Record<string, string>} [headers={}]
   * @returns {Record<string, string>}
   */
  buildHeaders(method, headers = {}) {
    const mergedHeaders = {
      ...this.defaultHeaders,
      ...headers,
      "X-Client-Type": "I-A-JS"
    };
    if (method !== "GET" && window.CSRF) {
      mergedHeaders["X-CSRF-Token"] = window.CSRF;
    }
    return mergedHeaders;
  }
  /**
   * Convert plain object bodies to JSON while preserving FormData and Blob payloads.
   *
   * @param {unknown} body
   * @param {Record<string, string>} headers
   * @returns {BodyInit|undefined|null}
   */
  normalizeBody(body, headers) {
    if (!body || typeof body !== "object") return body;
    if (body instanceof FormData || body instanceof Blob) return body;
    headers["Content-Type"] = "application/json";
    return JSON.stringify(body);
  }
  /**
   * Perform an HTTP request and parse the response body.
   *
   * Local usage:
   * `await api.patch("/profile", payload)`
   *
   * @param {"GET"|"POST"|"PATCH"|"DELETE"|"PUT"} method
   * @param {string} url
   * @param {"json"|"text"|"blob"} [responseType="json"]
   * @param {RequestInit} [options={}]
   * @returns {Promise<any>}
   */
  async request(method, url, responseType = "json", options = {}) {
    const verb = String(method).toUpperCase();
    const allowedMethods = ["GET", "POST", "PATCH", "DELETE", "PUT"];
    if (!allowedMethods.includes(verb)) {
      throw new Error(`Invalid HTTP verb: ${verb}`);
    }
    const headers = this.buildHeaders(verb, options.headers);
    const requestOptions = {
      ...options,
      method: verb,
      credentials: this.credentials,
      headers
    };
    requestOptions.body = this.normalizeBody(options.body, headers);
    let response;
    try {
      response = await fetch(this.buildUrl(url), requestOptions);
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw new Error(`Network error: ${error}`);
    }
    const type = String(responseType).toLowerCase();
    if (type === "text") return response.text();
    if (type === "blob") return response.blob();
    return response.json();
  }
  /**
   * Cancel the previous in-flight request before starting a new one.
   *
   * Local usage:
   * `await api.gatedRequest("GET", "/search?q=math")`
   *
   * @param {"GET"|"POST"|"PATCH"|"DELETE"|"PUT"} method
   * @param {string} url
   * @param {"json"|"text"|"blob"} [responseType="json"]
   * @param {RequestInit} [options={}]
   * @returns {Promise<any>}
   */
  gatedRequest(method, url, responseType = "json", options = {}) {
    if (this.activeController) this.activeController.abort();
    this.activeController = new AbortController();
    return this.request(method, url, responseType, {
      ...options,
      signal: this.activeController.signal
    });
  }
  /**
   * Shortcut for a JSON GET request.
   *
   * @param {string} url
   * @param {RequestInit} [options={}]
   * @returns {Promise<any>}
   */
  get(url, options = {}) {
    return this.request("GET", url, "json", options);
  }
  /**
   * Shortcut for a JSON POST request.
   *
   * @param {string} url
   * @param {unknown} body
   * @param {RequestInit} [options={}]
   * @returns {Promise<any>}
   */
  post(url, body, options = {}) {
    return this.request("POST", url, "json", { ...options, body });
  }
  /**
   * Shortcut for a JSON PATCH request.
   *
   * @param {string} url
   * @param {unknown} body
   * @param {RequestInit} [options={}]
   * @returns {Promise<any>}
   */
  patch(url, body, options = {}) {
    return this.request("PATCH", url, "json", { ...options, body });
  }
  /**
   * Shortcut for a JSON DELETE request.
   *
   * @param {string} url
   * @param {RequestInit} [options={}]
   * @returns {Promise<any>}
   */
  delete(url, options = {}) {
    return this.request("DELETE", url, "json", options);
  }
};
var api = new ApiClient({
  baseUrl: apiBaseUrl()
});
var asyncFetch = api.request.bind(api);
var gatedFetch = api.gatedRequest.bind(api);

// resources/assets/js/pages/login.js
var loginTemplatePath = assetUrl("templates/pages/login.html");
async function renderLoginPage(header = "Login to your account") {
  const [loginTemplate, footer] = await Promise.all([
    loadTemplate(loginTemplatePath),
    renderFooter()
  ]);
  return `${renderTemplate(loginTemplate, { header })}${footer}`;
}
async function mountLoginPage() {
  const appShell = dom.id("app");
  if (!appShell) return () => {
  };
  dom.setDocTitle("Login");
  appShell.innerHTML = await renderLoginPage();
  dom.docBody.classList.add("route-login");
  const form = dom.id("login-form-element");
  const emailInput = dom.id("email");
  const passwordInput = dom.id("password");
  const status = dom.select(".form-status");
  if (!form || !emailInput || !passwordInput || !status) {
    return () => {
    };
  }
  const onSubmit = async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
      status.textContent = "Enter both email and password.";
      return;
    }
    status.textContent = "Logging in...";
    try {
      const response = await api.post("/login", { email, password });
      status.textContent = response.message ?? "Login request completed.";
    } catch (error) {
      status.textContent = error.message ?? "Login failed.";
    }
  };
  dom.on(form, "submit", onSubmit);
  return () => {
    dom.off(form, "submit", onSubmit);
    dom.docBody.classList.remove("route-login");
  };
}

// resources/assets/js/pages/dashboard.js
var dashboardTemplatePath = assetUrl("templates/pages/dashboard.html");
async function renderDashboardShell() {
  const [header, dashboardPage, footer] = await Promise.all([
    renderHeader(appName()),
    loadTemplate(dashboardTemplatePath),
    renderFooter()
  ]);
  return `${header}<main id="page-root">${dashboardPage}</main>${footer}`;
}
async function mountDashboardPage() {
  const appShell = dom.id("app");
  const pageRoot = dom.id("page-root");
  if (!appShell) return () => {
  };
  dom.setDocTitle("Dashboard");
  if (pageRoot) {
    pageRoot.innerHTML = await loadTemplate(dashboardTemplatePath);
  } else {
    appShell.innerHTML = await renderDashboardShell();
  }
  dom.docBody.classList.remove("route-login");
  const cleanupHeader = bindHeaderInteractions();
  return () => {
    cleanupHeader();
  };
}

// resources/assets/js/pages/not-found.js
var notFoundTemplatePath = assetUrl("templates/pages/not-found.html");
async function renderNotFoundShell() {
  const [header, page, footer] = await Promise.all([
    renderHeader(appName()),
    loadTemplate(notFoundTemplatePath),
    renderFooter()
  ]);
  return `${header}<main id="page-root">${page}</main>${footer}`;
}
async function mountNotFoundPage() {
  const appShell = dom.id("app");
  const pageRoot = dom.id("page-root");
  if (!appShell) return () => {
  };
  dom.setDocTitle("404 - Not Found");
  if (pageRoot) {
    pageRoot.innerHTML = await loadTemplate(notFoundTemplatePath);
  } else {
    appShell.innerHTML = await renderNotFoundShell();
  }
  dom.docBody.classList.remove("route-login");
  const cleanupHeader = bindHeaderInteractions();
  return () => {
    cleanupHeader();
  };
}

// resources/assets/js/core/internal/hmr-client.js
function initHmrClient() {
  const config = window.ZIRO_CONF?.HMR;
  if (!config?.enabled || !config.url) {
    return;
  }
  try {
    const ws = new WebSocket(config.url);
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "css") {
        document.querySelectorAll("link[rel=stylesheet]").forEach((link) => {
          const href = new URL(link.href);
          if (!href.pathname.endsWith("/app.css")) {
            return;
          }
          link.href = `${href.pathname}?t=${Date.now()}`;
        });
        return;
      }
      if (payload.type === "reload" || payload.type === "js") {
        window.location.reload();
      }
    };
  } catch (error) {
    console.error("Failed to initialize Ziro HMR client:", error);
  }
}

// resources/assets/js/main.js
router.get("/", async () => mountLandingPage());
router.get("/home/{slug1}", async () => mountLandingPage());
router.get("/login", async () => mountLoginPage());
router.get("/dashboard", async () => mountDashboardPage());
router.notFound(async () => mountNotFoundPage());
document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || link.target === "_blank") return;
  if (/^(mailto:|tel:|https?:)/.test(href)) return;
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin) return;
  event.preventDefault();
  router.navigate(url.pathname);
});
router.init();
initHmrClient();
//# sourceMappingURL=main.js.map
