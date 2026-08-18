import { useEffect, useRef } from "react";

interface LiveChatProps {
  /** Pass true on admin routes to suppress the Tawk.to widget entirely. */
  disabled: boolean;
}

export default function LiveChat({ disabled }: LiveChatProps) {
  const scriptInjected = useRef(false);

  useEffect(() => {
    if (disabled) {
      // If the script hasn't been injected yet, don't inject it at all —
      // wait until the user navigates to a public page.
      if (!scriptInjected.current) return;

      // Script is already loaded: hide the widget via the official API.
      const Tawk = (window as any).Tawk_API;
      if (Tawk) {
        if (typeof Tawk.hideWidget === "function") {
          Tawk.hideWidget();
        } else {
          // Widget hasn't fully initialised yet — hide as soon as it does.
          const prevOnLoad = Tawk.onLoad;
          Tawk.onLoad = function () {
            if (prevOnLoad) prevOnLoad();
            Tawk.hideWidget();
          };
        }
      }
      return;
    }

    // ── Public page ─────────────────────────────────────────────────────────

    // If the widget is already on the page, just show it again.
    if (scriptInjected.current) {
      const Tawk = (window as any).Tawk_API;
      if (Tawk) {
        if (typeof Tawk.showWidget === "function") {
          Tawk.showWidget();
        } else {
          const prevOnLoad = Tawk.onLoad;
          Tawk.onLoad = function () {
            if (prevOnLoad) prevOnLoad();
            Tawk.showWidget();
          };
        }
      }
      return;
    }

    // First time on a public page — inject the script.
    // Prevent duplicate elements (e.g. React StrictMode double-invoke).
    if (document.getElementById("tawk-script")) {
      scriptInjected.current = true;
      return;
    }

    // IMPORTANT: Tawk_API and Tawk_LoadStart MUST be set before the script
    // is inserted into the DOM, otherwise the widget initialises before the
    // variables exist and silently fails.
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.id = "tawk-script";
    script.async = true;
    script.src = "https://embed.tawk.to/69ad8c2bb90e871c36a78999/1jtes68b3";
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    // Append to <head> — safer than insertBefore(s1, s0) which can race
    // with React's own <script type="module"> tag.
    document.head.appendChild(script);
    scriptInjected.current = true;
  }, [disabled]);

  return null;
}
