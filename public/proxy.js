/*
 * Imagination navigation bridge.
 * Keeps URL parsing and engine navigation in one place so the UI can remain
 * independent from the Scramjet frame implementation.
 */

export class ProxyNavigator {
  constructor({ resolveAddress, onStatus, onHistory }) {
    this.resolveAddress = resolveAddress;
    this.onStatus = onStatus || (() => {});
    this.onHistory = onHistory || (() => {});
    this.frame = null;
    this.entries = [];
    this.index = -1;
  }

  attach(frame) {
    this.frame = frame;
    return this;
  }

  get current() {
    return this.entries[this.index] || "";
  }

  canGoBack() {
    return this.index > 0;
  }

  canGoForward() {
    return this.index >= 0 && this.index < this.entries.length - 1;
  }

  normalize(value) {
    const url = this.resolveAddress(value);
    if (!url) throw new Error("Enter a URL or search query.");
    return url;
  }

  async go(value, options = {}) {
    if (!this.frame) throw new Error("Scramjet frame has not started.");

    const url = this.normalize(value);
    this.onStatus("Loading…");

    this.frame.go(url);

    if (!options.historyNavigation) {
      this.entries = this.entries.slice(0, this.index + 1);
      if (this.entries[this.entries.length - 1] !== url) {
        this.entries.push(url);
      }
      this.index = this.entries.length - 1;
      this.onHistory(url);
    }

    this.onStatus("");
    return url;
  }

  async back() {
    if (!this.canGoBack()) return "";
    this.index -= 1;
    return this.go(this.entries[this.index], { historyNavigation: true });
  }

  async forward() {
    if (!this.canGoForward()) return "";
    this.index += 1;
    return this.go(this.entries[this.index], { historyNavigation: true });
  }

  async reload() {
    if (!this.current) return "";
    return this.go(this.current, { historyNavigation: true });
  }
}

export function createProxyNavigator(options) {
  return new ProxyNavigator(options);
}