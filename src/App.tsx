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
  Mail
} from "lucide-react";

import AdminDashboard from "./AdminDashboard";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsAndConditions from "./TermsAndConditions";
import RefundPolicy from "./RefundPolicy";

type View = "home" | "order" | "admin-login" | "admin-dashboard" | "thanks" | "privacy" | "terms" | "refund";
type PackageType = "Basic" | "Premium" | "Gold" | null;

export default function App() {
  const [view, setView] = useState<View>("home");
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(null);
  const [vinInput, setVinInput] = useState("");
  const [vinError, setVinError] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "United States"
  });

  // Admin State
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem("adminAuth") === "true";
  });
  const [loginError, setLoginError] = useState("");

  // Hash-based routing for direct admin access
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#admin") {
        if (localStorage.getItem("adminAuth") === "true") {
          setIsAdminAuthenticated(true);
          setView("admin-dashboard");
        } else {
          setView("admin-login");
        }
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    // Initial check
    if (window.location.hash === "#admin") {
      if (localStorage.getItem("adminAuth") === "true") {
        setIsAdminAuthenticated(true);
        setView("admin-dashboard");
      } else {
        setView("admin-login");
      }
    }

    // Check for Stripe Checkout redirect parameters
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      setView("thanks");
      // Clear the query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (query.get("canceled")) {
      alert("Payment was canceled. You can try again when you're ready.");
      // Clear the query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === "trustedvin@gmail.com" && adminPassword === "trustedvin@!") {
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
    setIsCheckoutLoading(true);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName: selectedPackage || "Basic",
          vin: vinInput,
          ...formData
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
    setSelectedPackage(pkg);
    window.scrollTo(0, 0);
    setView("order");
  };

  const navigateToHome = () => {
    setView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, id: string) => {
    e.preventDefault();
    if (view !== "home") {
      setView("home");
      // Wait for view transition
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 80; // Navbar height
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80; // Navbar height
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-brand-accent selection:text-white bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={navigateToHome}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 bg-brand-accent rounded-xl flex items-center justify-center shadow-lg shadow-brand-accent/20">
              <ShieldCheck className="text-white w-6 h-6 md:w-7 md:h-7" />
            </div>
            <span className="text-2xl md:text-2xl font-black text-slate-900 tracking-tighter">TrustedVIN</span>
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
              className="flex items-center gap-2 text-sm font-black text-brand-accent hover:text-brand-accent-hover transition-colors uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4" />
              Home
            </button>
          )}

          <button
            onClick={() => navigateToOrder("Basic", true)}
            className="md:hidden bg-brand-accent text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-brand-accent/20"
          >
            {view === "home" ? "Get Started" : "Checkout"}
          </button>
        </div>
      </nav>

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
                      Know the <span className="text-brand-accent">history</span> before you buy.
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-500 max-w-xl leading-relaxed font-medium">
                      Unlock detailed vehicle reports, accident history, and ownership records in seconds. Don't risk your investment.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 p-2.5 bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 transition-all duration-500 hover:shadow-brand-accent/5">
                      <div className={`flex-1 flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${vinError ? "bg-red-50 border border-red-200" : "bg-slate-50"}`}>
                        <Car className={`w-6 h-6 shrink-0 ${vinError ? "text-red-500" : "text-slate-400"}`} />
                        <input
                          type="text"
                          value={vinInput}
                          onChange={(e: { target: { value: any; }; }) => {
                            setVinInput(e.target.value);
                            if (vinError) setVinError(false);
                          }}
                          placeholder={vinError ? "VIN IS REQUIRED" : "Enter 17-digit VIN number"}
                          className="w-full bg-transparent outline-none text-slate-900 font-bold placeholder:text-slate-400 text-lg"
                        />
                      </div>
                      <button
                        onClick={() => navigateToOrder()}
                        className={`${vinError ? "bg-red-500" : "bg-slate-900"} text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-brand-accent transition-all flex items-center justify-center gap-3 group shadow-xl shadow-brand-accent/10 active:scale-95`}
                      >
                        Get Report
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                      </button>
                    </div>

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
                            <div className="text-lg font-black text-slate-900 leading-none mb-1">Report Ready</div>
                            <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">VIN Verified • 2m ago</div>
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
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">How it <span className="text-brand-accent">Works</span></h2>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">Getting your vehicle history report is simple, fast, and secure.</p>
                  </motion.div>

                  <div className="grid md:grid-cols-3 gap-10">
                    {[
                      {
                        step: "01",
                        title: "Enter VIN",
                        text: "Enter the unique 17-digit Vehicle Identification Number located on the dashboard or insurance card.",
                        icon: Search
                      },
                      {
                        step: "02",
                        title: "Choose Package",
                        text: "Select the report package that fits your needs. We offer Basic, Premium, and Gold options.",
                        icon: Zap
                      },
                      {
                        step: "03",
                        title: "Get Report",
                        text: "Instantly download your comprehensive report. Check records, damage history, and more.",
                        icon: History
                      }
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
                        <div className="text-6xl font-black text-slate-200 mb-8 transition-colors group-hover:text-brand-accent/10">{item.step}</div>
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-slate-200 group-hover:bg-brand-accent transition-colors">
                          <item.icon className="text-brand-accent w-8 h-8 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{item.title}</h3>
                        <p className="text-slate-500 text-[15px] leading-relaxed font-medium">{item.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* About Us Section */}
              <section id="about" className="section-padding bg-slate-900 overflow-hidden relative">
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
                        Transparent <span className="text-brand-accent">Intelligence</span>
                      </h2>
                      <div className="w-24 h-2 bg-brand-accent rounded-full" />
                    </div>
                    <p className="text-slate-400 text-xl leading-relaxed font-medium">
                      At TrustedVIN, we believe every car buyer deserves the full picture. Our mission is to provide accurate, real-time vehicle data that protects you from hidden damage, odometer fraud, and title scams.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {[
                        "Official NMVTIS partner data",
                        "Over 9,000+ data sources globally",
                        "Exhaustive title and salvage checks",
                        "Ownership and auction history"
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 group">
                          <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0 group-hover:bg-brand-accent transition-colors">
                            <CheckCircle2 className="text-brand-accent w-4 h-4 group-hover:text-white transition-colors" />
                          </div>
                          <span className="text-slate-300 font-bold text-sm tracking-wide">{item}</span>
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
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Simple <span className="text-brand-accent">Pricing</span></h2>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">Choose the level of detail that fits your vehicle inspection needs.</p>
                  </motion.div>

                  <div className="grid lg:grid-cols-3 gap-10 items-center">
                    {[
                      {
                        name: "Basic",
                        type: "Basic" as PackageType,
                        price: "$39.99",
                        features: ["Title Check", "Odometer Check", "Lien Records", "Partial Salvage History"],
                        popular: false
                      },
                      {
                        name: "Premium",
                        type: "Premium" as PackageType,
                        price: "$49.99",
                        features: ["Detailed Title History", "Accident Records", "Auction Photos", "Full Salvage History", "Owner Count"],
                        popular: true
                      },
                      {
                        name: "Gold",
                        type: "Gold" as PackageType,
                        price: "$59.99",
                        features: ["All Premium Features", "Maintenance History", "Recalls & Defects", "Price Analysis", "Extended Warranty Check", "Market Value Report"],
                        popular: false
                      }
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.15 }}
                        whileHover={{ y: -10 }}
                        className={`relative p-12 rounded-[3rem] border-2 transition-all ${item.popular
                          ? "bg-slate-900 text-white border-transparent shadow-[0_40px_80px_-15px_rgba(15,23,42,0.3)] py-16 z-10"
                          : "bg-white text-slate-900 border-slate-100 hover:border-brand-accent/20"
                          }`}
                      >
                        {item.popular && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-brand-accent text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-accent/20">
                            Most Popular
                          </div>
                        )}
                        <div className="space-y-10">
                          <div className="space-y-3">
                            <h3 className={`text-xl font-black uppercase tracking-widest ${item.popular ? "text-brand-accent" : "text-slate-400"}`}>{item.name}</h3>
                            <div className="flex items-baseline gap-1">
                              <span className="text-6xl font-black tracking-tighter">{item.price}</span>
                              <span className={`text-sm font-bold uppercase tracking-widest ${item.popular ? "text-slate-400" : "text-slate-400"}`}>/report</span>
                            </div>
                          </div>

                          <div className={`h-px w-full ${item.popular ? "bg-slate-800" : "bg-slate-100"}`} />

                          <ul className="space-y-5 min-h-[260px]">
                            {item.features.map((feature, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-4 text-[15px] font-bold">
                                <CheckCircle2 className={`w-6 h-6 flex-shrink-0 ${item.popular ? "text-brand-accent" : "text-slate-900"}`} />
                                <span className={item.popular ? "text-slate-300" : "text-slate-600"}>{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <button
                            onClick={() => navigateToOrder(item.type, true)}
                            className={`w-full py-5 rounded-[1.5rem] font-black text-lg transition-all active:scale-95 ${item.popular
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
              <section id="comparison" className="section-padding bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center space-y-5 mb-24"
                  >
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Market <span className="text-brand-accent">Comparison</span></h2>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">See how we stack up against the competition in value and detail.</p>
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
                          <th className="px-10 py-4 text-brand-accent">TrustedVIN</th>
                          <th className="px-10 py-4">CarFax</th>
                          <th className="px-10 py-4">AutoCheck</th>
                          <th className="px-10 py-4">InstaVIN</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-4">
                        {[
                          { feature: "Price per Report", us: "$14.99", f1: "$44.99", f2: "$24.99", f3: "$20.00" },
                          { feature: "NMVTIS Data", us: true, f1: true, f2: true, f3: true },
                          { feature: "Auction Photos", us: true, f1: false, f2: false, f3: false },
                          { feature: "Instant Delivery", us: true, f1: true, f2: true, f3: true },
                          { feature: "Live Market Value", us: true, f1: false, f2: true, f3: false },
                          { feature: "Theft Records", us: true, f1: true, f2: true, f3: true }
                        ].map((row, idx) => (
                          <tr key={idx} className="bg-slate-50 rounded-3xl group hover:bg-slate-100 transition-colors">
                            <td className="px-10 py-7 font-black text-slate-900 rounded-l-[2rem]">{row.feature}</td>
                            <td className="px-10 py-7 text-emerald-500 font-black">
                              {/* Modified output logic for visual clarity */}
                              {typeof row.us === 'boolean' ? (
                                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                              ) : <span className="text-xl tracking-tighter text-emerald-600">{row.us}</span>}
                            </td>
                            <td className="px-10 py-7 text-slate-400 font-bold">
                              {typeof row.f1 === 'boolean' ? (row.f1 ? <CheckCircle2 className="w-6 h-6 text-emerald-500/60" /> : <XCircle className="w-6 h-6 text-rose-500/60" />) : row.f1}
                            </td>
                            <td className="px-10 py-7 text-slate-400 font-bold">
                              {typeof row.f2 === 'boolean' ? (row.f2 ? <CheckCircle2 className="w-6 h-6 text-emerald-500/60" /> : <XCircle className="w-6 h-6 text-rose-500/60" />) : row.f2}
                            </td>
                            <td className="px-10 py-7 text-slate-400 font-bold rounded-r-[2rem]">
                              {typeof row.f3 === 'boolean' ? (row.f3 ? <CheckCircle2 className="w-6 h-6 text-emerald-500/60" /> : <XCircle className="w-6 h-6 text-rose-500/60" />) : row.f3}
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
                    <Info className="w-4 h-4 text-brand-accent" /> Important Disclaimer
                  </div>
                  <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium opacity-80 italic">
                    "Vehicle reports are generated using data from public records and trusted third-party sources. Some information may be unavailable or not yet updated in official databases. Report details can vary by selected package. Due to the digital nature of this service, all sales are final and non-refundable."
                  </p>
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
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Login</h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Secure Access Required</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@trustedvin.com"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-accent/50 focus:bg-white transition-all text-slate-900 font-bold"
                    />
                    <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
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
                Payment completed successfully. Your report will be sent to your E-mail within <strong className="text-slate-900">20 to 30 minutes</strong>.
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
                    <h1 className="text-4xl font-black text-brand-blue tracking-tight">Complete Your Order</h1>
                    <p className="text-slate-500">Please provide your details below to process your vehicle history report.</p>
                  </div>

                  <form onSubmit={handleCheckout} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">First Name</label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e: { target: { value: any; }; }) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="John"
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue/50 focus:bg-white transition-all text-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Last Name</label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Doe"
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue/50 focus:bg-white transition-all text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-blue/50 focus:bg-white transition-all text-slate-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">VIN Number</label>
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

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Phone Number (USA)</label>
                        <div className="flex">
                          <span className="flex items-center justify-center px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-600 font-bold">
                            +1
                          </span>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(555) 000-0000"
                            className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-r-xl outline-none focus:border-brand-blue/50 focus:bg-white transition-all text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Country</label>
                        <div className="relative">
                          <select
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
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

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isCheckoutLoading}
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
                        All payments are processed securely. Due to digital delivery, all sales are final.
                      </p>
                    </div>
                  </form>
                </div>

                {/* Summary Side */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-8 bg-brand-light-blue rounded-[2.5rem] space-y-6 sticky top-24 border border-brand-blue/5">
                    <h3 className="text-xl font-bold text-brand-blue">Order Summary</h3>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Selected Package</span>
                        <span className="font-bold text-brand-blue">{selectedPackage || "Standard"} Report</span>
                      </div>
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
                        <span>{selectedPackage === "Gold" ? "$59.99" : selectedPackage === "Premium" ? "$49.99" : "$39.99"}</span>
                      </div>
                      <p className="text-xs text-slate-500 italic">No hidden fees. One-time payment.</p>
                    </div>

                    <div className="space-y-4 pt-4">
                      {[
                        "Instant PDF Download",
                        "24/7 Priority Support",
                        "Secured by SSL Encryption"
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-widest">
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
      <footer className="bg-slate-900 text-slate-400 py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16 pb-20 border-b border-white/5">
          <div className="space-y-8">
            <button onClick={navigateToHome} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">TrustedVIN</span>
            </button>
            <p className="text-[15px] leading-relaxed font-medium">
              Premium automotive data intelligence. Helping buyers make confident decisions since 2018 with real-time global data.
            </p>
            <div className="flex gap-4">

              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-accent transition-colors cursor-pointer group">
                <Car className="w-5 h-5 text-slate-500 group-hover:text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-xs">Services</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><button onClick={() => navigateToOrder()} className="hover:text-brand-accent transition-colors">VIN Lookup</button></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">License Plate Search</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Recall Check</a></li>
              <li><button onClick={(e) => scrollToSection(e as any, "pricing")} className="hover:text-brand-accent transition-colors">Market Value</button></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-xs">Company</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><a href="#about" className="hover:text-brand-accent transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Contact</a></li>
              <li><button onClick={() => { setView("terms"); window.scrollTo(0, 0); }} className="hover:text-brand-accent transition-colors">Terms & Conditions</button></li>
              <li><button onClick={() => { setView("privacy"); window.scrollTo(0, 0); }} className="hover:text-brand-accent transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => { setView("refund"); window.scrollTo(0, 0); }} className="hover:text-brand-accent transition-colors">Refund Policy</button></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-xs">Direct Support</h4>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-accent/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Info className="text-brand-accent w-6 h-6" />
                </div>
                <div>
                  <div className="text-white font-black text-sm uppercase tracking-wider">Need Help?</div>
                  <div className="text-slate-500 text-xs font-bold mt-1">Response within 2h</div>
                </div>
              </div>
              <div className="text-[13px] font-black text-white hover:text-brand-accent transition-colors cursor-pointer">
                support@trustedvin.com
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-black uppercase tracking-[0.2em]">
          <p className="text-slate-600">© 2024 TrustedVIN Data Systems. All rights reserved.</p>
          <div className="flex gap-10">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
