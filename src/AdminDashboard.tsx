import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Download,
  Filter,
  LogOut,
  ChevronLeft,
  Mail,
  User,
  CreditCard,
  Calendar,
  Car,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Info,
  Globe,
  Copy,
  Check,
  Phone,
  AlertCircle,
  CheckSquare,
  FileText,
  Trash2,
  UploadCloud,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Order {
  id: string;
  packageName: string;
  vin: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  amount: number;
  createdAt: string;
  status: string;
  country?: string;
  serialNumber?: number;
  reportStatus?: "not sent" | "sent";
  policyAgreed?: boolean;
  reportFileName?: string;
  reportFilePath?: string;
  downloads?: Array<{
    timestamp: string;
    ip: string;
  }>;
}

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  
  // Master-Detail Pane States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [isDeletingReport, setIsDeletingReport] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      
      const sortedAsc = data.sort((a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const withSerials = sortedAsc.map((order: Order, idx: number) => ({
        ...order,
        serialNumber: idx + 1
      }));
      
      const sortedDesc = withSerials.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(sortedDesc);
      
      if (sortedDesc.length > 0) {
        setSelectedOrderId(sortedDesc[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.firstName} ${order.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);

    const start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const matchesDate = (!start || orderDate >= start) &&
      (!end || orderDate <= end);

    const matchesStatus = statusFilter === "All" || order.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDate && matchesStatus;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("All");
  };

  const updateOrderOnServer = async (orderId: string, updates: { status?: string; reportStatus?: "not sent" | "sent" }) => {
    setIsUpdating(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
        setUpdateSuccess(orderId);
        setTimeout(() => setUpdateSuccess(null), 1500);
      } else {
        alert("Failed to update order on the server.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order. Please check connection.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedOrder || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Validate file type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a PDF file.");
      return;
    }

    setIsUploadingReport(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "trustvin_reports");

      const cloudinaryUrl = "https://api.cloudinary.com/v1_1/dpswtr8md/raw/upload";
      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to upload to Cloudinary");
      }

      const data = await response.json();
      const secureUrl = data.secure_url;

      if (!secureUrl) {
        throw new Error("No secure URL returned from Cloudinary");
      }

      const serverResponse = await fetch(`/api/orders/${selectedOrder.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          secureUrl: secureUrl
        })
      });

      if (serverResponse.ok) {
        const result = await serverResponse.json();
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { 
          ...o, 
          reportFileName: file.name, 
          reportFilePath: result.reportFilePath || secureUrl,
          reportStatus: "sent" 
        } : o));
      } else {
        let errorMessage = "Unknown server error";
        try {
          const err = await serverResponse.json();
          errorMessage = err.error || errorMessage;
        } catch (e) {
          try {
            errorMessage = await serverResponse.text();
          } catch (textErr) {}
        }
        alert(`Failed to save report details: ${errorMessage}`);
      }
    } catch (err: any) {
      console.error("Error uploading report:", err);
      alert(`Error uploading report: ${err.message || err}`);
    } finally {
      setIsUploadingReport(false);
      e.target.value = "";
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedOrder) return;
    if (!confirm("Are you sure you want to delete this report? This will delete the file from the server and clear download tracking logs.")) return;

    setIsDeletingReport(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/report`, {
        method: "DELETE"
      });

      if (response.ok) {
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { 
          ...o, 
          reportFileName: "", 
          reportFilePath: "", 
          reportStatus: "not sent", 
          downloads: [] 
        } : o));
      } else {
        alert("Failed to delete report from server.");
      }
    } catch (err) {
      console.error("Error deleting report:", err);
      alert("Error deleting report. Please try again.");
    } finally {
      setIsDeletingReport(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Order ID", "Customer Name", "Email", "Phone", "Country", "VIN", "Package", "Amount", "Date", "Policy Agreed", "Report Status", "Payment Status"];
    const rows = filteredOrders.map(order => [
      order.id,
      `${order.firstName} ${order.lastName}`,
      order.email,
      order.phone || "",
      order.country || "United States",
      order.vin,
      order.packageName,
      order.amount,
      new Date(order.createdAt).toLocaleDateString(),
      order.policyAgreed ? "Yes" : "No",
      order.reportStatus || "not sent",
      order.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VinTrust_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;

  // Stats calculation based on filtered orders
  const totalRevenue = filteredOrders
    .filter(o => o.status.toLowerCase() === "completed")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingReports = filteredOrders.filter(o => (o.reportStatus || "not sent") === "not sent" && o.status.toLowerCase() === "completed").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 h-20 shrink-0 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center shadow-lg shadow-brand-accent/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Admin Portal</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">VinTrust Control Center</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as</div>
              <div className="text-sm font-black text-slate-700">VinTrust@gmail.com</div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-500/10 active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-[1600px] w-full mx-auto px-6 py-6 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 lg:h-[calc(100vh-140px)]">
          
          {/* Left Pane: Search, Filters & Master List */}
          <div className="w-full lg:w-[450px] xl:w-[480px] shrink-0 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden h-[600px] lg:h-full">
            
            {/* Header controls inside list pane */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-slate-900 text-base uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-accent" />
                  Order Registry
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={exportToCSV}
                    title="Export registry to CSV"
                    className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-500 transition-colors border border-slate-200 bg-white cursor-pointer shadow-xs active:scale-95"
                  >
                    <Download className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    title="Toggle Date and Status Filters"
                    className={`p-2 rounded-xl transition-all border flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs active:scale-95 ${
                      showFilters 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                </div>
              </div>

              {/* Live search input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by VIN, Email, Name, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-accent/50 transition-all text-sm font-semibold placeholder:text-slate-400 shadow-inner"
                />
              </div>

              {/* Expandable date filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-3 pt-1 border-t border-slate-200/50"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold text-slate-600 appearance-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold text-slate-600 appearance-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Payment Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold text-slate-600 appearance-none"
                        >
                          <option value="All">All Payments</option>
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                      <button
                        onClick={resetFilters}
                        className="h-9 px-4 mt-5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Compact Stats strip */}
              <div className="grid grid-cols-3 gap-2 text-center bg-white p-3 rounded-xl border border-slate-100 shadow-inner">
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Matched</div>
                  <div className="text-sm font-black text-slate-800">{filteredOrders.length}</div>
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue</div>
                  <div className="text-sm font-black text-emerald-600">${totalRevenue.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Rpts</div>
                  <div className="text-sm font-black text-amber-500">{pendingReports}</div>
                </div>
              </div>
            </div>

            {/* List container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/20">
              {isLoading ? (
                <div className="h-full flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 italic space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-300" />
                  <span className="text-sm font-bold">No orders found matching criteria</span>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = order.id === selectedOrderId;
                  const isPending = order.status.toLowerCase() === "pending";
                  const isCompleted = order.status.toLowerCase() === "completed";
                  const isFailed = order.status.toLowerCase() === "failed";
                  
                  // Report status check
                  const reportSent = order.reportStatus === "sent";

                  return (
                    <motion.div
                      layoutId={`card-${order.id}`}
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border flex flex-col gap-2.5 relative select-none hover-lift ${
                        isSelected
                          ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10"
                          : "bg-white hover:bg-slate-50/50 border-slate-200/70 text-slate-800 shadow-xs"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-black text-sm truncate max-w-[200px]">
                          {order.firstName} {order.lastName}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                          isSelected 
                            ? "bg-white/10 text-white/90" 
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {new Date(order.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs">
                        <Car className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-slate-400" : "text-slate-300"}`} />
                        <span className={`font-mono truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          {order.vin}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t pt-2.5 mt-0.5 border-dashed border-slate-200/20">
                        <div className="flex items-center gap-1.5">
                          {/* Payment state dot */}
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            isCompleted ? "bg-emerald-500" : isPending ? "bg-amber-400" : "bg-rose-500"
                          }`} />
                          
                          {/* Package Label */}
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            order.packageName === 'Gold' 
                              ? (isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700')
                              : order.packageName === 'Premium' 
                                ? (isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-700')
                                : (isSelected ? 'bg-slate-500/20 text-slate-300' : 'bg-slate-100 text-slate-600')
                          }`}>
                            {order.packageName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Report Status indicator icon */}
                          <span 
                            title={reportSent ? "Report Sent" : "Report Pending"}
                            className={`p-1 rounded-md ${
                              reportSent 
                                ? "text-emerald-500 bg-emerald-500/10" 
                                : "text-rose-500 bg-rose-500/10"
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </span>

                          <span className="text-xs font-black">${order.amount}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Detail View */}
          <div className="flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden h-[600px] lg:h-full">
            <AnimatePresence mode="wait">
              {!selectedOrder ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center shadow-inner mb-6 animate-pulse-soft">
                    <Car className="text-slate-300 w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">No Record Selected</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Select an order from the Registry to view details</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col h-full overflow-hidden"
                  key={selectedOrder.id}
                >
                  {/* Detail Panel Header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-900/10 shrink-0">
                        {selectedOrder.firstName[0]?.toUpperCase()}{selectedOrder.lastName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{selectedOrder.firstName} {selectedOrder.lastName}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                          ID: <span className="font-mono">{selectedOrder.id}</span>
                          <button 
                            onClick={() => handleCopy(selectedOrder.id, "stripe-id")}
                            className="p-1 hover:bg-slate-100 rounded-md transition-colors inline cursor-pointer text-slate-400 hover:text-slate-600"
                            title="Copy Stripe Session ID"
                          >
                            {copiedField === "stripe-id" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detail Panel Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Primary Overview Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Plan</div>
                        <div className="text-lg font-black text-slate-900 mt-1.5 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-brand-accent shrink-0 animate-pulse-soft" />
                          {selectedOrder.packageName}
                        </div>
                      </div>

                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</div>
                        <div className="text-lg font-black text-slate-900 mt-1.5 flex items-center gap-1">
                          <CreditCard className="w-5 h-5 text-slate-400 shrink-0" />
                          ${selectedOrder.amount}
                        </div>
                      </div>

                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Index</div>
                        <div className="text-lg font-black text-slate-900 mt-1.5 flex items-center gap-1.5">
                          <span className="text-slate-400 font-bold">#</span>
                          {selectedOrder.serialNumber || "-"}
                        </div>
                      </div>

                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Date</div>
                        <div className="text-sm font-black text-slate-700 mt-2 flex items-center gap-1.5">
                          <Calendar className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                          {new Date(selectedOrder.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Customer & Car Metadata Section */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Record Attributes</h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Vehicle VIN */}
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs group">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-50 text-slate-400 group-hover:bg-brand-accent/5 group-hover:text-brand-accent rounded-xl transition-colors">
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vehicle VIN</div>
                              <div className="text-sm font-bold text-slate-800 font-mono tracking-tight">{selectedOrder.vin}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopy(selectedOrder.vin, "vin")}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Copy VIN"
                          >
                            {copiedField === "vin" ? <Check className="w-4.5 h-4.5 text-emerald-500" /> : <Copy className="w-4.5 h-4.5" />}
                          </button>
                        </div>

                        {/* Customer Email */}
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs group">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-50 text-slate-400 group-hover:bg-brand-accent/5 group-hover:text-brand-accent rounded-xl transition-colors">
                              <Mail className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</div>
                              <div className="text-sm font-bold text-slate-800 break-all">{selectedOrder.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={`mailto:${selectedOrder.email}`}
                              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-brand-accent cursor-pointer"
                              title="Send Email"
                            >
                              <Mail className="w-4.5 h-4.5" />
                            </a>
                            <button
                              onClick={() => handleCopy(selectedOrder.email, "email")}
                              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Copy Email"
                            >
                              {copiedField === "email" ? <Check className="w-4.5 h-4.5 text-emerald-500" /> : <Copy className="w-4.5 h-4.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Phone Number */}
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs group">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-50 text-slate-400 group-hover:bg-brand-accent/5 group-hover:text-brand-accent rounded-xl transition-colors">
                              <Phone className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number</div>
                              <div className="text-sm font-bold text-slate-800">{selectedOrder.phone || "Not Provided"}</div>
                            </div>
                          </div>
                          {selectedOrder.phone && (
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={`tel:${selectedOrder.phone}`}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-brand-accent cursor-pointer"
                                title="Call Customer"
                              >
                                <Phone className="w-4.5 h-4.5" />
                              </a>
                              <button
                                onClick={() => handleCopy(selectedOrder.phone || "", "phone")}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Copy Phone Number"
                              >
                                {copiedField === "phone" ? <Check className="w-4.5 h-4.5 text-emerald-500" /> : <Copy className="w-4.5 h-4.5" />}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Country */}
                        <div className="flex items-center p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs group">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-50 text-slate-400 group-hover:bg-brand-accent/5 group-hover:text-brand-accent rounded-xl transition-colors">
                              <Globe className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Billing Country</div>
                              <div className="text-sm font-bold text-slate-800">{selectedOrder.country || "United States"}</div>
                            </div>
                          </div>
                        </div>

                        {/* Policy agreement validation checkbox display */}
                        <div className="flex items-center p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs md:col-span-2 group">
                          <div className="flex items-center gap-3 w-full">
                            <div className={`p-2.5 rounded-xl transition-colors ${
                              selectedOrder.policyAgreed 
                                ? "bg-emerald-500/10 text-emerald-600" 
                                : "bg-rose-500/10 text-rose-600"
                            }`}>
                              <CheckSquare className="w-5 h-5" />
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                              <div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ticked Policy Agreement Checkbox</div>
                                <div className="text-xs text-slate-400 font-semibold mt-0.5">Agreed to Terms, Privacy & Refund policy before checkout</div>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border select-none ${
                                selectedOrder.policyAgreed
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                  : "bg-rose-50 border-rose-100 text-rose-500"
                              }`}>
                                {selectedOrder.policyAgreed ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Yes, Agreed
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" />
                                    No, Disagreed
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action controls (Persistence) */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Status Operations</h4>
                      
                      <div className="grid sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/50">
                        {/* Report Delivery Status */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Report Status</label>
                          <div className="relative">
                            <select
                              value={selectedOrder.reportStatus || "not sent"}
                              onChange={(e) => {
                                const newReportVal = e.target.value as "not sent" | "sent";
                                updateOrderOnServer(selectedOrder.id, { reportStatus: newReportVal });
                              }}
                              disabled={isUpdating === selectedOrder.id}
                              className={`w-full px-4 py-3 bg-white border rounded-xl outline-none text-sm font-black uppercase tracking-wider transition-all appearance-none cursor-pointer ${
                                selectedOrder.reportStatus === 'sent' 
                                  ? 'border-emerald-200 text-emerald-600 focus:border-emerald-400' 
                                  : 'border-rose-200 text-rose-500 focus:border-rose-400'
                              }`}
                            >
                              <option value="not sent" className="text-rose-500">Not Sent (Needs Attention)</option>
                              <option value="sent" className="text-emerald-500">Sent (Completed)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5">
                              {isUpdating === selectedOrder.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                              ) : updateSuccess === selectedOrder.id ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment Invoice Status */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Payment Invoice Status</label>
                          <div className="relative">
                            <select
                              value={selectedOrder.status.toLowerCase()}
                              onChange={(e) => {
                                const newPaymentVal = e.target.value;
                                updateOrderOnServer(selectedOrder.id, { status: newPaymentVal });
                              }}
                              disabled={isUpdating === selectedOrder.id}
                              className={`w-full px-4 py-3 bg-white border rounded-xl outline-none text-sm font-black uppercase tracking-wider transition-all appearance-none cursor-pointer ${
                                selectedOrder.status.toLowerCase() === 'completed'
                                  ? 'border-emerald-200 text-emerald-600 focus:border-emerald-400'
                                  : selectedOrder.status.toLowerCase() === 'pending'
                                    ? 'border-amber-200 text-amber-500 focus:border-amber-400'
                                    : 'border-rose-200 text-rose-500 focus:border-rose-400'
                              }`}
                            >
                              <option value="pending" className="text-amber-500">Pending Invoice</option>
                              <option value="completed" className="text-emerald-500">Completed (Paid)</option>
                              <option value="failed" className="text-rose-500">Failed / Rejected</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5">
                              {isUpdating === selectedOrder.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                              ) : updateSuccess === selectedOrder.id ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Report PDF Management Section */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Report Document & Tracking</h4>
                      
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/50 space-y-6">
                        
                        {/* File upload/status area */}
                        {selectedOrder.reportFileName ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs group">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl transition-colors">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uploaded Report</div>
                                  <div className="text-sm font-bold text-slate-800 truncate pr-2">{selectedOrder.reportFileName}</div>
                                </div>
                              </div>
                              <button
                                onClick={handleDeleteReport}
                                disabled={isDeletingReport}
                                className="p-2 hover:bg-rose-50 rounded-xl transition-colors text-slate-400 hover:text-rose-500 cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
                                title="Delete Report"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </div>

                            {/* Share link box */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Download Link (Manually send to user)</label>
                              <div className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs gap-3">
                                <a
                                  href={`${window.location.origin}/download/${selectedOrder.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors font-mono truncate select-all underline"
                                  title="Open download link in new tab"
                                >
                                  {`${window.location.origin}/download/${selectedOrder.id}`}
                                </a>
                                <button
                                  onClick={() => handleCopy(`${window.location.origin}/download/${selectedOrder.id}`, "download-link")}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors inline cursor-pointer text-slate-500 hover:text-slate-700 shrink-0"
                                  title="Copy Download Link"
                                >
                                  {copiedField === "download-link" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-white hover:border-brand-accent/50 transition-colors relative group">
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={handleFileUpload}
                              disabled={isUploadingReport}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            {isUploadingReport ? (
                              <div className="flex flex-col items-center space-y-2">
                                <div className="w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uploading report...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-center space-y-2">
                                <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-brand-accent/10 group-hover:text-brand-accent rounded-2xl transition-colors">
                                  <UploadCloud className="w-6 h-6" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold text-slate-700">Click or drag report PDF to upload</span>
                                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Supports PDF reports up to 50MB</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Auditing timeline / display */}
                        {selectedOrder.reportFileName && (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between border-t border-slate-200/60 pt-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Download History Logs</span>
                                <button
                                  onClick={fetchOrders}
                                  disabled={isLoading}
                                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded hover:bg-slate-100 disabled:opacity-50 flex items-center justify-center"
                                  title="Refresh logs"
                                >
                                  <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                                </button>
                              </div>
                              <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full">
                                {selectedOrder.downloads?.length || 0} {selectedOrder.downloads?.length === 1 ? "download" : "downloads"}
                              </span>
                            </div>

                            {!selectedOrder.downloads || selectedOrder.downloads.length === 0 ? (
                              <div className="text-xs text-slate-400 italic font-semibold text-center py-2 bg-white rounded-xl border border-slate-100">
                                This report has not been downloaded yet.
                              </div>
                            ) : (
                              <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {selectedOrder.downloads.slice().reverse().map((dl, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-[11px] shadow-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      <span className="font-bold text-slate-700 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                        {dl.ip}
                                      </span>
                                    </div>
                                    <span className="font-bold text-slate-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-300" />
                                      {new Date(dl.timestamp).toLocaleString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        second: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
}
