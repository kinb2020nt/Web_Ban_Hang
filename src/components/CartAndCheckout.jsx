import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { 
  ShoppingCart, Trash2, Truck, ShieldAlert, Package, 
  CreditCard, CheckCircle2, Loader2, ArrowLeft, Send 
} from 'lucide-react'

export default function CartAndCheckout({ items = [], onUpdateQuantity, onRemoveItem, onOrderSuccess }) {
  const { user, profile } = useAuth()
  
  const [customerName, setCustomerName] = useState(profile?.full_name || '')
  const [customerPhone, setCustomerPhone] = useState(profile?.phone_number || '')
  const [shippingAddress, setShippingAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [loading, setLoading] = useState(false)
  const [orderCompleteCode, setOrderCompleteCode] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // 1. TÍNH TOÁN V_DIM (THỂ TÍCH QUY ĐỔI) & TỔNG TIỀN HÀNG
  const logisticsAnalysis = useMemo(() => {
    let subtotal = 0
    let totalVDim = 0
    let hasDangerous = false
    let isBulky = false

    items.forEach((item) => {
      const price = item.sale_price || item.price || 0
      subtotal += price * item.quantity

      const attrs = item.dynamic_attributes || {}
      
      // Lấy kích thước (Dài x Rộng x Cao cm) từ thuộc tính động
      const l = Number(attrs.dai_cm || attrs.length || 20)
      const w = Number(attrs.rong_cm || attrs.width || 15)
      const h = Number(attrs.cao_cm || attrs.height || 10)

      // Công thức logistics chuẩn: V_dim = (D * R * C) / 5000 (kg)
      const itemVDim = ((l * w * h) / 5000) * item.quantity
      totalVDim += itemVDim

      // Kiểm tra cờ Hàng nguy hiểm & Cồng kềnh
      if (attrs.is_dangerous || attrs.dangerous_goods || attrs.lithium_battery) {
        hasDangerous = true
      }
      if (itemVDim > 5 || l > 100 || w > 100 || h > 100) {
        isBulky = true
      }
    })

    // Phân luồng tuyến vận chuyển & tính phí ship
    let shippingRoute = 'STANDARD'
    let baseShippingFee = 30000

    if (hasDangerous) {
      shippingRoute = 'DANGEROUS_GOODS'
      baseShippingFee = 65000 + Math.ceil(totalVDim) * 12000
    } else if (isBulky || totalVDim > 8) {
      shippingRoute = 'BULKY'
      baseShippingFee = 80000 + Math.ceil(totalVDim) * 15000
    } else {
      baseShippingFee = 30000 + Math.ceil(totalVDim) * 5000
    }

    const grandTotal = subtotal + baseShippingFee
    // Thuế tạm nộp kê khai ước tính 1% (Nghị định 117/2025/NĐ-CP)
    const taxPrepaid = Math.round(subtotal * 0.01)

    return {
      subtotal,
      totalVDim: Number(totalVDim.toFixed(2)),
      shippingRoute,
      shippingFee: baseShippingFee,
      grandTotal,
      taxPrepaid,
      hasDangerous,
      isBulky
    }
  }, [items])

  const formatVND = (amt) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt)

  // 2. XỬ LÝ LƯU ĐƠN HÀNG VÀO SUPABASE
  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (items.length === 0) return
    if (!customerName || !customerPhone || !shippingAddress) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng!')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const generatedCode = `ORD-${Date.now().toString().slice(-8)}`

      // Thêm vào bảng orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_code: generatedCode,
          user_id: user?.id || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
          total_amount: logisticsAnalysis.grandTotal,
          v_dim: logisticsAnalysis.totalVDim,
          e_invoice_status: 'pending',
          tax_prepaid_amount: logisticsAnalysis.taxPrepaid,
          order_status: 'pending',
          payment_status: 'unpaid',
          payment_method: paymentMethod,
          notes: `Tuyến VC: ${logisticsAnalysis.shippingRoute} | Phụ phí V_dim: ${logisticsAnalysis.totalVDim}kg`
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Thêm danh sách mặt hàng vào bảng order_items
      const orderItemsPayload = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.id && !item.id.startsWith('demo') ? item.id : null,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.sale_price || item.price,
        subtotal: (item.sale_price || item.price) * item.quantity
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload)
      if (itemsError) throw itemsError

      setOrderCompleteCode(generatedCode)
      if (onOrderSuccess) onOrderSuccess(generatedCode)
    } catch (err) {
      console.error('Lỗi đặt hàng:', err)
      setErrorMsg(err.message || 'Đặt hàng thất bại, vui lòng thử lại!')
    } finally {
      setLoading(false)
    }
  }

  // Màn hình Đặt hàng thành công
  if (orderCompleteCode) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl shadow-xl text-center space-y-4 border border-gray-100">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Đặt hàng thành công!</h2>
        <p className="text-xs text-gray-500">Mã đơn hàng của bạn là:</p>
        <div className="inline-block bg-blue-50 text-blue-700 font-mono font-bold text-lg px-4 py-2 rounded-xl">
          {orderCompleteCode}
        </div>
        <p className="text-xs text-gray-600">
          Cảm ơn bạn đã mua hàng. Hệ thống đã tự động ghi nhận dữ liệu cước vận chuyển và kê khai Hóa đơn điện tử.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-blue-600" /> Giỏ hàng & Thanh toán
      </h1>

      {items.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-gray-100 space-y-3">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-600">Giỏ hàng của bạn đang trống.</p>
          <a href="/" className="inline-block text-xs font-bold text-blue-600 hover:underline">
            Quay lại cửa hàng
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* DANH SÁCH MẶT HÀNG TRONG GIỎ (7 COLUMNS) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-sm font-bold text-gray-800 border-b pb-3">Sản phẩm đã chọn ({items.length})</h2>
              
              <div className="divide-y divide-gray-100">
                {items.map((item, idx) => {
                  const itemPrice = item.sale_price || item.price || 0
                  return (
                    <div key={idx} className="py-4 flex items-center gap-4">
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=150'}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-gray-800 truncate">{item.name}</h3>
                        <p className="text-xs text-blue-600 font-bold mt-1">{formatVND(itemPrice)}</p>
                      </div>

                      {/* Tăng giảm số lượng */}
                      <div className="flex items-center border rounded-lg bg-gray-50">
                        <button
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem && onRemoveItem(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* THÔNG TIN PHÂN LUỒNG VẬN CHUYỂN LOGISTICS */}
            <div className="bg-blue-50/70 p-5 rounded-3xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-600" /> Phân luồng Vận chuyển Logistics
                </span>
                <span className="text-xs font-mono font-bold bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                  V_dim: {logisticsAnalysis.totalVDim} kg
                </span>
              </div>

              <div className="text-xs text-blue-800 space-y-1">
                <p>• Công thức quy đổi thể tích: <strong>(Dài x Rộng x Cao) / 5000</strong></p>
                <p>• Loại tuyến: <strong>{logisticsAnalysis.shippingRoute}</strong></p>
                {logisticsAnalysis.hasDangerous && (
                  <p className="text-red-600 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Chứa sản phẩm Pin Lithium / Hóa chất (Giao đường bộ chuyên dụng)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* FORM THÔNG TIN GIAO HÀNG & THANH TOÁN (5 COLUMNS) */}
          <div className="lg:col-span-5">
            <form onSubmit={handlePlaceOrder} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-sm font-bold text-gray-800 border-b pb-3">Thông tin nhận hàng</h2>

              {errorMsg && (
                <div className="p-3 text-xs text-red-600 bg-red-50 rounded-xl border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Họ tên người nhận</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  required
                  placeholder="0901234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Địa chỉ giao hàng chi tiết</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hình thức thanh toán</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none bg-white"
                >
                  <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                  <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng (QR Code)</option>
                </select>
              </div>

              {/* BẢNG TỔNG KẾT TÍNH TIỀN */}
              <div className="pt-4 border-t space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Tiền hàng:</span>
                  <span>{formatVND(logisticsAnalysis.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển quy đổi V_dim:</span>
                  <span>{formatVND(logisticsAnalysis.shippingFee)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-[11px]">
                  <span>Thuế tạm nộp kê khai (1%):</span>
                  <span>{formatVND(logisticsAnalysis.taxPrepaid)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-blue-600 pt-2 border-t">
                  <span>Tổng thanh toán:</span>
                  <span>{formatVND(logisticsAnalysis.grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác nhận Đặt hàng</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}