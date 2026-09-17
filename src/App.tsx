/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vite/client" />

import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import {
  Search,
  ShieldCheck,
  History,
  CheckCircle2,
  XCircle,
  Car,
  Zap,
  BadgeCheck,
  ArrowRight,
  Info,
  ChevronLeft,
  Lock,
  Globe,
  Mail,
  Menu,
  X,
  MapPin,
  Phone,
} from "lucide-react";

import AdminDashboard from "./AdminDashboard";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsAndConditions from "./TermsAndConditions";
import RefundPolicy from "./RefundPolicy";
import LiveChat from "./LiveChat";
import { calculateOrderPricing } from "./promotions";

type View =
  | "home"
  | "order"
  | "admin-login"
  | "admin-dashboard"
  | "thanks"
  | "privacy"
  | "terms"
  | "refund";
type PackageType =
  | "Platinum"
  | "Diamond"
  | "Ruby"
  | "Sapphire"
  | "Basic"
  | "Premium"
  | "Gold"
  | "Window Sticker"
  | "Salvage Information"
  | "Service & Maintenance Records"
  | null;

const PACKAGE_PRICES: Record<string, number> = {
  Sapphire: 499.95,
  "Service & Maintenance Records": 399.99,
  Ruby: 239.95,
  "Salvage Information": 149.0,
  Diamond: 129.95,
  Platinum: 99.95,
  Premium: 99.95,
  Gold: 89.95,
  Basic: 44.95,
  "Window Sticker": 29.99,
};

