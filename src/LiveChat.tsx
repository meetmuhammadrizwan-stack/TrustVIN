import { useEffect } from "react";

export default function LiveChat() {
  useEffect(() => {
    // Prevent duplicate script elements
    if (document.getElementById("tawk-script")) return;

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
  }, []);

  return null;
}
