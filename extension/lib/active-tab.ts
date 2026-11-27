import { browser } from 'wxt/browser';

/**
 * Returns the URL of the tab the user is looking at, or null if the browser
 * does not expose it. Needs the "activeTab" permission and must be called
 * after the user opened the popup.
 */
export async function getActiveTabUrl(): Promise<string | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.url ?? null;
}

/** True for normal web pages; false for chrome://, file://, about: etc. */
export function isWebPageUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
