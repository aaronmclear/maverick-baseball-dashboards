const installAppButton = document.getElementById('installApp');
const shareAppButton = document.getElementById('shareApp');
const appActionsStatus = document.getElementById('appActionsStatus');
let deferredInstallPrompt = null;

function setAppStatus(message) {
  if (!appActionsStatus) return;
  appActionsStatus.textContent = message;
}

function getShareUrl() {
  const url = new URL(window.location.href);
  url.hash = '';
  return url.toString();
}

async function shareAppLink() {
  const shareUrl = getShareUrl();
  if (navigator.share) {
    try {
      await navigator.share({
        title: document.title,
        text: 'Mercer Island baseball stats dashboard',
        url: shareUrl
      });
      setAppStatus('Shared');
      return;
    } catch {
      // Fall through to clipboard copy.
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setAppStatus('Link copied');
      return;
    } catch {
      // Fall through to plain-text fallback.
    }
  }

  setAppStatus(`Share this URL: ${shareUrl}`);
}

if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
  document.body.classList.add('is-standalone');
}

if (shareAppButton) {
  shareAppButton.addEventListener('click', async () => {
    await shareAppLink();
  });
}

if (installAppButton) {
  installAppButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      setAppStatus('Use your browser menu to install this app');
      return;
    }

    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    setAppStatus(choice.outcome === 'accepted' ? 'Installed' : 'Install canceled');
    deferredInstallPrompt = null;
    installAppButton.classList.add('hidden');
  });
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installAppButton) {
    installAppButton.classList.remove('hidden');
  }
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (installAppButton) {
    installAppButton.classList.add('hidden');
  }
  setAppStatus('App installed on this device');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/dashboard-sw.js');
    } catch {
      // Ignore service worker registration failures.
    }
  });
}
