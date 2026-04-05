// Service Worker registration is handled automatically by vite-plugin-pwa
// This file handles the "Install App" UI prompt for users

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
})

// Prompt for iOS home screen installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show custom install button (you can add this to your UI)
  const installButton = document.createElement('button');
  installButton.textContent = '📱 Install App';
  installButton.className = 'fixed bottom-20 right-4 md:bottom-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg z-40 text-sm font-semibold hover:shadow-xl transition-all';
  installButton.onclick = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`User ${outcome} the install prompt`);
    }
    deferredPrompt = null;
    installButton.remove();
  };

  // Add button to body after 3 seconds
  setTimeout(() => {
    document.body.appendChild(installButton);

    // Auto-remove after 10 seconds if not clicked
    setTimeout(() => {
      if (installButton.parentElement) {
        installButton.remove();
      }
    }, 10000);
  }, 3000);
});

// Track installation
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
});
