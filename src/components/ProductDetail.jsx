import { useState } from 'react'
import { 
  Cpu, Wrench, Home, ShoppingCart, FileText, Sparkles, 
  Box, AlertTriangle, Download, Eye, CheckCircle2, 
  Minus, Plus, ShieldAlert, Zap, Layers, RefreshCw 
} from 'lucide-react'

export default function ProductDetail({ product, onAddToCart, onOpenRFQ }) {
  // Sản phẩm mẫu dự phòng nếu chưa truyền prop product
  const currentProduct = product || {
    id: 'demo-1',
    sku: 'IT-CPU-14700K',
    name: 'Bộ vi xử lý Intel Core i7-14700K (Up to 5.6GHz, 20 Nhân 28 Luồng)',
    category: 'IT',
    price: 10500000,
    sale_price: 9990000,
    stock_quantity: 15,
    description: 'Vi xử lý thế hệ 14 dành cho các hệ thống PC Gaming & AI Workstation hiệu năng cao, tối ưu công việc dựng phim và huấn luyện mô hình học máy.',
    images: ['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80'],
    dynamic_attributes: {
      socket: 'LGA1700',
      tdp: '125W',
      ram_support: 'DDR4 / DDR5',
      cores: 20,
      is_dangerous: false
    }
  }

  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(
    currentProduct.images?.[0] || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80'
  )
  const [activeModal, setActiveModal] = useState(null) // 'AI_CHECK' | 'CAD_3D' | 'AR_VIEW'

  const attrs = currentProduct.dynamic_attributes || {}

  // Kiểm tra cờ Hàng nguy hiểm (Lithium/Chemical/Hazmat)
  const isDangerousGoods = attrs.is_dangerous || attrs.dangerous_goods || attrs.lithium_battery

  // Định dạng tiền tệ VND
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, Math.min(prev + delta, currentProduct.stock_quantity || 99)))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. BREADCRUMB & DANH MỤC */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <a href="/" className="hover:text-blue-600">Trang chủ</a>
        <span>/</span>
        <span className="font-semibold text-gray-700">
          {currentProduct.category === 'IT' && 'Công nghệ IT'}
          {currentProduct.category === 'CO_KHI' && 'Dụng cụ Cơ khí'}
          {currentProduct.category === 'GIA_DUNG_NOI_THAT' && 'Gia dụng & Nội thất'}
        </span>
        <span>/</span>
        <span className="truncate max-w-xs">{currentProduct.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
        
        {/* 2. KHU VỰC HÌNH ẢNH SẢN PHẨM (LEFT COLUMN - 5 COLUMNS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 group">
            <img
              src={selectedImage}
              alt={currentProduct.name}
              className="w-full h-full object-contain object-center transition duration-300 group-hover:scale-105"
            />
            {/* Nhãn Hàng nguy hiểm (Hazmat) */}
            {isDangerousGoods && (
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                <ShieldAlert className="w-4 h-4" />
                <span>Hàng nguy hiểm (Pin / Hóa chất)</span>
              </div>
            )}
          </div>

          {/* Album ảnh nhỏ */}
          {currentProduct.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {currentProduct.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition ${
                    selectedImage === img ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. KHU VỰC THÔNG TIN & THUỘC TÍNH DYNAMIC (RIGHT COLUMN - 7 COLUMNS) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div>
            {/* SKU & Stock Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">
                SKU: {currentProduct.sku}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 ${
                currentProduct.stock_quantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {currentProduct.stock_quantity > 0 ? `Còn hàng (${currentProduct.stock_quantity})` : 'Hết hàng'}
              </span>
            </div>

            {/* Tiêu đề sản phẩm */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
              {currentProduct.name}
            </h1>

            {/* Giá bán */}
            <div className="mt-4 flex items-baseline gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-2xl sm:text-3xl font-black text-blue-600">
                {formatVND(currentProduct.sale_price || currentProduct.price)}
              </span>
              {currentProduct.sale_price && (
                <span className="text-sm text-gray-400 line-through font-medium">
                  {formatVND(currentProduct.price)}
                </span>
              )}
            </div>

            {/* CẢNH BẢO CHI TIẾT NẾU LÀ HÀNG NGUY HIỂM */}
            {isDangerousGoods && (
              <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-0.5">
                  <p className="font-bold">Lưu ý Vận chuyển Hàng nguy hiểm (DG):</p>
                  <p>Sản phẩm có chứa Pin Lithium / Hóa chất dễ cháy. Phụ phí vận chuyển và thời gian giao nhận có thể điều chỉnh theo quy định hàng không.</p>
                </div>
              </div>
            )}

            {/* ============================================================================== */}
            {/* SMART PIM: HIỂN THỊ THUỘC TÍNH NĂNG ĐỘNG TƯƠNG ỨNG TỪNG NGÀNH HÀNG */}
            {/* ============================================================================== */}
            <div className="mt-6 border-t border-b border-gray-100 py-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Thông số kỹ thuật PIM ({currentProduct.category})
              </h3>

              {/* NGÀNH IT */}
              {currentProduct.category === 'IT' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                      <span className="text-[11px] text-gray-500 block">Socket CPU</span>
                      <span className="text-sm font-bold text-blue-900">{attrs.socket || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                      <span className="text-[11px] text-gray-500 block">Công suất TDP</span>
                      <span className="text-sm font-bold text-blue-900">{attrs.tdp || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                      <span className="text-[11px] text-gray-500 block">Hỗ trợ RAM</span>
                      <span className="text-sm font-bold text-blue-900">{attrs.ram_support || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Nút Tính năng AI Check Tương thích */}
                  <button
                    onClick={() => setActiveModal('AI_CHECK')}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                    <span>Build PC AI Check Tương thích Socket & TDP</span>
                  </button>
                </div>
              )}

              {/* NGÀNH CƠ KHÍ */}
              {currentProduct.category === 'CO_KHI' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                      <span className="text-[11px] text-gray-500 block">Chuẩn ren</span>
                      <span className="text-sm font-bold text-amber-900">{attrs.chuan_ren || 'M8 / Tiêu chuẩn'}</span>
                    </div>
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                      <span className="text-[11px] text-gray-500 block">Cấp bền</span>
                      <span className="text-sm font-bold text-amber-900">{attrs.cap_ben || '8.8 / 10.9'}</span>
                    </div>
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                      <span className="text-[11px] text-gray-500 block">Lực siết đề xuất</span>
                      <span className="text-sm font-bold text-amber-900">{attrs.luc_siet || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Nút Tải file CAD / Sơ đồ 3D */}
                  <button
                    onClick={() => setActiveModal('CAD_3D')}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải file bản vẽ CAD (.STEP / .DWG) & Sơ đồ 3D</span>
                  </button>
                </div>
              )}

              {/* NGÀNH GIA DỤNG / NỘI THẤT */}
              {currentProduct.category === 'GIA_DUNG_NOI_THAT' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[11px] text-gray-500 block">Kích thước (D x R x C)</span>
                      <span className="text-sm font-bold text-emerald-900">
                        {attrs.dai_cm && attrs.rong_cm && attrs.cao_cm 
                          ? `${attrs.dai_cm} x ${attrs.rong_cm} x ${attrs.cao_cm} cm` 
                          : attrs.kich_thuoc || 'Tiêu chuẩn'}
                      </span>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[11px] text-gray-500 block">Tải trọng tối đa</span>
                      <span className="text-sm font-bold text-emerald-900">{attrs.tai_trong || '100 kg'}</span>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[11px] text-gray-500 block">Chất liệu</span>
                      <span className="text-sm font-bold text-emerald-900">{attrs.chat_lieu || 'Cao cấp'}</span>
                    </div>
                  </div>

                  {/* Nút Xem 3D AR 1:1 */}
                  <button
                    onClick={() => setActiveModal('AR_VIEW')}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Trải nghiệm Xem mô hình 3D AR 1:1 trong phòng</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mô tả ngắn */}
            <div className="mt-4 text-xs text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-800 mb-1">Mô tả sản phẩm:</p>
              <p>{currentProduct.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}</p>
            </div>
          </div>

          {/* 4. BỘ CHỌN SỐ LƯỢNG & NÚT BẤM ĐẶT HÀNG / BÁO GIÁ RFQ */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-700">Số lượng:</span>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="p-2 hover:bg-gray-200 text-gray-600 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-gray-800 min-w-[40px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="p-2 hover:bg-gray-200 text-gray-600 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CẶP NÚT BẤM HÀNH ĐỘNG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onAddToCart && onAddToCart(currentProduct, quantity)}
                className="py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md flex items-center justify-center gap-2 transition"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Thêm vào giỏ hàng</span>
              </button>

              <button
                onClick={() => onOpenRFQ && onOpenRFQ(currentProduct, quantity)}
                className="py-3 px-5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs shadow-md flex items-center justify-center gap-2 transition"
              >
                <FileText className="w-4 h-4" />
                <span>Yêu cầu Báo giá B2B (RFQ)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* MODAL GIẢ LẬP TÍNH NĂNG TƯƠNG TÁC (AI CHECK / CAD 3D / AR VIEW) */}
      {/* ============================================================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full"
            >
              ✕
            </button>

            {/* MODAL BUILD PC AI */}
            {activeModal === 'AI_CHECK' && (
              <div className="space-y-3 text-center">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Kiểm tra Tương thích PC bằng AI</h3>
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-left space-y-1.5 font-mono text-gray-700">
                  <p>✔ Socket: <strong className="text-blue-600">{attrs.socket}</strong> (Đã xác thực)</p>
                  <p>✔ TDP: <strong className="text-blue-600">{attrs.tdp}</strong> (Yêu cầu Tản nhiệt nước 240mm+)</p>
                  <p>✔ RAM: <strong className="text-blue-600">{attrs.ram_support}</strong></p>
                  <p className="text-emerald-600 font-sans font-semibold pt-1">
                    👉 Đánh giá AI: Linh kiện hoàn toàn tương thích với Mainboard chipset Z790/B760.
                  </p>
                </div>
              </div>
            )}

            {/* MODAL CAD 3D */}
            {activeModal === 'CAD_3D' && (
              <div className="space-y-3 text-center">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Tải File Kỹ Thuật Cơ Khi CAD</h3>
                <p className="text-xs text-gray-500">Đang chuẩn bị gói dữ liệu bản vẽ kỹ thuật 2D/3D...</p>
                <div className="space-y-2">
                  <button className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold">
                    Tải file .STEP (Sơ đồ 3D CAD)
                  </button>
                  <button className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold">
                    Tải bản vẽ 2D .DWG (AutoCAD)
                  </button>
                </div>
              </div>
            )}

            {/* MODAL AR 1:1 */}
            {activeModal === 'AR_VIEW' && (
              <div className="space-y-3 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Thực tế ảo AR 1:1</h3>
                <p className="text-xs text-gray-500">
                  Quét mã QR dưới đây bằng Điện thoại di động để đặt mô hình sản phẩm đúng kích thước thực vào không gian căn phòng của bạn.
                </p>
                <div className="w-36 h-36 bg-gray-100 mx-auto rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <span className="text-[10px] font-bold text-gray-400">QR CODE AR SIMULATOR</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-gray-800 text-white rounded-xl text-xs font-bold mt-2"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}