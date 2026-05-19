/**
 * Guard watch pages against popup-style opens.
 * Note: this cannot fully stop cross-origin iframe top-level redirects.
 */
export function setupAutoClosePopups() {
  const isWatchRoute = () =>
    /^\/((movie\/\d+)|(tv\/\d+\/\d+\/\d+))$/.test(window.location.pathname);

  const originalOpen = window.open;
  window.open = function (url, target, features, ...args) {
    if (isWatchRoute()) {
      console.warn("Blocked popup open on watch route:", url);
      return null;
    }
    return originalOpen.call(this, url, target, features, ...args);
  };

  const handleBeforeUnload = (event) => {
    if (isWatchRoute()) {
      event.preventDefault();
      event.returnValue = "";
      return "";
    }
    return undefined;
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.open = originalOpen;
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}