export default function App() {
  const [view, setView] = useState<View>("home");
  const [showPromoPopup, setShowPromoPopup] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(null);
  const [includeWindowSticker, setIncludeWindowSticker] = useState(true);
  const [vinInput, setVinInput] = useState("");
  const [vinError, setVinError] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "United States",
  });
  const [policyAgreed, setPolicyAgreed] = useState(false);

  // Admin State
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem("adminAuth") === "true";
  });
  const [loginError, setLoginError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Centralized hash-based routing
  useEffect(() => {
    const parseHashAndSetState = (hash: string) => {
      const raw = decodeURIComponent(hash.replace("#", "")).trim().toLowerCase();
      const normalized = raw.replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

      switch (normalized) {
        case "platinum":
          setSelectedPackage("Platinum");
          setIncludeWindowSticker(true);
          setView("order");
          window.scrollTo(0, 0);
          break;
        case "diamond":
          setSelectedPackage("Diamond");
          setIncludeWindowSticker(true);
          setView("order");
          window.scrollTo(0, 0);
          break;
        case "ruby":
          setSelectedPackage("Ruby");
          setIncludeWindowSticker(false);
          setView("order");
          window.scrollTo(0, 0);
          break;
        case "sapphire":
        case "saphire":
          setSelectedPackage("Sapphire");
          setIncludeWindowSticker(false);
          setView("order");
          window.scrollTo(0, 0);
          break;
        case "basic":
          setSelectedPackage("Basic");
          setIncludeWindowSticker(true);
          setView("order");
          window.scrollTo(0, 0);
          break;
        case "gold":
          setSelectedPackage("Gold");
          setIncludeWindowSticker(true);
          setView("order");
          window.scrollTo(0, 0);
          break;
        case "premium":
          setSelectedPackage("Premium");
          setIncludeWindowSticker(true);
          setView("order");
          window.scrollTo(0, 0);
          break;
        case "window-sticker":
        case "windowsticker":
        case "window":
        case "sticker":
          setSelectedPackage("Window Sticker");
          setIncludeWindowSticker(false);
          setView("order");
          window.scrollTo(0, 0);
          break;
        case "salvage-information":
        case "salvageinformation":
        case "salvage":
          setSelectedPackage("Salvage Information");
          setIncludeWindowSticker(false);
          setView("order");
          window.scrollTo(0, 0);
          break;
        case "service-maintenance-records":
        case "service-maintenance":
        case "servicemaintenance":
        case "service":
          setSelectedPackage("Service & Maintenance Records");
          setIncludeWindowSticker(false);
          setView("order");
          window.scrollTo(0, 0);
          break;
        case "admin":
          if (localStorage.getItem("adminAuth") === "true") {
            setIsAdminAuthenticated(true);
            setView("admin-dashboard");
          } else {
            setView("admin-login");
          }
          window.scrollTo(0, 0);
          break;
        case "privacy":
          setView("privacy");
          window.scrollTo(0, 0);
          break;
        case "terms":
          setView("terms");
          window.scrollTo(0, 0);
          break;
        case "refund":
          setView("refund");
          window.scrollTo(0, 0);
          break;
        case "thanks":
          setView("thanks");
          window.scrollTo(0, 0);
          break;
        default:
          setView("home");
          if (
            normalized === "about" ||
            normalized === "pricing" ||
            normalized === "comparison"
          ) {
            setTimeout(() => {
              const element = document.getElementById(normalized);
              if (element) {
                const offset = 80; // Navbar height
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = element.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth",
                });
              }
            }, 150);
          } else if (!normalized) {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          break;
      }
    };

    const handleHashChange = () => {
      parseHashAndSetState(window.location.hash);
    };

    window.addEventListener("hashchange", handleHashChange);

    // Initial check on page load
    parseHashAndSetState(window.location.hash);

    // Check for Stripe Checkout redirect parameters
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      const sessionId = query.get("session_id");
      if (sessionId) {
        fetch(`/api/orders/${sessionId}/confirm-payment`, {
          method: "POST",
        }).catch((e) => console.warn("Failed to confirm payment status:", e));
      }
      window.location.hash = "thanks";
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.hash,
      );
    } else if (query.get("canceled")) {
      alert("Payment was canceled. You can try again when you're ready.");
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.hash,
      );
    }

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      adminEmail === "AllVinReport@gmail.com" &&
      adminPassword === "AllVinReport@!"
    ) {
      localStorage.setItem("adminAuth", "true");
      setIsAdminAuthenticated(true);
      setView("admin-dashboard");
      setLoginError("");
    } else {
      setLoginError("Invalid credentials. Access denied.");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminAuth");
    setIsAdminAuthenticated(false);
    setView("home");
    setAdminEmail("");
    setAdminPassword("");
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyAgreed) {
      alert("You must agree to the Policies, Terms & Conditions to proceed.");
      return;
    }
    setIsCheckoutLoading(true);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName: selectedPackage || "Basic",
          includeWindowSticker:
            selectedPackage !== "Window Sticker" ? includeWindowSticker : false,
          vin: vinInput,
          policyAgreed,
          ...formData,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initiate checkout.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("An error occurred during checkout. Please try again.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const navigateToOrder = (pkg: PackageType = null, bypassCheck = false) => {
    if (!bypassCheck && !vinInput.trim()) {
      setVinError(true);
      // Reset error after animation
      setTimeout(() => setVinError(false), 2000);
      return;
    }
    setPolicyAgreed(false);
    const targetPkg = pkg || "Basic";
    const isPromoPackage = ["Basic", "Gold", "Platinum", "Diamond", "Premium"].includes(targetPkg);
    setIncludeWindowSticker(isPromoPackage);
    const targetHash = targetPkg
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    window.location.hash = targetHash;
  };

  const navigateToHome = () => {
    setPolicyAgreed(false);
    window.location.hash = "";
  };

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    id: string,
  ) => {
    if (e) e.preventDefault();
    if (window.location.hash === `#${id}`) {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80; // Navbar height
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    } else {
      window.location.hash = id;
    }
  };

  const currentPackageName = selectedPackage || "Basic";
  const pricing = calculateOrderPricing(
    currentPackageName,
    includeWindowSticker
  );

  return (
    <div className="min-h-screen font-sans selection:bg-brand-accent selection:text-white bg-white">
      <LiveChat disabled={view === "admin-dashboard"} />

      {/* Promotional Offers Entry Popup Announcement */}
      <AnimatePresence>
        {showPromoPopup && view === "home" && (
          <div
            onClick={() => setShowPromoPopup(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[390px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
            >
              {/* Top Accent Bar */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />

              {/* Close Button */}
              <button
                onClick={() => setShowPromoPopup(false)}
                className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer z-10"
                aria-label="Close promotional announcement"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-3.5 sm:p-4.5 space-y-2.5 sm:space-y-3">
                {/* Header */}
                <div className="text-center px-6 sm:px-8 space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <Zap className="w-3 h-3" />
                    Special Promotion
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">
                    Special Offer: Add a Window Sticker at a Discounted Price
                  </h3>
                  <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium">
                    Offer applies to the Window Sticker add-on only. Your report price remains unchanged.
                  </p>
                </div>

                {/* 2x2 Clean Compact Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {/* Basic */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPromoPopup(false);
                      navigateToOrder("Basic", true);
                    }}
                    className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between text-left hover:border-blue-400 hover:bg-blue-50/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-blue-600 font-black text-base sm:text-lg tracking-tight leading-none">
                          25% OFF Window Sticker
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <div className="font-bold text-slate-900 text-xs sm:text-[13px] mt-1">
                        Basic
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                      + Window Sticker
                    </div>
                  </button>

                  {/* Gold */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPromoPopup(false);
                      navigateToOrder("Gold", true);
                    }}
                    className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-50/40 border border-amber-200/70 flex flex-col justify-between text-left hover:border-amber-400 hover:bg-amber-50/60 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-amber-600 font-black text-base sm:text-lg tracking-tight leading-none">
                          50% OFF Window Sticker
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <div className="font-bold text-slate-900 text-xs sm:text-[13px] mt-1">
                        Gold
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                      + Window Sticker
                    </div>
                  </button>

                  {/* Platinum */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPromoPopup(false);
                      navigateToOrder("Platinum", true);
                    }}
                    className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50/50 border border-emerald-200/70 flex flex-col justify-between text-left hover:border-emerald-400 hover:bg-emerald-50/70 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-emerald-600 font-black text-base sm:text-lg tracking-tight leading-none">
                          FREE Window Sticker
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <div className="font-bold text-slate-900 text-xs sm:text-[13px] mt-1">
                        Platinum
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold mt-1 leading-snug">
                      + Window Sticker
                    </div>
                  </button>

                  {/* Diamond */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPromoPopup(false);
                      navigateToOrder("Diamond", true);
                    }}
                    className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border border-emerald-300 flex flex-col justify-between text-left hover:border-emerald-400 hover:from-emerald-50 hover:to-teal-50/80 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-emerald-700 font-black text-base sm:text-lg tracking-tight leading-none">
                          FREE Window Sticker
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <div className="font-bold text-slate-900 text-xs sm:text-[13px] mt-1">
                        Diamond
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold mt-1 leading-tight">
                      + Window Sticker<br />+ Salvage Information
                    </div>
                  </button>
                </div>

                {/* Footer & CTA */}
                <div className="space-y-1.5 pt-0.5">
                  <button
                    onClick={() => {
                      setShowPromoPopup(false);
                      const el = document.getElementById("pricing");
                      if (el) {
                        const offset = 80;
                        const bodyRect = document.body.getBoundingClientRect().top;
                        const elementRect = el.getBoundingClientRect().top;
                        const elementPosition = elementRect - bodyRect;
                        window.scrollTo({
                          top: elementPosition - offset,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="w-full py-2 sm:py-2.5 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-[13px] uppercase tracking-wider hover:bg-brand-accent transition-all shadow-md shadow-slate-900/10 active:scale-[0.98] cursor-pointer"
                  >
                    Explore Packages
                  </button>
                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    Announcement only. Window Sticker is optional on Basic &amp; Gold.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navbar - hidden on admin dashboard since it has its own header */}
      {view !== "admin-dashboard" && (
        <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={navigateToHome}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <img
                src="/allvinreport.jpeg"
                alt="AllVinReport Logo"
                className="h-10 md:h-11 w-auto object-contain"
              />
              <span className="text-2xl md:text-2xl font-black text-slate-900 tracking-tighter">
                All VIN REPORT
              </span>
            </motion.button>

            {view === "home" ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:flex items-center gap-10 text-[15px] font-bold text-slate-500"
              >
                <a
                  href="#about"
                  onClick={(e) => scrollToSection(e, "about")}
                  className="hover:text-brand-accent transition-colors relative group"
                >
                  About
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-accent transition-all group-hover:w-full" />
                </a>
                <a
                  href="#pricing"
                  onClick={(e) => scrollToSection(e, "pricing")}
                  className="hover:text-brand-accent transition-colors relative group"
                >
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-accent transition-all group-hover:w-full" />
                </a>
                <a
                  href="#comparison"
                  onClick={(e) => scrollToSection(e, "comparison")}
                  className="hover:text-brand-accent transition-colors relative group"
                >
                  Comparison
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-accent transition-all group-hover:w-full" />
                </a>
                <button
                  onClick={() => navigateToOrder("Basic", true)}
                  className="bg-slate-900 text-white px-7 py-3 rounded-2xl hover:bg-brand-accent transition-all hover:shadow-2xl hover:shadow-brand-accent/30 font-black text-sm uppercase tracking-wider"
                >
                  Check VIN
                </button>
              </motion.div>
            ) : (
              <button
                onClick={navigateToHome}
                className="hidden md:flex items-center gap-2 text-sm font-black text-brand-accent hover:text-brand-accent-hover transition-colors uppercase tracking-widest"
              >
                <ChevronLeft className="w-4 h-4" />
                Home
              </button>
            )}

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5 text-slate-700" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5 text-slate-700" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* Mobile dropdown menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-slate-100"
              >
                <div className="max-w-7xl mx-auto px-6 py-6 space-y-2">
                  {view === "home" ? (
                    <>
                      {[
                        { label: "About", id: "about" },
                        { label: "Pricing", id: "pricing" },
                        { label: "Comparison", id: "comparison" },
                      ].map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => {
                            scrollToSection(e, item.id);
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-700 font-bold text-[15px] hover:bg-brand-accent/5 hover:text-brand-accent transition-all active:scale-[0.98]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent/40" />
                          {item.label}
                        </a>
                      ))}
                      <div className="pt-3">
                        <button
                          onClick={() => {
                            navigateToOrder("Basic", true);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-brand-accent transition-all shadow-xl shadow-brand-accent/10 active:scale-[0.98]"
                        >
                          Check VIN
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          navigateToHome();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-brand-accent font-black text-[15px] hover:bg-brand-accent/5 transition-all w-full active:scale-[0.98]"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Home
                      </button>
                      <div className="pt-3">
                        <button
                          onClick={() => {
                            navigateToOrder("Basic", true);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full bg-brand-accent text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/10 active:scale-[0.98]"
                        >
                          Checkout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      )}

      <AnimatePresence mode="wait">
        {view === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <main className="pt-20">
              {/* Top Quick VIN Lookup Bar under Header */}
              <div className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 py-3 px-4 sm:px-6 relative z-30 shadow-lg shadow-black/20">
                <div className="max-w-4xl mx-auto">
                  <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-r from-blue-500/30 via-indigo-500/40 to-blue-500/30 shadow-xl shadow-blue-950/30 hover:from-blue-500/50 hover:via-indigo-500/60 hover:to-blue-500/50 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row gap-3 p-1.5 sm:p-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl">
                      <div
                        className={`flex-1 flex items-center gap-3.5 px-4 py-2.5 sm:py-3 rounded-xl transition-all ${
                          vinError
                            ? "bg-red-950/50 border border-red-500/80 ring-2 ring-red-500/40"
                            : "bg-slate-800/80 border border-slate-700/70 hover:border-slate-600 focus-within:border-blue-500 focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500/30"
                        }`}
                      >
                        <Car
                          className={`w-5 h-5 shrink-0 ${vinError ? "text-red-400" : "text-blue-400"}`}
                        />
                        <input
                          type="text"
                          value={vinInput}
                          onChange={(e: { target: { value: any } }) => {
                            setVinInput(e.target.value);
                            if (vinError) setVinError(false);
                          }}
                          placeholder={
                            vinError
                              ? "VIN IS REQUIRED"
                              : "Enter 17-digit VIN number"
                          }
                          className="w-full bg-transparent outline-none text-white font-bold placeholder:text-slate-400 text-sm sm:text-base tracking-wide uppercase"
                        />
                      </div>
                      <button
                        onClick={() => navigateToOrder()}
                        className={`${
                          vinError
                            ? "bg-red-600 hover:bg-red-500"
                            : "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/25"
                        } text-white px-7 py-2.5 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 group active:scale-95 whitespace-nowrap`}
                      >
                        Get Report
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Section */}
              <section className="relative overflow-hidden section-padding bg-mesh lg:min-h-[90vh] flex items-center">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-accent/[0.03] -skew-x-12 translate-x-1/4" />
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-10"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-brand-accent/10 rounded-full text-brand-accent text-[11px] font-black tracking-[0.1em] uppercase"
                    >
                      <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
                      Trusted by 50,000+ car buyers
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.95] tracking-tighter">
                      Know the{" "}
                      <span className="text-brand-accent">history</span> before
                      you buy.
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-500 max-w-xl leading-relaxed font-medium">
                      Unlock detailed vehicle reports, accident history, and
                      ownership records in seconds. Don't risk your investment.
                    </p>

                    <div className="flex flex-wrap items-center gap-8 text-[13px] text-slate-400 font-bold uppercase tracking-widest pt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <History className="w-4 h-4 text-slate-500" />
                        </div>
                        Instant Delivery
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <BadgeCheck className="w-4 h-4 text-brand-accent" />
                        </div>
                        100% Secure
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className="hidden lg:block relative"
                  >
                    <div className="absolute -inset-4 bg-brand-accent/20 blur-[100px] rounded-full animate-pulse-soft" />
                    <div className="relative z-10 animate-float">
                      <img
                        src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2070"
                        alt="Luxury Car"
                        className="rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] brightness-105"
                        referrerPolicy="no-referrer"
                      />
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="absolute -bottom-10 -left-10 glass-card p-7 rounded-3xl z-20 border border-white/40"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                            <CheckCircle2 className="text-white w-8 h-8" />
                          </div>
                          <div>
                            <div className="text-lg font-black text-slate-900 leading-none mb-1">
                              Report Ready
                            </div>
                            <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                              VIN Verified • 2m ago
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* 3 Steps Section */}
              <section className="section-padding bg-white relative">
                <div className="max-w-7xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center space-y-5 mb-20 md:mb-28"
                  >
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
                      How it <span className="text-brand-accent">Works</span>
                    </h2>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
                      Getting your vehicle history report is simple, fast, and
                      secure.
                    </p>
                  </motion.div>

                  <div className="grid md:grid-cols-3 gap-10">
                    {[
                      {
                        step: "01",
                        title: "Enter VIN",
                        text: "Enter the unique 17-digit Vehicle Identification Number located on the dashboard or insurance card.",
                        icon: Search,
                      },
                      {
                        step: "02",
                        title: "Choose Package",
                        text: "Select the report package that fits your needs. We offer Platinum, Diamond, Ruby, and Sapphire options.",
                        icon: Zap,
                      },
                      {
                        step: "03",
                        title: "Get Report",
                        text: "Instantly download your comprehensive report. Check records, damage history, and more.",
                        icon: History,
                      },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.2 }}
                        whileHover={{ y: -10 }}
                        className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-brand-accent/20 transition-all cursor-default group"
                      >
                        <div className="text-6xl font-black text-slate-200 mb-8 transition-colors group-hover:text-brand-accent/10">
                          {item.step}
                        </div>
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-slate-200 group-hover:bg-brand-accent transition-colors">
                          <item.icon className="text-brand-accent w-8 h-8 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 text-[15px] leading-relaxed font-medium">
                          {item.text}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* About Us Section */}
              <section
                id="about"
                className="section-padding bg-slate-900 overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.1),transparent)]" />
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                  <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <img
                        src="https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=1000"
                        alt="Car Inspection"
                        className="rounded-[2rem] shadow-2xl mt-12 border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                      <img
                        src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000"
                        alt="Checking Engine"
                        className="rounded-[2rem] shadow-2xl border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-brand-accent rounded-full flex items-center justify-center border-[12px] border-slate-900 shadow-2xl shadow-brand-accent/40 animate-pulse-soft">
                      <ShieldCheck className="text-white w-12 h-12" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="space-y-10"
                  >
                    <div className="space-y-5">
                      <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-[0.95]">
                        Transparent{" "}
                        <span className="text-brand-accent">Intelligence</span>
                      </h2>
                      <div className="w-24 h-2 bg-brand-accent rounded-full" />
                    </div>
                    <p className="text-slate-400 text-xl leading-relaxed font-medium">
                      At All VIN REPORT, we believe every car buyer deserves the
                      full picture. Our mission is to provide accurate,
                      real-time vehicle data that protects you from hidden
                      damage, odometer fraud, and title scams.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {[
                        "Official NMVTIS partner data",
                        "Over 9,000+ data sources globally",
                        "Exhaustive title and salvage checks",
                        "Ownership and auction history",
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 group"
                        >
                          <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0 group-hover:bg-brand-accent transition-colors">
                            <CheckCircle2 className="text-brand-accent w-4 h-4 group-hover:text-white transition-colors" />
                          </div>
                          <span className="text-slate-300 font-bold text-sm tracking-wide">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* Pricing Section */}
              <section id="pricing" className="section-padding bg-slate-50">
                <div className="max-w-7xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center space-y-5 mb-24"
                  >
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
                      Simple <span className="text-brand-accent">Pricing</span>
                    </h2>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
                      Choose the level of detail that fits your vehicle
                      inspection needs.
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
                    {[
                      {
                        name: "Basic",
                        type: "Basic" as PackageType,
                        price: "$44.95",
                        features: [
                          { text: "1 Vehicle Report", enabled: true },
                          { text: "Ownership Costs", enabled: true },
                          { text: "Accident Information", enabled: true },
                          { text: "Market Value Range", enabled: true },
                          { text: "Owner's History", enabled: true },
                          { text: "Vehicle Specification", enabled: false },
                          { text: "Safety Recall Status", enabled: false },
                          { text: "Online Listing History", enabled: false },
                          { text: "Warranties", enabled: false },
                          { text: "Salvage Information", enabled: false },
                          { text: "Installed Equipment", enabled: false },
                        ],
                        popular: false,
                      },
                      {
                        name: "Gold",
                        type: "Gold" as PackageType,
                        price: "$89.95",
                        features: [
                          { text: "Ownership Costs", enabled: true },
                          { text: "Accident Information", enabled: true },
                          { text: "Market Value Range", enabled: true },
                          { text: "Owner's History", enabled: true },
                          { text: "Vehicle Specification", enabled: true },
                          { text: "Safety Recall Status", enabled: true },
                          { text: "Online Listing History", enabled: false },
                          { text: "Warranties", enabled: false },
                          { text: "Salvage Information", enabled: false },
                          { text: "Installed Equipment", enabled: false },
                        ],
                        popular: false,
                      },
                      {
                        name: "Platinum",
                        type: "Platinum" as PackageType,
                        price: "$99.95",
                        features: [
                          { text: "3 Vehicle Report", enabled: true },
                          { text: "Ownership Costs", enabled: true },
                          { text: "Accident Information", enabled: true },
                          { text: "Market Value Range", enabled: true },
                          { text: "Owner's History", enabled: true },
                          { text: "Vehicle Specifications", enabled: true },
                          { text: "Safety Recall Status", enabled: true },
                          { text: "Online Listing History", enabled: false },
                          { text: "Warranties", enabled: false },
                          { text: "Theft & Recovery Records", enabled: false },
                        ],
                        popular: false,
                      },
                      {
                        name: "Diamond",
                        type: "Diamond" as PackageType,
                        price: "$129.95",
                        features: [
                          { text: "Ownership Costs", enabled: true },
                          { text: "Accident Information", enabled: true },
                          { text: "Market Value Range", enabled: true },
                          { text: "Owner's History", enabled: true },
                          { text: "Vehicle Specifications", enabled: true },
                          { text: "Safety Recall Status", enabled: true },
                          { text: "Online Listing History", enabled: true },
                          { text: "Warranties", enabled: false },
                          { text: "Theft & Recovery Records", enabled: false },
                        ],
                        popular: false,
                      },
                      {
                        name: "Ruby",
                        type: "Ruby" as PackageType,
                        price: "$239.95",
                        features: [
                          { text: "Ownership Costs", enabled: true },
                          { text: "Accident Information", enabled: true },
                          { text: "Market Value Range", enabled: true },
                          { text: "Owner's History", enabled: true },
                          { text: "Vehicle Specifications", enabled: true },
                          { text: "Safety Recall Status", enabled: true },
                          { text: "Online Listing History", enabled: true },
                          { text: "Warranties", enabled: true },
                          { text: "Theft & Recovery Records", enabled: false },
                        ],
                        popular: true,
                      },
                      {
                        name: "Sapphire",
                        type: "Sapphire" as PackageType,
                        price: "$499.95",
                        features: [
                          { text: "Get Two Buyer Numbers", enabled: true },
                          { text: "Ownership Costs", enabled: true },
                          { text: "Accident Information", enabled: true },
                          { text: "Market Value Range", enabled: true },
                          { text: "Owner's History", enabled: true },
                          { text: "Vehicle Specifications", enabled: true },
                          { text: "Safety Recall Status", enabled: true },
                          { text: "Online Listing History", enabled: true },
                          { text: "Warranties", enabled: true },
                          { text: "Theft & Recovery Records", enabled: true },
                        ],
                        popular: false,
                      },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        id={item.name.toLowerCase()}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (idx % 3) * 0.12 }}
                        whileHover={{ y: -10 }}
                        className={`relative p-6 sm:p-8 lg:p-10 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] border-2 transition-all flex flex-col justify-between ${
                          item.popular
                            ? "bg-slate-900 text-white border-transparent shadow-[0_40px_80px_-15px_rgba(15,23,42,0.3)] py-8 sm:py-10 lg:py-12 z-10"
                            : "bg-white text-slate-900 border-slate-100 hover:border-brand-accent/20"
                        }`}
                      >
                        {item.popular && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-brand-accent text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-accent/20">
                            Most Popular
                          </div>
                        )}
                        <div className="space-y-5 sm:space-y-6 flex flex-col h-full justify-between">
                          <div className="space-y-5 sm:space-y-6">
                            <div className="space-y-2 sm:space-y-3">
                              <h3
                                className={`text-lg sm:text-xl font-black uppercase tracking-widest ${item.popular ? "text-brand-accent" : "text-slate-400"}`}
                              >
                                {item.name}
                              </h3>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl sm:text-4xl lg:text-4xl 2xl:text-5xl font-black tracking-tighter">
                                  {item.price}
                                </span>
                                <span
                                  className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${item.popular ? "text-slate-400" : "text-slate-400"}`}
                                >
                                  /report
                                </span>
                              </div>
                            </div>

                            <div
                              className={`h-px w-full ${item.popular ? "bg-slate-800" : "bg-slate-100"}`}
                            />

                            <ul className="space-y-2.5 sm:space-y-3 min-h-0 lg:min-h-[280px]">
                              {item.features.map((feature, fIdx) => (
                                <li
                                  key={fIdx}
                                  className={`flex items-start gap-2.5 sm:gap-3 text-[13px] xl:text-[14px] font-bold ${!feature.enabled ? "opacity-45" : ""}`}
                                >
                                  {feature.enabled ? (
                                    <CheckCircle2
                                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${item.popular ? "text-brand-accent" : "text-slate-900"}`}
                                    />
                                  ) : (
                                    <XCircle
                                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${item.popular ? "text-slate-500" : "text-slate-300"}`}
                                    />
                                  )}
                                  <span
                                    className={
                                      item.popular
                                        ? "text-slate-300"
                                        : "text-slate-600"
                                    }
                                  >
                                    {feature.text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <button
                            onClick={() => {
                              navigateToOrder(item.type, true);
                            }}
                            className={`w-full py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl font-black text-sm lg:text-base transition-all active:scale-95 mt-6 ${
                              item.popular
                                ? "bg-brand-accent text-white hover:bg-brand-accent-hover shadow-xl shadow-brand-accent/20"
                                : "bg-slate-900 text-white hover:bg-brand-accent shadow-xl shadow-slate-900/10"
                            }`}
                          >
                            Get {item.name}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Window Sticker, Service & Maintenance Records and Salvage Information Section */}
              <section id="specialized-reports" className="section-padding bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center space-y-5 mb-20 md:mb-24"
                  >
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter max-w-4xl mx-auto leading-tight">
                      Window Sticker, Service & Maintenance Records and <span className="text-brand-accent">Salvage Information</span>
                    </h2>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
                      Specialized automotive verification reports and original OEM documentation.
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
                    {[
                      {
                        name: "Window Sticker",
                        type: "Window Sticker" as PackageType,
                        price: "$29.99",
                        features: [
                          { text: "Vehicle Window Label Verification", enabled: true },
                          { text: "Includes Window Label", enabled: true },
                          { text: "Digital Delivery", enabled: true },
                          { text: "Fast Turnaround", enabled: true },
                          { text: "Covers Most Vehicles", enabled: true },
                          { text: "Accurate OEM Information", enabled: true },
                          { text: "Easy to Access", enabled: true },
                        ],
                        popular: false,
                      },
                      {
                        name: "Salvage Information",
                        type: "Salvage Information" as PackageType,
                        price: "$149",
                        features: [
                          { text: "Repair Cost Value", enabled: true },
                          { text: "Road Legal", enabled: true },
                          { text: "Rebuilt Status", enabled: true },
                          { text: "Low Resale Value", enabled: true },
                          { text: "Financing Hurdles", enabled: true },
                        ],
                        popular: false,
                      },
                      {
                        name: "Service & Maintenance Records",
                        type: "Service & Maintenance Records" as PackageType,
                        price: "$399.99",
                        features: [
                          { text: "Service History Timeline", enabled: true },
                          { text: "Total Maintenance Cost", enabled: true },
                          { text: "Service Frequency", enabled: true },
                          { text: "Vehicle Health Report", enabled: true },
                          { text: "Cost Tracking & Documentation", enabled: true },
                        ],
                        popular: true,
                      },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        id={item.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.15 }}
                        whileHover={{ y: -10 }}
                        className={`relative p-6 sm:p-8 lg:p-10 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] border-2 transition-all flex flex-col justify-between ${
                          item.popular
                            ? "bg-slate-900 text-white border-transparent shadow-[0_40px_80px_-15px_rgba(15,23,42,0.3)] py-8 sm:py-10 lg:py-12 z-10"
                            : "bg-white text-slate-900 border-slate-100 hover:border-brand-accent/20"
                        }`}
                      >
                        {item.popular && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-brand-accent text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-accent/20">
                            Most Popular
                          </div>
                        )}
                        <div className="space-y-5 sm:space-y-6 flex flex-col h-full justify-between">
                          <div className="space-y-5 sm:space-y-6">
                            <div className="space-y-2 sm:space-y-3">
                              <h3
                                className={`text-lg sm:text-xl font-black uppercase tracking-widest ${item.popular ? "text-brand-accent" : "text-slate-400"}`}
                              >
                                {item.name}
                              </h3>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl sm:text-4xl lg:text-4xl 2xl:text-5xl font-black tracking-tighter">
                                  {item.price}
                                </span>
                                <span
                                  className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${item.popular ? "text-slate-400" : "text-slate-400"}`}
                                >
                                  /report
                                </span>
                              </div>
                            </div>

                            <div
                              className={`h-px w-full ${item.popular ? "bg-slate-800" : "bg-slate-100"}`}
                            />

                            <ul className="space-y-2.5 sm:space-y-3 min-h-0 lg:min-h-[220px]">
                              {item.features.map((feature, fIdx) => (
                                <li
                                  key={fIdx}
                                  className="flex items-start gap-2.5 sm:gap-3 text-[13px] xl:text-[14px] font-bold"
                                >
                                  <CheckCircle2
                                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${item.popular ? "text-brand-accent" : "text-slate-900"}`}
                                  />
                                  <span
                                    className={
                                      item.popular
                                        ? "text-slate-300"
                                        : "text-slate-600"
                                    }
                                  >
                                    {feature.text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <button
                            onClick={() => {
                              navigateToOrder(item.type, true);
                            }}
                            className={`w-full py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl font-black text-sm lg:text-base transition-all active:scale-95 mt-6 ${
                              item.popular
                                ? "bg-brand-accent text-white hover:bg-brand-accent-hover shadow-xl shadow-brand-accent/20"
                                : "bg-slate-900 text-white hover:bg-brand-accent shadow-xl shadow-slate-900/10"
                            }`}
                          >
                            Get {item.name}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Comparison Section */}
              <section
                id="comparison"
                className="section-padding bg-white overflow-hidden"
              >
                <div className="max-w-7xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center space-y-5 mb-24"
                  >
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
                      Market{" "}
                      <span className="text-brand-accent">Comparison</span>
                    </h2>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
                      See how we stack up against the competition in value and
                      detail.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="overflow-x-auto pb-8 -mx-6 px-6"
                  >
                    <table className="w-full min-w-[800px] text-left border-separate border-spacing-y-4">
                      <thead>
                        <tr className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
                          <th className="px-10 py-4">Feature</th>
                          <th className="px-10 py-4 text-brand-accent">
                            All VIN REPORT
                          </th>
                          <th className="px-10 py-4">CarFax</th>
                          <th className="px-10 py-4">AutoCheck</th>
                          <th className="px-10 py-4">InstaVIN</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-4">
                        {[
                          {
                            feature: "Price per Report",
                            us: "$99.95",
                            f1: "$129.99",
                            f2: "$149.99",
                            f3: "$189.99",
                          },
                          {
                            feature: "NMVTIS Data",
                            us: true,
                            f1: true,
                            f2: true,
                            f3: true,
                          },
                          {
                            feature: "Auction Photos",
                            us: true,
                            f1: false,
                            f2: false,
                            f3: false,
                          },
                          {
                            feature: "Instant Delivery",
                            us: true,
                            f1: true,
                            f2: true,
                            f3: true,
                          },
                          {
                            feature: "Live Market Value",
                            us: true,
                            f1: false,
                            f2: true,
                            f3: false,
                          },
                          {
                            feature: "Theft Records",
                            us: true,
                            f1: true,
                            f2: true,
                            f3: true,
                          },
                        ].map((row, idx) => (
                          <tr
                            key={idx}
                            className="bg-slate-50 rounded-3xl group hover:bg-slate-100 transition-colors"
                          >
                            <td className="px-10 py-7 font-black text-slate-900 rounded-l-[2rem]">
                              {row.feature}
                            </td>
                            <td className="px-10 py-7 text-emerald-500 font-black">
                              {/* Modified output logic for visual clarity */}
                              {typeof row.us === "boolean" ? (
                                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                              ) : (
                                <span className="text-xl tracking-tighter text-emerald-600">
                                  {row.us}
                                </span>
                              )}
                            </td>
                            <td className="px-10 py-7 text-slate-400 font-bold">
                              {typeof row.f1 === "boolean" ? (
                                row.f1 ? (
                                  <CheckCircle2 className="w-6 h-6 text-emerald-500/60" />
                                ) : (
                                  <XCircle className="w-6 h-6 text-rose-500/60" />
                                )
                              ) : (
                                row.f1
                              )}
                            </td>
                            <td className="px-10 py-7 text-slate-400 font-bold">
                              {typeof row.f2 === "boolean" ? (
                                row.f2 ? (
                                  <CheckCircle2 className="w-6 h-6 text-emerald-500/60" />
                                ) : (
                                  <XCircle className="w-6 h-6 text-rose-500/60" />
                                )
                              ) : (
                                row.f2
                              )}
                            </td>
                            <td className="px-10 py-7 text-slate-400 font-bold rounded-r-[2rem]">
                              {typeof row.f3 === "boolean" ? (
                                row.f3 ? (
                                  <CheckCircle2 className="w-6 h-6 text-emerald-500/60" />
                                ) : (
                                  <XCircle className="w-6 h-6 text-rose-500/60" />
                                )
                              ) : (
                                row.f3
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                </div>
              </section>

              {/* Disclaimer Section */}
              <section className="section-padding bg-slate-900 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-brand-accent/[0.05]" />
                <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                  <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-white/10">
                    <Info className="w-4 h-4 text-brand-accent" /> Important
                    Disclaimer
                  </div>
                  <div className="text-slate-400 text-base md:text-lg leading-relaxed font-medium opacity-80 italic space-y-4 max-w-3xl mx-auto">
                    <p>
                      Information contained in our reports is compiled from
                      various independent sources and is provided "as is"
                      without any warranty, expressed or implied. While we
                      strive for accuracy, All VIN REPORT does not guarantee the
                      completeness or accuracy of the information provided. We
                      are not responsible for any errors or omissions.
                    </p>
                    <p>
                      Our reports are intended for informational purposes only
                      and should not be used as the sole basis for purchasing or
                      selling any vehicle, vessel, or equipment.
                    </p>
                    <p>
                      Always verify critical information with official records
                      or the relevant authorities.
                    </p>
                  </div>
                </div>
              </section>
            </main>
          </motion.div>
        ) : view === "admin-login" ? (
          <motion.div
            key="admin-login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pt-40 pb-20 px-6 min-h-screen bg-slate-50 flex items-center justify-center"
          >
            <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
              <div className="text-center space-y-4 mb-10">
                <div className="w-16 h-16 bg-brand-accent rounded-[1.5rem] flex items-center justify-center mx-auto shadow-xl shadow-brand-accent/20">
                  <Lock className="text-white w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Admin Login
                </h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                  Secure Access Required
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@AllVinReport.com"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-accent/50 focus:bg-white transition-all text-slate-900 font-bold"
                    />
                    <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-accent/50 focus:bg-white transition-all text-slate-900 font-bold"
                    />
                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  </div>
                </div>

                {loginError && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-500 text-xs font-bold text-center uppercase tracking-widest"
                  >
                    {loginError}
                  </motion.p>
                )}

                <button
                  type="submit"
                  className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg hover:bg-brand-accent transition-all shadow-xl shadow-brand-accent/10 active:scale-[0.98]"
                >
                  Sign In
                </button>
              </form>
            </div>
          </motion.div>
        ) : view === "admin-dashboard" && isAdminAuthenticated ? (
          <motion.div
            key="admin-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminDashboard onLogout={handleAdminLogout} />
          </motion.div>
        ) : view === "thanks" ? (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="pt-32 pb-24 px-6 min-h-[80vh] flex items-center justify-center bg-white"
          >
            <div className="max-w-xl w-full bg-white p-12 md:p-16 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none" />
              <div className="w-28 h-28 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 mb-10 group-hover:scale-110 transition-transform duration-500">
                <CheckCircle2 className="w-14 h-14 text-emerald-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6">
                Thank You!
              </h1>
              <div className="h-1 w-16 bg-emerald-500/20 rounded-full mx-auto mb-6" />
              <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-10">
                Payment completed successfully. Your report will be sent to your
                E-mail within{" "}
                <strong className="text-slate-900">20 to 30 minutes</strong>.
              </p>
              <button
                onClick={navigateToHome}
                className="inline-flex items-center justify-center bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-brand-accent transition-all shadow-xl shadow-brand-accent/10 active:scale-95"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        ) : view === "privacy" ? (
          <PrivacyPolicy key="privacy" onBack={navigateToHome} />
        ) : view === "terms" ? (
          <TermsAndConditions key="terms" onBack={navigateToHome} />
        ) : view === "refund" ? (
          <RefundPolicy key="refund" onBack={navigateToHome} />
        ) : (
          <motion.div
            key="order"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pt-24 pb-20 px-6"
          >
            <div className="max-w-4xl mx-auto">
              <div className="grid lg:grid-cols-5 gap-12">
                {/* Form Side */}
                <div className="lg:col-span-3 space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-4xl font-black text-brand-blue tracking-tight">
                      Complete Your Order
                    </h1>
                    <p className="text-slate-500">
                      Please provide your details below to process your vehicle
                      history report.
                    </p>
                  </div>

                  <form onSubmit={handleCheckout} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                          First Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e: { target: { value: any } }) =>
                            setFormData({
                              ...formData,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="John"
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue/50 focus:bg-white transition-all text-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                          Last Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="Doe"
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue/50 focus:bg-white transition-all text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="john@example.com"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue/50 focus:bg-white transition-all text-slate-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">
                        VIN Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={vinInput}
                          onChange={(e) => setVinInput(e.target.value)}
                          placeholder="17-character VIN"
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue/50 focus:bg-white transition-all text-slate-800 pl-12"
                        />
                        <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                          Phone Number (USA)
                        </label>
                        <div className="flex">
                          <span className="flex items-center justify-center px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-600 font-bold">
                            +1
                          </span>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            placeholder="(555) 000-0000"
                            className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-r-xl outline-none focus:border-brand-blue/50 focus:bg-white transition-all text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                          Country
                        </label>
                        <div className="relative">
                          <select
                            value={formData.country}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                country: e.target.value,
                              })
                            }
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue/50 focus:bg-white transition-all text-slate-800 appearance-none pl-12"
                          >
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="Australia">Australia</option>
                            <option value="Netherlands">Netherlands</option>
                          </select>
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Window Sticker Add-on Section */}
                    {selectedPackage !== "Window Sticker" && (
                      <div
                        className={`p-5 sm:p-6 rounded-2xl border-2 transition-all ${
                          pricing.windowStickerIncluded
                            ? "bg-slate-50/90 border-brand-accent/40 shadow-sm"
                            : "bg-slate-50/40 border-slate-200 opacity-75"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <input
                              type="checkbox"
                              id="windowStickerAddonCheckbox"
                              checked={pricing.windowStickerIncluded}
                              disabled={pricing.packageTier === "platinum" || pricing.packageTier === "diamond"}
                              onChange={(e) =>
                                setIncludeWindowSticker(e.target.checked)
                              }
                              className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-accent focus:ring-brand-accent cursor-pointer accent-brand-accent disabled:opacity-80"
                            />
                            <label
                              htmlFor="windowStickerAddonCheckbox"
                              className="cursor-pointer select-none"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-black text-slate-900 text-base">
                                  {pricing.packageTier === "diamond"
                                    ? "Window Sticker & Salvage Information"
                                    : "Window Sticker"}
                                </span>
                                {pricing.packageTier === "diamond" && (
                                  <span className="bg-emerald-100 text-emerald-700 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    FREE with Diamond
                                  </span>
                                )}
                                {pricing.packageTier === "platinum" && (
                                  <span className="bg-emerald-100 text-emerald-700 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    FREE with Platinum
                                  </span>
                                )}
                                {pricing.packageTier === "gold" && pricing.windowStickerIncluded && (
                                  <span className="bg-emerald-100 text-emerald-700 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    50% Off Applied
                                  </span>
                                )}
                                {pricing.packageTier === "gold" && !pricing.windowStickerIncluded && (
                                  <span className="bg-blue-100 text-blue-700 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    50% Off Promo Available
                                  </span>
                                )}
                                {pricing.packageTier === "basic" && pricing.windowStickerIncluded && (
                                  <span className="bg-emerald-100 text-emerald-700 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    25% Off Applied
                                  </span>
                                )}
                                {pricing.packageTier === "basic" && !pricing.windowStickerIncluded && (
                                  <span className="bg-blue-100 text-blue-700 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    25% Off Promo Available
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1 font-medium">
                                {pricing.packageTier === "diamond"
                                  ? "Includes Official OEM Window Sticker ($29.99 Value) & Salvage / Total Loss Information ($149.00 Value) 100% FREE."
                                  : "Official vehicle window label verification & original OEM window sticker."}
                              </p>
                            </label>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-baseline gap-1.5 justify-end">
                              {pricing.packageTier === "diamond" ? (
                                <>
                                  <span className="text-xs text-slate-400 line-through font-bold">
                                    $178.99
                                  </span>
                                  <span className="text-xl font-black text-emerald-600">
                                    FREE
                                  </span>
                                </>
                              ) : pricing.packageTier === "platinum" ? (
                                <>
                                  <span className="text-xs text-slate-400 line-through font-bold">
                                    $29.99
                                  </span>
                                  <span className="text-xl font-black text-emerald-600">
                                    FREE
                                  </span>
                                </>
                              ) : pricing.packageTier === "gold" ? (
                                pricing.windowStickerIncluded ? (
                                  <>
                                    <span className="text-xs text-slate-400 line-through font-bold">
                                      $29.99
                                    </span>
                                    <span className="text-xl font-black text-emerald-600">
                                      $14.99
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xl font-black text-brand-blue">
                                    $29.99
                                  </span>
                                )
                              ) : pricing.packageTier === "basic" ? (
                                pricing.windowStickerIncluded ? (
                                  <>
                                    <span className="text-xs text-slate-400 line-through font-bold">
                                      $29.99
                                    </span>
                                    <span className="text-xl font-black text-emerald-600">
                                      $22.49
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xl font-black text-brand-blue">
                                    $29.99
                                  </span>
                                )
                              ) : (
                                <span className="text-xl font-black text-brand-blue">
                                  $29.99
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {pricing.windowStickerFinalPrice === 0 &&
                              (pricing.packageTier === "platinum" ||
                                pricing.packageTier === "diamond")
                                ? "Included"
                                : "/report"}
                            </span>
                          </div>
                        </div>

                        {/* Features list */}
                        <div className="mt-4 pt-3.5 border-t border-slate-200/70">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                            Features:
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {[
                              "Vehicle Window Label Verification",
                              "Includes Window Label",
                              "Digital Delivery",
                              "Fast Turnaround",
                              "Covers Most Vehicles",
                              "Accurate OEM Information",
                              "Easy to Access",
                              ...(pricing.packageTier === "diamond"
                                ? [
                                    "Salvage & Total Loss Records",
                                    "Insurance Total Loss History",
                                    "Structural Damage Verification",
                                  ]
                                : []),
                            ].map((feature, fIdx) => (
                              <div
                                key={fIdx}
                                className="flex items-center gap-2 text-xs font-semibold text-slate-700"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quick Toggle / State notice */}
                        <div className="mt-3.5 pt-3 border-t border-slate-200/50 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">
                            {pricing.packageTier === "diamond"
                              ? "Window Sticker & Salvage Information are included FREE with Diamond"
                              : pricing.packageTier === "platinum"
                                ? "Window Sticker is included FREE with Platinum"
                                : includeWindowSticker
                                  ? "Window Sticker is added to your order"
                                  : "Window Sticker removed"}
                          </span>
                          {pricing.packageTier !== "platinum" &&
                            pricing.packageTier !== "diamond" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setIncludeWindowSticker(!includeWindowSticker)
                                }
                                className={`font-bold transition-colors cursor-pointer ${
                                  includeWindowSticker
                                    ? "text-rose-500 hover:text-rose-600 hover:underline"
                                    : "text-brand-accent hover:text-brand-accent-hover hover:underline"
                                }`}
                              >
                                {includeWindowSticker
                                  ? "Remove Add-on"
                                  : pricing.packageTier === "gold"
                                    ? "+ Add Window Sticker ($14.99)"
                                    : "+ Add Window Sticker ($22.49)"}
                              </button>
                            )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        id="policyCheckbox"
                        required
                        checked={policyAgreed}
                        onChange={(e) => setPolicyAgreed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-brand-accent focus:ring-brand-accent cursor-pointer"
                      />
                      <label
                        htmlFor="policyCheckbox"
                        className="text-xs font-semibold text-slate-600 leading-relaxed select-none cursor-pointer"
                      >
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={() => {
                            window.location.hash = "privacy";
                          }}
                          className="text-brand-accent hover:underline font-bold inline cursor-pointer"
                        >
                          Privacy Policy
                        </button>
                        ,{" "}
                        <button
                          type="button"
                          onClick={() => {
                            window.location.hash = "terms";
                          }}
                          className="text-brand-accent hover:underline font-bold inline cursor-pointer"
                        >
                          Terms & Conditions
                        </button>
                        , and{" "}
                        <button
                          type="button"
                          onClick={() => {
                            window.location.hash = "refund";
                          }}
                          className="text-brand-accent hover:underline font-bold inline cursor-pointer"
                        >
                          Refund Policy
                        </button>
                        .
                      </label>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        // disabled={isCheckoutLoading}
                        disabled={isCheckoutLoading || !policyAgreed}
                        className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black text-lg hover:bg-brand-accent transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCheckoutLoading ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            Secure Checkout
                            <Lock className="w-5 h-5" />
                          </>
                        )}
                      </button>
                      <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed italic">
                        All payments are processed securely. Due to digital
                        delivery, all sales are final.
                      </p>
                    </div>
                  </form>
                </div>

                {/* Summary Side */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-8 bg-brand-light-blue rounded-[2.5rem] space-y-6 sticky top-24 border border-brand-blue/5">
                    <h3 className="text-xl font-bold text-brand-blue">
                      Order Summary
                    </h3>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Selected Package</span>
                        <div className="text-right">
                          <span className="font-bold text-brand-blue block">
                            {pricing.packageName}
                          </span>
                          <span className="text-xs text-slate-500 font-bold">
                            ${pricing.packageOriginalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Window Sticker Add-on Row */}
                      {selectedPackage !== "Window Sticker" && (
                        <div className="pt-3 border-t border-slate-200/60">
                          <div className="flex justify-between items-start text-sm">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">
                                  Window Sticker
                                </span>
                                {pricing.windowStickerIncluded && pricing.windowStickerDiscountPercentage > 0 && (
                                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded">
                                    {pricing.windowStickerDiscountPercentage === 100
                                      ? "FREE"
                                      : `-${pricing.windowStickerDiscountPercentage}%`}
                                  </span>
                                )}
                              </div>
                              {pricing.packageTier !== "platinum" && pricing.packageTier !== "diamond" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setIncludeWindowSticker(!includeWindowSticker)
                                  }
                                  className={`text-[11px] font-bold mt-0.5 block hover:underline cursor-pointer ${
                                    includeWindowSticker
                                      ? "text-rose-500"
                                      : "text-brand-accent"
                                  }`}
                                >
                                  {includeWindowSticker
                                    ? "Remove"
                                    : pricing.packageTier === "gold"
                                      ? "+ Add ($14.99)"
                                      : "+ Add ($22.49)"}
                                </button>
                              )}
                            </div>
                            <div className="text-right">
                              {pricing.windowStickerIncluded ? (
                                <div>
                                  {pricing.windowStickerDiscountAmount > 0 && (
                                    <span className="text-[11px] text-slate-400 line-through mr-1.5 font-bold">
                                      $29.99
                                    </span>
                                  )}
                                  <span
                                    className={`font-bold inline-block ${
                                      pricing.windowStickerFinalPrice === 0
                                        ? "text-emerald-600"
                                        : "text-brand-blue"
                                    }`}
                                  >
                                    {pricing.windowStickerFinalPrice === 0
                                      ? "FREE"
                                      : `$${pricing.windowStickerFinalPrice.toFixed(2)}`}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 font-bold italic">
                                  Removed ($0.00)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Salvage Information Row for Diamond */}
                      {pricing.salvageInformationIncluded && (
                        <div className="pt-3 border-t border-slate-200/60">
                          <div className="flex justify-between items-start text-sm">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">
                                  Salvage Information
                                </span>
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded">
                                  FREE
                                </span>
                              </div>
                              <span className="text-[11px] text-emerald-600 font-medium block">
                                Diamond Included Benefit
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] text-slate-400 line-through mr-1.5 font-bold">
                                $149.00
                              </span>
                              <span className="font-bold text-emerald-600 inline-block">
                                FREE
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Applied Offer Banner / Total Discount */}
                      {pricing.totalDiscount > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between items-center text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl font-bold border border-emerald-100/80">
                            <span className="truncate pr-2">{pricing.appliedOfferName}</span>
                            <span className="shrink-0 font-black">-${pricing.totalDiscount.toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Report Status</span>
                        <span className="text-green-600 font-bold flex items-center gap-1">
                          <BadgeCheck className="w-4 h-4" /> Ready to Load
                        </span>
                      </div>
                    </div>

                    <div className="h-px w-full bg-brand-blue/10" />

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-2xl font-black text-brand-blue">
                        <span>Total</span>
                        <span>${pricing.finalAmountPaid.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-slate-500 italic">
                        No hidden fees. One-time payment.
                      </p>
                    </div>

                    <div className="space-y-4 pt-4">
                      {[
                        "Instant PDF Download",
                        "24/7 Priority Support",
                        "Secured by SSL Encryption",
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-widest"
                        >
                          <CheckCircle2 className="text-brand-blue w-4 h-4" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 pb-16 border-b border-white/5">
          <div className="space-y-6">
            <button
              onClick={navigateToHome}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
            >
              <img
                src="/allvinreport.jpeg"
                alt="AllVinReport Logo"
                className="h-10 w-auto object-contain rounded-lg"
              />
              <span className="text-2xl font-black text-white tracking-tighter">
                All VIN REPORT
              </span>
            </button>
            <p className="text-[14px] leading-relaxed font-medium text-slate-400">
              Premium automotive data intelligence. Helping buyers make
              confident decisions since 2018 with real-time global vehicle data.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-accent transition-colors cursor-pointer group">
                <Car className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-accent transition-colors cursor-pointer group">
                <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-accent transition-colors cursor-pointer group">
                <BadgeCheck className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-xs">
              Company
            </h4>
            <ul className="space-y-3.5 text-sm font-bold">
              <li>
                <a
                  href="#about"
                  onClick={(e) => scrollToSection(e, "about")}
                  className="hover:text-brand-accent transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => scrollToSection(e, "pricing")}
                  className="hover:text-brand-accent transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.location.hash = "terms";
                  }}
                  className="hover:text-brand-accent transition-colors text-left"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.location.hash = "privacy";
                  }}
                  className="hover:text-brand-accent transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.location.hash = "refund";
                  }}
                  className="hover:text-brand-accent transition-colors text-left"
                >
                  Refund Policy
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-xs">
              Contact Info
            </h4>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-start gap-3 text-slate-300">
                <MapPin className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[14px]">
                  14402 W Bellfort Street Sugar Land<br />
                  Texas 77498, USA
                </span>
              </li>
              <li>
                <a
                  href="tel:+1346296697"
                  className="flex items-center gap-3 text-slate-300 hover:text-brand-accent transition-colors"
                >
                  <Phone className="w-5 h-5 text-brand-accent shrink-0" />
                  <span className="font-bold text-[14px]">+1 346 296697</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:allvinreport@gmail.com"
                  className="flex items-center gap-3 text-slate-300 hover:text-brand-accent transition-colors"
                >
                  <Mail className="w-5 h-5 text-brand-accent shrink-0" />
                  <span className="font-bold text-[14px] break-all">allvinreport@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Accreditations & Trust Partners Section - Fully Responsive on Mobile & Desktop */}
        <div className="max-w-7xl mx-auto py-10 sm:py-12 border-b border-white/5">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="text-center lg:text-left space-y-1.5">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-brand-accent flex items-center justify-center lg:justify-start gap-2">
                <ShieldCheck className="w-4 h-4" /> Official Data Partners & Accreditations
              </span>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Verified registry records, certified inspection stations & consumer trust approved
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5 items-center w-full lg:w-auto">
              <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-md hover:scale-105 transition-transform flex items-center justify-center h-16 sm:h-20 w-full max-w-[170px] mx-auto">
                <img
                  src="/footerimg/trustpilot.jpeg"
                  alt="Trustpilot 5-Star Rating"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-md hover:scale-105 transition-transform flex items-center justify-center h-16 sm:h-20 w-full max-w-[170px] mx-auto">
                <img
                  src="/footerimg/nmvtis.jpeg"
                  alt="NMVTIS National Motor Vehicle Title Information System"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-md hover:scale-105 transition-transform flex items-center justify-center h-16 sm:h-20 w-full max-w-[170px] mx-auto">
                <img
                  src="/footerimg/ppsr.jpeg"
                  alt="PPSR Personal Property Securities Register"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-md hover:scale-105 transition-transform flex items-center justify-center h-16 sm:h-20 w-full max-w-[170px] mx-auto">
                <img
                  src="/footerimg/vehicle-inspection.jpeg"
                  alt="Vehicle Testing Station Approved by Vehicle Inspectorate"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.2em]">
            © 2024 All VIN REPORT Data Systems. All rights reserved.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] mr-1">
              Accepted Payment Methods
            </span>
            <img
              src="/visa.svg"
              alt="Visa"
              className="h-5 w-auto opacity-40 hover:opacity-80 transition-opacity object-contain"
            />
            <img
              src="/mastercard.svg"
              alt="Mastercard"
              className="h-5 w-auto opacity-40 hover:opacity-80 transition-opacity object-contain"
            />
            <img
              src="/paypal.svg"
              alt="PayPal"
              className="h-5 w-auto opacity-40 hover:opacity-80 transition-opacity object-contain"
            />
            <img
              src="/apple-pay.svg"
              alt="Apple Pay"
              className="h-5 w-auto opacity-40 hover:opacity-80 transition-opacity object-contain"
            />
            <img
              src="/american-express.svg"
              alt="American Express"
              className="h-5 w-auto opacity-40 hover:opacity-80 transition-opacity object-contain"
            />
            <img
              src="/maestro.svg"
              alt="Maestro"
              className="h-5 w-auto opacity-40 hover:opacity-80 transition-opacity object-contain"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
