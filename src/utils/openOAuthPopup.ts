// src/utils/openOAuthPopup.ts
export function openOAuthPopup(
  url: string,
  windowName = "oauth-popup",
  width = 600,
  height = 700
): Promise<void> {
  return new Promise((resolve, reject) => {
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      url,
      windowName,
      `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars=yes,status=1`
    );

    if (!popup) {
      reject(new Error("Popup blocked or failed to open"));
      return;
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      const { type, platform, error } = event.data || {};

      if (type === "oauth_success") {
        window.removeEventListener("message", handleMessage);
        popup.close();
        resolve();
      } else if (type === "oauth_error") {
        window.removeEventListener("message", handleMessage);
        popup.close();
        reject(new Error(error || "OAuth error"));
      }
    }

    window.addEventListener("message", handleMessage);

    const checkClosedInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosedInterval);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Popup closed by user"));
      }
    }, 500);
  });
}