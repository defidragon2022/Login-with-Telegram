/**
 * router.js — Minimal client-side view router
 *
 * Registers named "routes" (view render functions) and navigates
 * between them by calling the registered handler.
 */
export class Router {
  constructor() {
    /** @type {Record<string, (data?: any) => void>} */
    this._routes = {}
    this.current = null
  }

  /**
   * Register a named route.
   * @param {string}   name    - Route identifier
   * @param {Function} handler - Called with optional data when navigating to this route
   * @returns {Router} – for chaining
   */
  register(name, handler) {
    this._routes[name] = handler
    return this
  }

  /**
   * Navigate to a named route, passing optional data to its handler.
   * @param {string} name
   * @param {any}    [data]
   */
  navigate(name, data) {
    const handler = this._routes[name]
    if (!handler) {
      console.error(`[Router] No route registered for "${name}"`)
      return
    }
    this.current = name
    handler(data)
  }
}
