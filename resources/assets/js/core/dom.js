import { appName, isDevelopmentEnv } from "./runtime.js";

/**
 * Local DOM helper used across page modules.
 * Prefer `dom` for new code, while legacy named exports remain available.
 */
class DomUtils {
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
            console.log = () => { };
            console.debug = () => { };
        }
    }
}

const dom = new DomUtils();

dom.silenceConsoleInProduction();

export { DomUtils, dom };
