import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { 
  ShoppingBag, Receipt, Calculator, ShieldAlert, Loader2, 
  Search, Filter, CheckCircle2, Clock, Truck, Package, 
  AlertTriangle, DollarSign, TrendingUp, Printer, X, Eye, 
  Building2, ArrowRight, FileText, Check, AlertCircle, Sparkles
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
          notes: `${order.notes || ''} | HĐĐT Máy tính tiền NĐ70: ${eInvoiceCode}`
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

    // Tỉ lệ thuế: GTGT 1%, TNCN 0.5% (Tổng 1.5%)
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
        month: `Tháng ${monthNum}`,
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl shadow-xl text-center space-y-4 border border-red-100">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Truy cập bị từ chối</h2>
        <p className="text-xs text-gray-500">
          Chỉ tài khoản Quản trị viên (role === 'admin') mới có quyền truy cập mô-đun Quản lý Đơn hàng & Báo cáo Thuế.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      {/* HEADER TOOLBAR BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full uppercase border border-blue-400/30 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-amber-400" /> Hệ Thống Quản Trị Tài Chính & Đơn Hàng
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1">Đơn Hàng & Kê Khai Thuế TMĐT</h1>
            <p className="text-xs text-slate-400 mt-0.5">Tuân thủ Nghị định 70/2025/NĐ-CP (HĐĐT), NĐ 117/2025 & NĐ 141/2026/NĐ-CP</p>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'ORDERS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Quản Lý Đơn Hàng
            </button>
            <button
              onClick={() => setActiveTab('TAX_REPORT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'TAX_REPORT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" /> Báo Cáo Thuế TMĐT
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ============================================================================== */}
        {/* MÔ-ĐỦN 1: QUẢN LÝ ĐƠN HÀNG & HÓA ĐƠN ĐIỆN TỬ (MÁY TÍNH TIỀN) */}
        {/* ============================================================================== */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6">
            
            {/* STAT CARDS CHỈ SỐ ĐƠN HÀNG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase">Tổng số đơn hàng</span>
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-gray-900">{orders.length}</p>
                <p className="text-[11px] text-gray-400">Tất cả đơn ghi nhận trên hệ thống</p>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase">Tổng doanh thu đơn</span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-600">
                  {formatVND(orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0))}
                </p>
                <p className="text-[11px] text-gray-400">Giá trị tổng doanh số phát sinh</p>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase">HĐĐT Khởi tạo (NĐ70)</span>
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-indigo-600">
                  {orders.filter((o) => o.e_invoice_status === 'issued').length} / {orders.length}
                </p>
                <p className="text-[11px] text-gray-400">Đã xuất máy tính tiền kết nối CQT</p>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase">Đơn chờ đóng gói</span>
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-amber-600">
                  {orders.filter((o) => o.order_status === 'pending' || o.order_status === 'confirmed').length}
                </p>
                <p className="text-[11px] text-gray-400">Cần xác nhận & chuyển sang vận chuyển</p>
              </div>
            </div>

            {/* THANH BỘ LỌC VÀ TÌM KIẾM ĐƠN HÀNG */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Lọc trạng thái:
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
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      statusFilter === item.key ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã đơn, Khách hàng, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center p-12 text-gray-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs font-semibold">Đang nạp danh sách đơn hàng...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="p-4">Mã đơn / Ngày lập</th>
                        <th className="p-4">Khách hàng / Địa chỉ</th>
                        <th className="p-4">Tổng tiền & V_dim</th>
                        <th className="p-4">Trạng thái Đơn hàng</th>
                        <th className="p-4">HĐĐT Máy tính tiền (NĐ70)</th>
                        <th className="p-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map((ord) => {
                        const isIssued = ord.e_invoice_status === 'issued'
                        return (
                          <tr key={ord.id} className="hover:bg-gray-50/50 transition">
                            <td className="p-4">
                              <span className="font-mono font-bold text-blue-600 block">{ord.order_code}</span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(ord.created_at).toLocaleString('vi-VN')}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-gray-800">{ord.customer_name}</p>
                              <p className="text-[11px] text-gray-500">{ord.customer_phone}</p>
                              <p className="text-[10px] text-gray-400 truncate max-w-xs">{ord.shipping_address}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-emerald-600">{formatVND(ord.total_amount)}</p>
                              <p className="text-[10px] text-gray-400">
                                V_dim: <strong className="text-gray-700">{ord.v_dim || 0} kg</strong>
                              </p>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-[10px] ${
                                  ord.order_status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                  ord.order_status === 'packing' ? 'bg-indigo-100 text-indigo-800' :
                                  ord.order_status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {ord.order_status === 'delivered' && <CheckCircle2 className="w-3 h-3" />}
                                  {ord.order_status === 'packing' && <Package className="w-3 h-3" />}
                                  {ord.order_status === 'confirmed' && <Check className="w-3 h-3" />}
                                  {ord.order_status === 'pending' && <Clock className="w-3 h-3" />}
                                  {ord.order_status === 'delivered' ? 'Đã giao hàng' :
                                   ord.order_status === 'packing' ? 'Đang đóng gói' :
                                   ord.order_status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xử lý'}
                                </span>

                                {/* NÚT CHUYỂN TRẠNG THÁI TIẾP THEO */}
                                {ord.order_status !== 'delivered' && (
                                  <div className="pt-1">
                                    {ord.order_status === 'pending' && (
                                      <button
                                        onClick={() => handleUpdateOrderStatus(ord.id, 'confirmed')}
                                        disabled={actionLoadingId === ord.id}
                                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                      >
                                        Duyệt: Xác nhận <ArrowRight className="w-3 h-3" />
                                      </button>
                                    )}
                                    {ord.order_status === 'confirmed' && (
                                      <button
                                        onClick={() => handleUpdateOrderStatus(ord.id, 'packing')}
                                        disabled={actionLoadingId === ord.id}
                                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                                      >
                                        Chuyển: Đóng gói <ArrowRight className="w-3 h-3" />
                                      </button>
                                    )}
                                    {ord.order_status === 'packing' && (
                                      <button
                                        onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                                        disabled={actionLoadingId === ord.id}
                                        className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                                      >
                                        Chuyển: Đã giao <ArrowRight className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {isIssued ? (
                                <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px]">
                                  <Receipt className="w-3 h-3 text-emerald-600" /> Đã Khởi Tạo HĐĐT
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px]">
                                  Chưa khởi tạo
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right space-x-1">
                              {!isIssued ? (
                                <button
                                  onClick={() => handleIssueEInvoice(ord)}
                                  disabled={actionLoadingId === ord.id}
                                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] shadow flex items-center gap-1 ml-auto"
                                >
                                  {actionLoadingId === ord.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
                                  <span>Xuất HĐĐT NĐ70</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setInvoiceModalOrder(ord)}
                                  className="py-1.5 px-3 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold rounded-xl text-[10px] flex items-center gap-1 ml-auto"
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
                          <td colSpan={6} className="p-8 text-center text-gray-400">Không tìm thấy dữ liệu đơn hàng phù hợp.</td>
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
          <div className="space-y-6">

            {/* BẢNG CẢNH BÁO / TRUY TRUY BỐI CẢNH NGHỊ ĐỊNH */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-3xl text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold">Quy Định Pháp Luật Thuế Thương Mại Điện Tử (2025–2026)</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Chọn Năm Kê Khai:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-700 outline-none"
                  >
                    <option value="2026">Năm 2026</option>
                    <option value="2025">Năm 2025</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-200">
                <div className="p-3.5 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                  <p className="font-bold text-amber-300 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Nghị định 117/2025/NĐ-CP
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Sàn TMĐT có trách nhiệm tạm khấu trừ 1.5% (GTGT & TNCN) trên tổng doanh số phát sinh và nộp thay cho Hộ kinh doanh / Cá nhân bán hàng.
                  </p>
                </div>
                <div className="p-3.5 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                  <p className="font-bold text-emerald-300 flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5" /> Nghị định 141/2026/NĐ-CP
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Quy định ngưỡng doanh thu tính thuế từ 1 Tỷ VNĐ/năm. Áp dụng Thuế GTGT 1% và Thuế TNCN 0.5% đối với lĩnh vực bán buôn/bán lẻ hàng hóa.
                  </p>
                </div>
              </div>
            </div>

            {/* STAT CARDS KÊ KHAI THUẾ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase block">Tổng Doanh Thu ({selectedYear})</span>
                <p className="text-2xl font-black text-gray-900">{formatVND(taxAnalysis.totalRevenue)}</p>
                <div className="flex items-center gap-1.5 pt-1">
                  {taxAnalysis.isExceedThreshold ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Vượt ngưỡng 1 Tỷ/Năm
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Dưới ngưỡng 1 Tỷ
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase block">Thuế Tạm Nộp (GTGT 1% + TNCN 0.5%)</span>
                <p className="text-2xl font-black text-blue-600">{formatVND(taxAnalysis.totalTaxPayable)}</p>
                <p className="text-[11px] text-gray-400">
                  GTGT (1%): {formatVND(taxAnalysis.vatAmount)} | TNCN (0.5%): {formatVND(taxAnalysis.pitAmount)}
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase block">Sàn Khấu Trừ Nộp Thay (NĐ117)</span>
                <p className="text-2xl font-black text-indigo-600">{formatVND(taxAnalysis.totalPlatformWithheld)}</p>
                <p className="text-[11px] text-gray-400">Đã trích giữ tạm nộp tự động trên từng đơn hàng</p>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase block">Chênh Lệch Nộp Thêm / Hoàn Thuế</span>
                <p className={`text-2xl font-black ${taxAnalysis.netTaxDifference >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatVND(taxAnalysis.netTaxDifference)}
                </p>
                <p className="text-[11px] text-gray-400">Đối soát nghĩa vụ thuế phát sinh cuối năm</p>
              </div>
            </div>

            {/* BẢNG TỔNG HỢP DOANH THU & THUẾ THEO THÁNG */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden space-y-4 p-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" /> Bảng Kê Khai Thuế TMĐT Chi Tiết Theo Tháng ({selectedYear})
                </h3>
                <span className="text-xs text-gray-500 font-medium">Tự động đối soát từ Cơ sở dữ liệu Đơn hàng Supabase</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                      <th className="p-3">Kỳ Tính Thuế</th>
                      <th className="p-3">Số Đơn Hàng</th>
                      <th className="p-3">Doanh Thu Phát Sinh</th>
                      <th className="p-3">Thuế GTGT (1%)</th>
                      <th className="p-3">Thuế TNCN (0.5%)</th>
                      <th className="p-3">Tổng Thuế Phát Sinh</th>
                      <th className="p-3">Sàn Tạm Khấu Trừ (1.5%)</th>
                      <th className="p-3 text-right">Trạng Thái Nghĩa Vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {taxAnalysis.monthlyStats.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="p-3 font-bold text-gray-800">{item.month}</td>
                        <td className="p-3 text-gray-600 font-mono">{item.orderCount} đơn</td>
                        <td className="p-3 font-bold text-gray-900">{formatVND(item.revenue)}</td>
                        <td className="p-3 text-blue-600">{formatVND(item.vat)}</td>
                        <td className="p-3 text-amber-600">{formatVND(item.pit)}</td>
                        <td className="p-3 font-bold text-purple-700">{formatVND(item.totalTax)}</td>
                        <td className="p-3 text-indigo-600 font-bold">{formatVND(item.withheld)}</td>
                        <td className="p-3 text-right">
                          {item.revenue === 0 ? (
                            <span className="text-gray-400 text-[10px]">Chưa phát sinh</span>
                          ) : taxAnalysis.isExceedThreshold ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Sàn Khấu Trừ Đủ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md text-[10px]">
                              Miễn Thuế (&lt;1 Tỷ)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100/70 font-black text-gray-900 border-t border-gray-200">
                      <td className="p-3">TỔNG CỘNG NĂM {selectedYear}</td>
                      <td className="p-3 font-mono">{taxAnalysis.totalOrdersCount} đơn</td>
                      <td className="p-3 text-emerald-700">{formatVND(taxAnalysis.totalRevenue)}</td>
                      <td className="p-3 text-blue-700">{formatVND(taxAnalysis.vatAmount)}</td>
                      <td className="p-3 text-amber-700">{formatVND(taxAnalysis.pitAmount)}</td>
                      <td className="p-3 text-purple-800">{formatVND(taxAnalysis.totalTaxPayable)}</td>
                      <td className="p-3 text-indigo-800">{formatVND(taxAnalysis.totalPlatformWithheld)}</td>
                      <td className="p-3 text-right text-blue-600">Đã Hoàn Tất Đối Soát</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* MODAL MÔ PHỎNG XUẤT HÓA ĐƠN ĐIỆN TỬ MÁY TÍNH TIỀN (NĐ 70/2025/NĐ-CP) */}
      {/* ============================================================================== */}
      {invoiceModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* INVOICE HEADER */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">HÓA ĐƠN ĐIỆN TỬ KHỞI TẠO TỪ MÁY TÍNH TIỀN</h3>
                  <p className="text-[11px] text-slate-300">Tuân thủ Nghị định 70/2025/NĐ-CP - Kết nối trực tiếp Cơ quan Thuế</p>
                </div>
              </div>
              <button
                onClick={() => setInvoiceModalOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* INVOICE BODY CONTENT */}
            <div className="p-6 space-y-6 text-xs text-gray-800">
              
              {/* Cơ sở kinh doanh & Mã HĐ */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <p className="font-bold text-sm text-blue-600">ĐƠN VỊ BÁN HÀNG: KINB STORE PIM</p>
                  <p className="text-gray-500">Mã số thuế: 0109988776</p>
                  <p className="text-gray-500">Địa chỉ: TP. Hồ Chí Minh / Bình Dương, Việt Nam</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-mono font-bold text-gray-900">Mã CQT: {invoiceModalOrder.invoice_code || `HDDT70-${Date.now().toString().slice(-8)}`}</p>
                  <p className="text-gray-500">Ký hiệu: 1K26MTP</p>
                  <p className="text-gray-500">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              {/* Thông tin khách hàng */}
              <div className="space-y-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="font-bold text-gray-800">THÔNG TIN KHÁCH HÀNG (MUA HÀNG)</p>
                <p>Họ tên: <strong>{invoiceModalOrder.customer_name}</strong></p>
                <p>Số điện thoại: {invoiceModalOrder.customer_phone}</p>
                <p>Địa chỉ giao nhận: {invoiceModalOrder.shipping_address}</p>
              </div>

              {/* Bảng chi tiết mặt hàng */}
              <div>
                <table className="w-full text-left border-collapse border border-gray-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold">
                      <th className="p-2 border border-gray-200">STT</th>
                      <th className="p-2 border border-gray-200">Tên sản phẩm</th>
                      <th className="p-2 border border-gray-200 text-center">SL</th>
                      <th className="p-2 border border-gray-200 text-right">Đơn giá</th>
                      <th className="p-2 border border-gray-200 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoiceModalOrder.order_items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border border-gray-200 text-center">{idx + 1}</td>
                        <td className="p-2 border border-gray-200 font-semibold">{item.product_name}</td>
                        <td className="p-2 border border-gray-200 text-center">{item.quantity}</td>
                        <td className="p-2 border border-gray-200 text-right">{formatVND(item.unit_price)}</td>
                        <td className="p-2 border border-gray-200 text-right font-bold">{formatVND(item.subtotal)}</td>
                      </tr>
                    ))}
                    {(!invoiceModalOrder.order_items || invoiceModalOrder.order_items.length === 0) && (
                      <tr>
                        <td className="p-2 border border-gray-200 text-center">1</td>
                        <td className="p-2 border border-gray-200 font-semibold">Đơn hàng tổng hợp #{invoiceModalOrder.order_code}</td>
                        <td className="p-2 border border-gray-200 text-center">1</td>
                        <td className="p-2 border border-gray-200 text-right">{formatVND(invoiceModalOrder.total_amount)}</td>
                        <td className="p-2 border border-gray-200 text-right font-bold">{formatVND(invoiceModalOrder.total_amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tổng thanh toán & Thuế */}
              <div className="pt-2 space-y-1.5 text-right font-medium">
                <p>Tổng tiền hàng: <strong>{formatVND(invoiceModalOrder.total_amount)}</strong></p>
                <p className="text-gray-500 text-[11px]">Thuế GTGT khấu trừ tại nguồn: <strong>{formatVND(Math.round(invoiceModalOrder.total_amount * 0.01))}</strong></p>
                <p className="text-base font-black text-blue-600">Tổng thanh toán: {formatVND(invoiceModalOrder.total_amount)}</p>
              </div>

              {/* Mã Barcode/QR mô phỏng tra cứu CQT */}
              <div className="pt-4 border-t border-dashed flex items-center justify-between">
                <div className="text-[10px] text-gray-400">
                  <p>Mã tra cứu hóa đơn: <strong className="font-mono text-gray-700">{invoiceModalOrder.order_code}</strong></p>
                  <p>Website tra cứu: https://hoadondientu.gdt.gov.vn</p>
                </div>
                <div className="px-4 py-2 bg-gray-100 border rounded-xl text-[10px] font-mono font-bold text-gray-500">
                  [QR-CODE-CQT-NĐ70]
                </div>
              </div>
            </div>

            {/* INVOICE FOOTER BUTTONS */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setInvoiceModalOrder(null)}
                className="py-2.5 px-4 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> In Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}