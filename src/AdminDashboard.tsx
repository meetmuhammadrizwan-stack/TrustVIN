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
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Order {
  id: string;
  packageName: string;
  vin: string;
  email: string;
  firstName: string;
  lastName: string;
  amount: number;
  createdAt: string;
  status: string;
  country?: string;
  serialNumber?: number;
  reportStatus?: "not sent" | "sent";
}

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      
      const sortedAsc = data.sort((a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const withSerials = sortedAsc.map((order: Order, idx: number) => ({
        ...order,
        serialNumber: idx + 1
      }));
      
      setOrders(withSerials.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed Top-Left Logout Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-red-500/30 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 pl-28">
            <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">TrustedVIN Management</p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Logged in as</div>
            <div className="text-sm font-black text-slate-700">trustedvin@gmail.com</div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-10">
        {/* Advanced Filter System */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10 space-y-8">
          <div className="grid lg:grid-cols-4 gap-8 items-end">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-accent/50 focus:bg-white transition-all text-slate-600 font-bold text-sm appearance-none"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-accent/50 focus:bg-white transition-all text-slate-600 font-bold text-sm appearance-none"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => { }} // Live filtering is already active
              className="bg-brand-accent text-white h-[54px] px-8 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-brand-accent-hover transition-all shadow-lg shadow-brand-accent/20 active:scale-95"
            >
              Filter Date
            </button>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Payment Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-accent/50 focus:bg-white transition-all text-slate-600 font-bold text-sm appearance-none"
              >
                <option value="All">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-accent transition-colors w-5 h-5" />
              <input
                type="text"
                placeholder="Search by VIN, Email, Name, or Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-40 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-brand-accent/50 focus:bg-white transition-all text-slate-900 font-bold placeholder:text-slate-400 shadow-inner"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95">
                Click Here
              </button>
            </div>
            <button
              onClick={resetFilters}
              className="px-8 bg-slate-100 text-slate-500 rounded-3xl font-black text-sm uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Filtered Orders", value: filteredOrders.length, icon: CreditCard, color: "blue" },
            { label: "Total Revenue", value: `$${filteredOrders.filter(o => o.status.toLowerCase() === "completed").reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}`, icon: Filter, color: "green" },
            { label: "Active Reports", value: filteredOrders.filter(o => o.status === "pending").length, icon: Car, color: "amber" },
            { label: "Result Count", value: `${filteredOrders.length} of ${orders.length}`, icon: Download, color: "indigo" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-500 rounded-2xl`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Recent Transactions</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <Filter className="w-5 h-5 text-slate-400" />
              </button>
              <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <Download className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">#</th>
                  <th className="px-8 py-5">Customer</th>
                  <th className="px-8 py-5">Country</th>
                  <th className="px-8 py-5">Vehicle VIN</th>
                  <th className="px-8 py-5">Package</th>
                  <th className="px-8 py-5">Amount</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Report Status</th>
                  <th className="px-8 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-8 py-20 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                        No orders found matching your search.
                      </td>
                    </tr>
                  ) : filteredOrders.map((order, index) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={order.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6 text-sm font-black text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="text-sm font-black text-slate-900">{order.firstName} {order.lastName}</div>
                          <div className="text-xs text-slate-400 font-medium">{order.email}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-slate-600 truncate max-w-[120px]">
                          {order.country || "United States"}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-slate-300" />
                          <span className="text-sm font-bold text-slate-600 font-mono tracking-tight">{order.vin}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${order.packageName === 'Gold' ? 'bg-amber-100 text-amber-700' :
                          order.packageName === 'Premium' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                          {order.packageName}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-black text-slate-900">${order.amount}</div>
                      </td>
                      <td className="px-8 py-6 text-slate-400 font-bold text-xs uppercase">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        {(() => {
                          const rs = order.reportStatus || "not sent";
                          if (rs === "sent") {
                            return (
                              <span className="inline-flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm select-none cursor-not-allowed min-w-[110px] justify-center">
                                <CheckCircle2 className="w-3 h-3" />
                                Sent
                              </span>
                            );
                          }
                          return (
                            <select
                              value={rs}
                              onChange={(e) => {
                                const newRs = e.target.value as "not sent" | "sent";
                                setOrders(orders.map(o =>
                                  o.id === order.id ? { ...o, reportStatus: newRs } : o
                                ));
                              }}
                              className="font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border outline-none cursor-pointer appearance-none text-center min-w-[110px] hover:brightness-95 transition-all shadow-sm bg-rose-50 text-rose-500 border-rose-100"
                            >
                              <option value="not sent">Not Sent</option>
                              <option value="sent">Sent</option>
                            </select>
                          );
                        })()}
                      </td>
                      <td className="px-8 py-6 text-right">
                        {(() => {
                          const status = order.status.toLowerCase();
                          const config = {
                            pending: {
                              bg: "bg-amber-50",
                              text: "text-amber-500",
                              border: "border-amber-100",
                              icon: Clock
                            },
                            completed: {
                              bg: "bg-emerald-50",
                              text: "text-emerald-500",
                              border: "border-emerald-100",
                              icon: CheckCircle2
                            },
                            failed: {
                              bg: "bg-rose-50",
                              text: "text-rose-500",
                              border: "border-rose-100",
                              icon: XCircle
                            },
                            "on hold": {
                              bg: "bg-orange-50",
                              text: "text-orange-500",
                              border: "border-orange-100",
                              icon: Info
                            }
                          }[status as keyof typeof config] || {
                            bg: "bg-slate-50",
                            text: "text-slate-500",
                            border: "border-slate-100",
                            icon: Clock
                          };

                          return (
                            <select
                              value={order.status.toLowerCase()}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                const updatedOrders = orders.map(o =>
                                  o.id === order.id ? { ...o, status: newStatus } : o
                                );
                                setOrders(updatedOrders);
                              }}
                              className={`inline-flex items-center gap-1.5 ${config.text} font-black text-[10px] uppercase tracking-widest ${config.bg} px-3 py-1.5 rounded-full border ${config.border} outline-none cursor-pointer appearance-none text-center min-w-[120px] hover:brightness-95 transition-all shadow-sm`}
                            >
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                              <option value="failed">Failed</option>
                            </select>
                          );
                        })()}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
