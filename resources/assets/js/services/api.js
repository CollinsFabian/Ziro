import { apiBaseUrl } from "../core/runtime.js";

/**
 * Shared HTTP client for local modules.
 * Prefer the shared `api` instance for requests.
 */
class ApiClient {
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
            "X-Client-Type": "I-A-JS",
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
            headers,
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
            signal: this.activeController.signal,
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
}

const api = new ApiClient({
    baseUrl: apiBaseUrl(),
});
const asyncFetch = api.request.bind(api);
const gatedFetch = api.gatedRequest.bind(api);

export { ApiClient, api, asyncFetch, gatedFetch };
