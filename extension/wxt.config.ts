import { defineConfig } from 'wxt';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  manifest: {
    name: 'Phishing AI Guard',
    description: 'Lokalna analiza stron pod kątem phishingu.',
    // activeTab: access to the current tab's URL only after the user clicks
    // the extension icon. No access to history or other tabs.
    permissions: ['activeTab'],
  },
});
