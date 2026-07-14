import { useEffect } from "react";

export default function LiveChat() {
  useEffect(() => {
    // Prevent duplicate script elements
    if (document.getElementById("tawk-script")) return;

    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];

    s1.id = "tawk-script";
    s1.async = true;
    s1.src = "https://embed.tawk.to/69ad8c2bb90e871c36a78999/1jtes68b3";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    // Set up Tawk_API and Tawk_LoadStart variables
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    } else {
      document.head.appendChild(s1);
    }
  }, []);

  return null;
}
