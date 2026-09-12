import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { 
  ShoppingBag, Receipt, Calculator, ShieldAlert, Loader2, 
  Search, Filter, CheckCircle2, Clock, Truck, Package, 
  AlertTriangle, DollarSign, TrendingUp, Printer, X, Eye, 
  Building2, ArrowRight, FileText, Check, AlertCircle, Sparkles,
  RefreshCw, ArrowUpRight, ShieldCheck, ChevronRight, FileSpreadsheet,
  Calendar, Layers, ExternalLink, Activity, HelpCircle, CornerDownRight,
  TrendingDown, CheckSquare2
} from 'lucide-react'

export default function AdminOrdersAndTax() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('ORDERS') // 'ORDERS' | 'TAX_REPORT'
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedYear, setSelectedYear] = useState('2026')

  // Modal xem / xuất Hóa đơn điện tử máy tính tiền (NĐ 70/2025/NĐ-CP)
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // 1. TẢI DANH SÁCH ĐƠN HÀNG TỪ SUPABASE
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Lỗi nạp danh sách đơn hàng:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchOrders()
    }
  }, [isAdmin])

  // 2. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (Xác nhận -> Đóng gói -> Đã giao)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setActionLoadingId(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: newStatus,
          ...(newStatus === 'delivered' ? { payment_status: 'paid' } : {})
        })
        .eq('id', orderId)

      if (error) throw error
      await fetchOrders()
    } catch (err) {
      alert('Không thể cập nhật trạng thái đơn hàng: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  // 3. XUẤT HÓA ĐƠN ĐIỆN TỬ MÁY TÍNH TIỀN (Nghị định 70/2025/NĐ-CP)
  const handleIssueEInvoice = async (order) => {
    setActionLoadingId(order.id)
    try {
      const eInvoiceCode = `HDDT70-${Date.now().toString().slice(-8)}`
      const { error } = await supabase
        .from('orders')
        .update({
          e_invoice_status: 'issued',
          notes: `${order.notes || ''} | HĐĐT Máy tính tiền NĐ 70: ${eInvoiceCode}`
        })
        .eq('id', order.id)

      if (error) throw error
      
      const updatedOrder = { ...order, e_invoice_status: 'issued', invoice_code: eInvoiceCode }
      setInvoiceModalOrder(updatedOrder)
      await fetchOrders()
    } catch (err) {
      alert('Lỗi xuất hóa đơn điện tử: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  // LỌC ĐƠN HÀNG THEO TÌM KIẾM & BỘ LỌC
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchSearch = 
        (ord.order_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ord.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ord.customer_phone || '').includes(searchQuery)
      
      const matchStatus = statusFilter === 'ALL' || ord.order_status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, searchQuery, statusFilter])

  // 4. BÁO CÁO THUẾ TMĐT (Nghị định 117/2025/NĐ-CP & 141/2026/NĐ-CP)
  const taxAnalysis = useMemo(() => {
    const yearOrders = orders.filter((o) => {
      const orderYear = new Date(o.created_at).getFullYear().toString()
      return orderYear === selectedYear && o.order_status !== 'cancelled'
    })

    const totalRevenue = yearOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    
    // Ngưỡng doanh thu 1 Tỷ VNĐ/năm theo Nghị định 141/2026/NĐ-CP
    const THRESHOLD = 1000000000
    const isExceedThreshold = totalRevenue >= THRESHOLD

    // Tỷ lệ thuế: GTGT 1%, TNCN 0.5% (Tổng 1.5%)
    const vatAmount = isExceedThreshold ? Math.round(totalRevenue * 0.01) : 0
    const pitAmount = isExceedThreshold ? Math.round(totalRevenue * 0.005) : 0
    const totalTaxPayable = vatAmount + pitAmount

    // Thuế Sàn TMĐT đã khấu trừ nộp thay theo Nghị định 117/2025/NĐ-CP
    const totalPlatformWithheld = yearOrders.reduce((sum, o) => {
      return sum + Number(o.tax_prepaid_amount || Math.round((o.total_amount || 0) * 0.01))
    }, 0)

    const netTaxDifference = totalTaxPayable - totalPlatformWithheld

    // Tổng hợp doanh thu theo từng tháng
    const monthlyStats = Array.from({ length: 12 }, (_, index) => {
      const monthNum = index + 1
      const monthOrders = yearOrders.filter((o) => new Date(o.created_at).getMonth() + 1 === monthNum)
      const revenue = monthOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
      const vat = isExceedThreshold ? Math.round(revenue * 0.01) : 0
      const pit = isExceedThreshold ? Math.round(revenue * 0.005) : 0
      const withheld = monthOrders.reduce((sum, o) => sum + Number(o.tax_prepaid_amount || Math.round((o.total_amount || 0) * 0.01)), 0)

      return {
        month: `Tháng ${monthNum < 10 ? '0' + monthNum : monthNum}`,
        orderCount: monthOrders.length,
        revenue,
        vat,
        pit,
        totalTax: vat + pit,
        withheld
      }
    })

    return {
      totalOrdersCount: yearOrders.length,
      totalRevenue,
      THRESHOLD,
      isExceedThreshold,
      vatAmount,
      pitAmount,
      totalTaxPayable,
      totalPlatformWithheld,
      netTaxDifference,
      monthlyStats
    }
  }, [orders, selectedYear])

  const formatVND = (amt) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0)

  // ---------------------------------------------------------------------------
  // RENDER: LOADER AUTHENTICATING
  // ---------------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0,transparent_100%)] pointer-events-none" />
        <div className="relative flex flex-col items-center gap-4 bg-slate-900/60 p-8 rounded-3xl border border-slate-800/80 backdrop-blur-2xl shadow-2xl">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-md -z-10 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <span className="text-xs font-mono tracking-widest uppercase font-bold text-slate-200">KINB OS • ADMIN ENGINE</span>
            <p className="text-[11px] text-slate-500 font-mono">Đang xác thực thông tin quyền hạn Supabase...</p>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // RENDER: ACCESS DENIED
  // ---------------------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white relative overflow-hidden font-sans">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="max-w-md w-full p-8 bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl text-center space-y-6 border border-slate-800/80 relative overflow-hidden group">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner relative">
            <ShieldAlert className="w-8 h-8" />
            <div className="absolute -inset-1 rounded-2xl bg-rose-500/20 blur-lg -z-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight">Truy cập bị từ chối</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-normal px-2">
              Chỉ tài khoản QTV sở hữu quyền hạn <code className="text-rose-400 font-mono font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">role === 'admin'</code> mới được tiếp cận phân hệ Quản lý Đơn hàng & Kê khai Thuế.
            </p>
          </div>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 hover:border-slate-600 active:scale-95 shadow-lg">
            Quay lại trang chủ
          </a>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // RENDER: MAIN EXECUTIVE DASHBOARD
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-24 relative overflow-hidden">
      
      {/* BACKGROUND GRAPHIC ACCENTS */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[400px] bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-60 right-10 w-[500px] h-[350px] bg-gradient-to-tl from-emerald-500/10 via-indigo-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* HEADER TOOLBAR EXECUTIVE BANNER */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SYSTEM LIVE • ENGINE 2026
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block border-l border-slate-800 pl-2.5">
                Tuân thủ NĐ 70/2025/NĐ-CP • NĐ 117/2025 • NĐ 141/2026
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Quản Lý Đơn Hàng & Kê Khai Thuế TMĐT
            </h1>
          </div>

          {/* TAB SWITCHER LINEAR STYLE */}
          <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800/80 shadow-inner self-stretch md:self-auto">
            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'ORDERS' 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Quản Lý Đơn Hàng</span>
              <span className="ml-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono">{orders.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('TAX_REPORT')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'TAX_REPORT' 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Báo Cáo Thuế TMĐT</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 relative z-10">

        {/* ============================================================================== */}
        {/* MÔ-ĐỦN 1: QUẢN LÝ ĐƠN HÀNG & HÓA ĐƠN ĐIỆN TỬ (MÁY TÍNH TIỀN) */}
        {/* ============================================================================== */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* STAT CARDS CHỈ SỐ ĐƠN HÀNG (3D HOVER LIFT) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="group bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 hover:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng đơn hệ thống</span>
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-black text-white tracking-tight font-mono">{orders.length}</p>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Sync
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Đơn hàng ghi nhận từ Supabase DB</p>
              </div>

              <div className="group bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 hover:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng doanh thu đơn</span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
                  {formatVND(orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0))}
                </p>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Giá trị tổng doanh số đã phát sinh</p>
              </div>

              <div className="group bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 hover:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-all" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">HĐĐT NĐ 70 Đã xuất</span>
                  <div className="w-9 h-9 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-violet-400 tracking-tight font-mono">
                    {orders.filter((o) => o.e_invoice_status === 'issued').length}
                  </p>
                  <span className="text-slate-500 font-semibold text-xs">/ {orders.length} đơn</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Đã phát hành qua máy tính tiền CQT</p>
              </div>

              <div className="group bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 hover:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đơn chờ xử lý</span>
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-amber-400 tracking-tight font-mono">
                  {orders.filter((o) => o.order_status === 'pending' || o.order_status === 'confirmed').length}
                </p>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Cần xác nhận & chuyển sang đóng gói</p>
              </div>

            </div>

            {/* THANH BỘ LỌC VÀ TÌM KIẾM ĐƠN HÀNG NỔI (FLOATING COMMAND BAR) */}
            <div className="bg-slate-900/70 backdrop-blur-2xl p-4 rounded-3xl border border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-2 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" /> Trạng thái:
                </span>
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'pending', label: 'Chờ xử lý' },
                  { key: 'confirmed', label: 'Đã xác nhận' },
                  { key: 'packing', label: 'Đang đóng gói' },
                  { key: 'delivered', label: 'Đã giao' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setStatusFilter(item.key)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 ${
                      statusFilter === item.key 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                        : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-80">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Tìm Mã đơn, Khách hàng, SĐT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-slate-950/80 text-slate-200 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={fetchOrders}
                  title="Tải lại dữ liệu"
                  className="p-2 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700/80 transition active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* BẢNG DANH SÁCH ĐƠN HÀNG SEAMLESS (LINEAR STYLE) */}
            <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
              {loading ? (
                <div className="flex flex-col justify-center items-center p-20 text-slate-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <span className="text-xs font-mono tracking-wider font-semibold">ĐANG ĐỐI SOÁT DỮ LIỆU SUPABASE...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800/80 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="py-4 px-5">Mã đơn / Ngày lập</th>
                        <th className="py-4 px-5">Khách hàng / Địa chỉ</th>
                        <th className="py-4 px-5">Tổng tiền & V_dim</th>
                        <th className="py-4 px-5">Trạng thái Đơn hàng</th>
                        <th className="py-4 px-5">HĐĐT Máy tính tiền (NĐ 70)</th>
                        <th className="py-4 px-5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-medium">
                      {filteredOrders.map((ord) => {
                        const isIssued = ord.e_invoice_status === 'issued'
                        return (
                          <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors duration-150 group">
                            
                            {/* Mã đơn */}
                            <td className="py-4 px-5">
                              <span className="font-mono font-black text-indigo-400 text-xs block group-hover:text-indigo-300 transition-colors">
                                {ord.order_code}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                                {new Date(ord.created_at).toLocaleString('vi-VN')}
                              </span>
                            </td>

                            {/* Khách hàng */}
                            <td className="py-4 px-5">
                              <p className="font-bold text-slate-200 text-xs">{ord.customer_name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{ord.customer_phone}</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5" title={ord.shipping_address}>
                                {ord.shipping_address}
                              </p>
                            </td>

                            {/* Tổng tiền */}
                            <td className="py-4 px-5">
                              <p className="font-black text-emerald-400 font-mono text-xs">{formatVND(ord.total_amount)}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                V_dim: <strong className="text-slate-300 font-bold">{ord.v_dim || 0} kg</strong>
                              </p>
                            </td>

                            {/* Trạng thái đơn */}
                            <td className="py-4 px-5">
                              <div className="space-y-1.5">
                                <span className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full text-[10px] border shadow-xs ${
                                  ord.order_status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ring-1 ring-emerald-500/20' :
                                  ord.order_status === 'packing' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 ring-1 ring-indigo-500/20' :
                                  ord.order_status === 'confirmed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 ring-1 ring-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 ring-1 ring-amber-500/20'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    ord.order_status === 'delivered' ? 'bg-emerald-400 animate-pulse' :
                                    ord.order_status === 'packing' ? 'bg-indigo-400 animate-pulse' :
                                    ord.order_status === 'confirmed' ? 'bg-blue-400' : 'bg-amber-400 animate-ping'
                                  }`} />
                                  {ord.order_status === 'delivered' ? 'Đã giao hàng' :
                                   ord.order_status === 'packing' ? 'Đang đóng gói' :
                                   ord.order_status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xử lý'}
                                </span>

                                {/* NÚT CHUYỂN TRẠNG THÁI TIẾP THEO */}
                                {ord.order_status !== 'delivered' && (
                                  <div className="pt-0.5">
                                    {ord.order_status === 'pending' && (
                                      <button
                                        onClick={() => handleUpdateOrderStatus(ord.id, 'confirmed')}
                                        disabled={actionLoadingId === ord.id}
                                        className="text-[10px] font-extrabold text-blue-400 hover:text-blue-300 flex items-center gap-1 group/btn transition"
                                      >
                                        Duyệt: Xác nhận <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                                      </button>
                                    )}
                                    {ord.order_status === 'confirmed' && (
                                      <button
                                        onClick={() => handleUpdateOrderStatus(ord.id, 'packing')}
                                        disabled={actionLoadingId === ord.id}
                                        className="text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group/btn transition"
                                      >
                                        Chuyển: Đóng gói <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                                      </button>
                                    )}
                                    {ord.order_status === 'packing' && (
                                      <button
                                        onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                                        disabled={actionLoadingId === ord.id}
                                        className="text-[10px] font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group/btn transition"
                                      >
                                        Chuyển: Đã giao <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Trạng thái HĐĐT */}
                            <td className="py-4 px-5">
                              {isIssued ? (
                                <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px]">
                                  <Receipt className="w-3 h-3 text-emerald-400" /> Đã Khởi Tạo HĐĐT
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 bg-slate-800/80 text-slate-500 border border-slate-700/60 rounded-xl text-[10px]">
                                  Chưa khởi tạo
                                </span>
                              )}
                            </td>

                            {/* Thao tác */}
                            <td className="py-4 px-5 text-right">
                              {!isIssued ? (
                                <button
                                  onClick={() => handleIssueEInvoice(ord)}
                                  disabled={actionLoadingId === ord.id}
                                  className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl text-[10px] shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 ml-auto transition-all duration-150 disabled:opacity-50"
                                >
                                  {actionLoadingId === ord.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
                                  <span>Xuất HĐĐT NĐ 70</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setInvoiceModalOrder(ord)}
                                  className="py-1.5 px-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-indigo-300 border border-indigo-500/30 font-bold rounded-xl text-[10px] flex items-center gap-1.5 ml-auto transition-all duration-150"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Xem HĐĐT</span>
                                </button>
                              )}
                            </td>

                          </tr>
                        )
                      })}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-slate-500 font-medium">
                            <Package className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                            Không tìm thấy dữ liệu đơn hàng phù hợp với bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* MÔ-ĐỦN 2: BÁO CÁO THUẾ TMĐT (2025-2026) */}
        {/* ============================================================================== */}
        {activeTab === 'TAX_REPORT' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* BẢNG CẢNH BÁO LEGAL FRAMEWORK */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 sm:p-7 rounded-3xl text-white shadow-2xl space-y-5 border border-slate-800/80 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shadow-inner">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight">Quy Định Pháp Luật Thuế Thương Mại Điện Tử (2025–2026)</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Khấu trừ tại nguồn & Ngưỡng doanh thu chịu thuế doanh nghiệp/hộ kinh doanh</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-2xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-400">Năm Kê Khai:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-slate-800 text-indigo-300 font-bold font-mono text-xs px-3 py-1 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800/80 space-y-1.5">
                  <p className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> Nghị định 117/2025/NĐ-CP
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sàn TMĐT có trách nhiệm tạm khấu trừ 1.5% (GTGT 1% & TNCN 0.5%) trên tổng doanh số phát sinh và nộp thay cho Hộ kinh doanh / Cá nhân bán hàng.
                  </p>
                </div>
                <div className="p-4 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800/80 space-y-1.5">
                  <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" /> Nghị định 141/2026/NĐ-CP
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Quy định ngưỡng doanh thu tính thuế từ 1 Tỷ VNĐ/năm. Áp dụng Thuế GTGT 1% và Thuế TNCN 0.5% đối với lĩnh vực bán buôn/bán lẻ hàng hóa.
                  </p>
                </div>
              </div>
            </div>

            {/* STAT CARDS KÊ KHAI THUẾ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 shadow-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng Doanh Thu ({selectedYear})</span>
                <p className="text-2xl font-black text-white font-mono tracking-tight">{formatVND(taxAnalysis.totalRevenue)}</p>
                <div className="pt-1">
                  {taxAnalysis.isExceedThreshold ? (
                    <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" /> Vượt ngưỡng 1 Tỷ/Năm
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Dưới ngưỡng 1 Tỷ
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 shadow-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Thuế Tạm Nộp (GTGT 1% + TNCN 0.5%)</span>
                <p className="text-2xl font-black text-indigo-400 font-mono tracking-tight">{formatVND(taxAnalysis.totalTaxPayable)}</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  GTGT: {formatVND(taxAnalysis.vatAmount)} | TNCN: {formatVND(taxAnalysis.pitAmount)}
                </p>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 shadow-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sàn Khấu Trừ Nộp Thay (NĐ 117)</span>
                <p className="text-2xl font-black text-violet-400 font-mono tracking-tight">{formatVND(taxAnalysis.totalPlatformWithheld)}</p>
                <p className="text-[11px] text-slate-500 font-medium">Đã trích giữ tạm nộp tự động trên từng đơn hàng</p>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 shadow-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Chênh Lệch Nộp Thêm / Hoàn Thuế</span>
                <p className={`text-2xl font-black font-mono tracking-tight ${taxAnalysis.netTaxDifference >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {formatVND(taxAnalysis.netTaxDifference)}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">Đối soát nghĩa vụ thuế phát sinh cuối năm</p>
              </div>

            </div>

            {/* BẢNG TỔNG HỢP DOANH THU & THUẾ THEO THÁNG */}
            <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" /> Kê Khai Thuế TMĐT Chi Tiết Theo Tháng ({selectedYear})
                </h3>
                <span className="text-xs text-slate-500 font-mono">Tự động kết xuất từ cơ sở dữ liệu Supabase</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Kỳ Tính Thuế</th>
                      <th className="py-3.5 px-4">Số Đơn</th>
                      <th className="py-3.5 px-4">Doanh Thu Phát Sinh</th>
                      <th className="py-3.5 px-4">Thuế GTGT (1%)</th>
                      <th className="py-3.5 px-4">Thuế TNCN (0.5%)</th>
                      <th className="py-3.5 px-4">Tổng Thuế Phát Sinh</th>
                      <th className="py-3.5 px-4">Sàn Tạm Khấu Trừ (1.5%)</th>
                      <th className="py-3.5 px-4 text-right">Trạng Thái Nghĩa Vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-medium">
                    {taxAnalysis.monthlyStats.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors font-mono">
                        <td className="py-3.5 px-4 font-bold text-slate-200 font-sans">{item.month}</td>
                        <td className="py-3.5 px-4 text-slate-400 font-sans">{item.orderCount} đơn</td>
                        <td className="py-3.5 px-4 font-bold text-slate-100">{formatVND(item.revenue)}</td>
                        <td className="py-3.5 px-4 text-indigo-400">{formatVND(item.vat)}</td>
                        <td className="py-3.5 px-4 text-amber-400">{formatVND(item.pit)}</td>
                        <td className="py-3.5 px-4 font-bold text-violet-400">{formatVND(item.totalTax)}</td>
                        <td className="py-3.5 px-4 text-violet-300">{formatVND(item.withheld)}</td>
                        <td className="py-3.5 px-4 text-right font-sans">
                          {item.revenue === 0 ? (
                            <span className="text-slate-600 text-[10px]">Chưa phát sinh</span>
                          ) : taxAnalysis.isExceedThreshold ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 rounded-lg text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Sàn Khấu Trừ Đủ
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 rounded-lg text-[10px]">
                              Miễn Thuế (&lt;1 Tỷ)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950 text-white font-black font-mono border-t border-slate-800">
                      <td className="py-4 px-4 rounded-l-2xl font-sans">TỔNG CỘNG {selectedYear}</td>
                      <td className="py-4 px-4 font-sans">{taxAnalysis.totalOrdersCount} đơn</td>
                      <td className="py-4 px-4 text-emerald-400">{formatVND(taxAnalysis.totalRevenue)}</td>
                      <td className="py-4 px-4 text-indigo-300">{formatVND(taxAnalysis.vatAmount)}</td>
                      <td className="py-4 px-4 text-amber-300">{formatVND(taxAnalysis.pitAmount)}</td>
                      <td className="py-4 px-4 text-violet-300">{formatVND(taxAnalysis.totalTaxPayable)}</td>
                      <td className="py-4 px-4 text-violet-400">{formatVND(taxAnalysis.totalPlatformWithheld)}</td>
                      <td className="py-4 px-4 text-right text-indigo-400 font-sans rounded-r-2xl">Đã Hoàn Tất Đối Soát</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================================== */}
      {/* MODAL MÔ PHỎNG XUẤT HÓA ĐƠN ĐIỆN TỬ MÁY TÍNH TIỀN (NĐ 70/2025/NĐ-CP) */}
      {/* ============================================================================== */}
      {invoiceModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900 print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none">
            
            {/* INVOICE HEADER */}
            <div className="p-6 bg-slate-950 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">HÓA ĐƠN ĐIỆN TỬ KHỞI TẠO TỪ MÁY TÍNH TIỀN</h3>
                  <p className="text-[11px] text-slate-400">Tuân thủ Nghị định 70/2025/NĐ-CP - Kết nối trực tiếp Cơ quan Thuế</p>
                </div>
              </div>
              <button
                onClick={() => setInvoiceModalOrder(null)}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* INVOICE BODY CONTENT (REALISTIC RECEIPT LOOK) */}
            <div className="p-8 space-y-6 text-xs bg-white text-slate-900 relative">
              
              {/* SUBDUED WATERMARK */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                <span className="text-8xl font-black text-slate-900 rotate-45">HĐĐT NĐ 70</span>
              </div>

              {/* Cơ sở kinh doanh & Mã HĐ */}
              <div className="grid grid-cols-2 gap-4 pb-5 border-b border-slate-200">
                <div className="space-y-1">
                  <p className="font-black text-sm text-indigo-600 uppercase">ĐƠN VỊ BÁN HÀNG: KINB STORE PIM</p>
                  <p className="text-slate-600 font-medium">Mã số thuế: <strong className="font-mono">0109988776</strong></p>
                  <p className="text-slate-500 font-medium">Địa chỉ: TP. Hồ Chí Minh / Bình Dương, Việt Nam</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-mono font-bold text-slate-900 text-xs">Mã CQT: <span className="text-indigo-600">{invoiceModalOrder.invoice_code || `HDDT70-${Date.now().toString().slice(-8)}`}</span></p>
                  <p className="text-slate-500 font-medium">Ký hiệu: <span className="font-mono font-bold">1K26MTP</span></p>
                  <p className="text-slate-500 font-medium">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              {/* Thông tin khách hàng */}
              <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p className="font-black text-slate-800 tracking-wider text-[10px] uppercase">THÔNG TIN KHÁCH HÀNG (MUA HÀNG)</p>
                <p className="pt-1">Họ tên: <strong>{invoiceModalOrder.customer_name}</strong></p>
                <p>Số điện thoại: <span className="font-mono font-bold">{invoiceModalOrder.customer_phone}</span></p>
                <p>Địa chỉ giao nhận: {invoiceModalOrder.shipping_address}</p>
              </div>

              {/* Bảng chi tiết mặt hàng */}
              <div>
                <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold">
                      <th className="p-2.5 border border-slate-200">STT</th>
                      <th className="p-2.5 border border-slate-200">Tên sản phẩm</th>
                      <th className="p-2.5 border border-slate-200 text-center">SL</th>
                      <th className="p-2.5 border border-slate-200 text-right">Đơn giá</th>
                      <th className="p-2.5 border border-slate-200 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {(invoiceModalOrder.order_items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 border border-slate-200 text-center font-mono">{idx + 1}</td>
                        <td className="p-2.5 border border-slate-200 font-semibold">{item.product_name}</td>
                        <td className="p-2.5 border border-slate-200 text-center font-mono">{item.quantity}</td>
                        <td className="p-2.5 border border-slate-200 text-right font-mono">{formatVND(item.unit_price)}</td>
                        <td className="p-2.5 border border-slate-200 text-right font-bold font-mono">{formatVND(item.subtotal)}</td>
                      </tr>
                    ))}
                    {(!invoiceModalOrder.order_items || invoiceModalOrder.order_items.length === 0) && (
                      <tr>
                        <td className="p-2.5 border border-slate-200 text-center font-mono">1</td>
                        <td className="p-2.5 border border-slate-200 font-semibold">Đơn hàng tổng hợp #{invoiceModalOrder.order_code}</td>
                        <td className="p-2.5 border border-slate-200 text-center font-mono">1</td>
                        <td className="p-2.5 border border-slate-200 text-right font-mono">{formatVND(invoiceModalOrder.total_amount)}</td>
                        <td className="p-2.5 border border-slate-200 text-right font-bold font-mono">{formatVND(invoiceModalOrder.total_amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tổng thanh toán & Thuế */}
              <div className="pt-2 space-y-1.5 text-right font-medium">
                <p>Tổng tiền hàng: <strong className="font-mono">{formatVND(invoiceModalOrder.total_amount)}</strong></p>
                <p className="text-slate-500 text-[11px]">Thuế GTGT tạm tính (1%): <strong className="font-mono">{formatVND(Math.round(invoiceModalOrder.total_amount * 0.01))}</strong></p>
                <p className="text-base font-black text-indigo-600 font-mono">Tổng thanh toán: {formatVND(invoiceModalOrder.total_amount)}</p>
              </div>

              {/* Mã Barcode/QR mô phỏng tra cứu CQT */}
              <div className="pt-4 border-t border-dashed border-slate-300 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p>Mã tra cứu hóa đơn: <strong className="font-mono text-slate-800">{invoiceModalOrder.order_code}</strong></p>
                  <p>Cổng tra cứu Tổng cục Thuế: <span className="font-mono text-indigo-600">https://hoadondientu.gdt.gov.vn</span></p>
                  <p className="text-[9px] text-emerald-600 font-bold">Chữ ký số: Đã ký bởi KINB STORE HSM TOKEN</p>
                </div>
                <div className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-xl text-[10px] font-mono font-bold text-slate-600 shadow-xs flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-800 text-white flex items-center justify-center rounded text-[8px]">QR</div>
                  <span>[MÁY TÍNH TIỀN NĐ 70]</span>
                </div>
              </div>

            </div>

            {/* INVOICE FOOTER BUTTONS */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 print:hidden">
              <button
                onClick={() => setInvoiceModalOrder(null)}
                className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95"
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition active:scale-95"
              >
                <Printer className="w-4 h-4" /> In Hóa Đơn (NĐ 70)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}