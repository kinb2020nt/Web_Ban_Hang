import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { useAuth } from './context/AuthContext'

import DynamicTheme from './components/DynamicTheme'
import HeaderNavbar from './components/HeaderNavbar'
import ProductDetail from './components/ProductDetail'
import CartAndCheckout from './components/CartAndCheckout'
import AIChatbotAgent from './components/AIChatbotAgent'
import AdminThemeAndAds from './admin/AdminThemeAndAds'
import AdminProductPIM from './admin/AdminProductPIM'
import AdminOrdersAndTax from './admin/AdminOrdersAndTax'

import { 
  ShoppingCart, Eye, Loader2, Package, Palette, Receipt, 
  ShieldAlert, Zap, Cpu, Wrench, Home, Sparkles, ChevronRight, 
  Layers, ArrowUpRight, Search, CheckCircle2, SlidersHorizontal
} from 'lucide-react'

// ==============================================================================
// 🎨 RE-DESIGNED HOMEPAGE (MASTERPIECE STOREFRONT)
// ==============================================================================
function HomePage({ products, loadingProducts, activeCategory, setActiveCategory, setSearchQuery, handleAddToCart, formatVND }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-24 relative overflow-hidden">
      
      {/* BACKGROUND AMBIENT GLOWS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-600/15 via-violet-600/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-96 right-0 w-[500px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-10 relative z-10">
        
        {/* EXECUTIVE HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800/80 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xs">
                <Sparkles className="w-3 h-3 text-indigo-400" /> KINB SMART PIM • ENGINE 2026
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Siêu Thị Linh Kiện IT & Cơ Khí Kỹ Thuật
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                Hệ thống tra cứu thông số JSONB kỹ thuật chuẩn xác. Tích hợp quản lý logistics nâng cao và phát hành Hóa đơn điện tử tự động.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <button 
                onClick={() => setActiveCategory('IT')} 
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/25 border border-indigo-500/30 transition-all active:scale-95 flex items-center gap-2"
              >
                <Cpu className="w-4 h-4" /> Linh kiện CPU / RAM
              </button>
              <button 
                onClick={() => setActiveCategory('CO_KHI')} 
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700/80 transition-all active:scale-95 flex items-center gap-2"
              >
                <Wrench className="w-4 h-4 text-amber-400" /> Dụng cụ Cơ khí
              </button>
            </div>
          </div>
        </div>

        {/* CATEGORY & FILTER TOOLBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {[
              { key: 'ALL', label: 'Tất Cả Sản Phẩm', icon: Layers },
              { key: 'IT', label: 'Công Nghệ IT & PC', icon: Cpu },
              { key: 'CO_KHI', label: 'Cơ Khí Kỹ Thuật', icon: Wrench },
              { key: 'GIA_DUNG_NOI_THAT', label: 'Gia Dụng & Nội Thất', icon: Home }
            ].map((cat) => {
              const IconComp = cat.icon
              const isActive = activeCategory === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30' 
                      : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>

          <span className="text-xs font-mono font-bold text-slate-500 shrink-0">
            {products.length} MẶT HÀNG KINB STORE
          </span>
        </div>

        {/* PRODUCT GRID SECTION */}
        {loadingProducts ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs font-mono tracking-wider">ĐANG TRUY XUẤT KHO DỮ LIỆU PIM...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-xl p-16 rounded-3xl text-center border border-slate-800 space-y-4">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs font-medium text-slate-400">Không tìm thấy sản phẩm nào phù hợp với danh mục hiện tại.</p>
            <button
              onClick={() => { setActiveCategory('ALL'); setSearchQuery(''); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              Reset bộ lọc tìm kiếm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((prod) => {
              const attrs = prod.dynamic_attributes || {}
              return (
                <div 
                  key={prod.id} 
                  className="group bg-slate-900/60 backdrop-blur-xl rounded-3xl p-5 border border-slate-800/80 hover:border-slate-700 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* TOP BADGE */}
                    <div className="flex items-center justify-between">
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase">
                        TRẢ GÓP 0%
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        SKU: {prod.sku}
                      </span>
                    </div>

                    {/* PRODUCT IMAGE CONTAINER */}
                    <div className="relative w-full h-48 bg-slate-950/80 rounded-2xl overflow-hidden p-4 flex items-center justify-center border border-slate-800/60">
                      <img 
                        src={prod.images?.[0] || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300'} 
                        alt={prod.name} 
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300" 
                      />
                    </div>

                    {/* TITLE */}
                    <h3 className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug group-hover:text-indigo-400 transition min-h-[32px]">
                      {prod.name}
                    </h3>

                    {/* DYNAMIC PIM SPECIFICATIONS */}
                    <div className="text-[10px] text-slate-400 space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 font-mono">
                      {prod.category === 'IT' && <p className="truncate">Socket: <strong className="text-indigo-400">{attrs.socket || 'LGA1700'}</strong> | TDP: {attrs.tdp || '125W'}</p>}
                      {prod.category === 'CO_KHI' && <p className="truncate">Ren: <strong className="text-amber-400">{attrs.chuan_ren || 'M8'}</strong> | Siết: {attrs.luc_siet || '30Nm'}</p>}
                      {prod.category === 'GIA_DUNG_NOI_THAT' && <p className="truncate">KT: <strong className="text-emerald-400">{attrs.kich_thuoc || `${attrs.dai_cm || 100}x${attrs.rong_cm || 50} cm`}</strong></p>}
                    </div>
                  </div>

                  {/* PRICE & ACTION BUTTONS */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-emerald-400 font-mono">{formatVND(prod.sale_price || prod.price)}</span>
                      {prod.sale_price && <span className="text-[11px] text-slate-500 line-through font-mono">{formatVND(prod.price)}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => navigate(`/product/${prod.id}`)} 
                        className="py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-700/80 transition flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem
                      </button>
                      <button 
                        onClick={() => handleAddToCart(prod, 1)} 
                        className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Thêm
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductDetailPage({ handleAddToCart }) {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
        if (!error && data) setProduct(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDetail()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-xs font-mono">ĐANG TẢI CHI TIẾT SẢN PHẨM...</span>
      </div>
    )
  }

  return <ProductDetail product={product} onAddToCart={handleAddToCart} onOpenRFQ={(p, q) => alert(`Báo giá RFQ cho ${q}x ${p.name}`)} />
}

function AdminLayout() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [adminTab, setAdminTab] = useState('PIM')

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-slate-900/80 rounded-3xl shadow-2xl text-center space-y-4 border border-slate-800">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Truy cập bị từ chối</h2>
          <p className="text-xs text-slate-400">Chỉ tài khoản QTV (role === 'admin') mới có quyền truy cập.</p>
          <a href="/" className="inline-block py-2.5 px-5 bg-slate-800 text-white rounded-xl text-xs font-bold border border-slate-700">Quay lại Trang chủ</a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-slate-950/90 border-b border-slate-800/80 sticky top-16 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase">HỆ THỐNG QUẢN TRỊ ADMIN:</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setAdminTab('PIM')} className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${adminTab === 'PIM' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>
              <Package className="w-3.5 h-3.5" /> Quản Lý Sản Phẩm PIM
            </button>
            <button onClick={() => setAdminTab('THEME')} className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${adminTab === 'THEME' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>
              <Palette className="w-3.5 h-3.5" /> Giao Diện & Quảng Cáo
            </button>
            <button onClick={() => setAdminTab('ORDERS_TAX')} className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${adminTab === 'ORDERS_TAX' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>
              <Receipt className="w-3.5 h-3.5" /> Đơn Hàng & Kê Khai Thuế
            </button>
          </div>
        </div>
      </div>
      <div>
        {adminTab === 'PIM' && <AdminProductPIM />}
        {adminTab === 'THEME' && <AdminThemeAndAds />}
        {adminTab === 'ORDERS_TAX' && <AdminOrdersAndTax />}
      </div>
    </div>
  )
}

export default function App() {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [cartItems, setCartItems] = useState([])

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      let query = supabase.from('products').select('*').eq('is_active', true)
      if (activeCategory !== 'ALL') query = query.eq('category', activeCategory)
      if (searchQuery.trim()) query = query.ilike('name', `%${searchQuery.trim()}%`)
      
      const { data, error } = await query.order('created_at', { ascending: false })
      if (!error && data) setProducts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => { fetchProducts() }, [activeCategory, searchQuery])

  const handleAddToCart = (product, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i)
      }
      return [...prev, { ...product, quantity: qty }]
    })
  }

  const formatVND = (amt) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0)

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 relative font-sans">
        <DynamicTheme />
        <HeaderNavbar
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          onSearch={(q, cat) => { setSearchQuery(q); setActiveCategory(cat); }}
          onSelectCategory={(cat) => { setActiveCategory(cat); setSearchQuery(''); }}
        />

        <main>
          <Routes>
            <Route path="/" element={<HomePage products={products} loadingProducts={loadingProducts} activeCategory={activeCategory} setActiveCategory={setActiveCategory} setSearchQuery={setSearchQuery} handleAddToCart={handleAddToCart} formatVND={formatVND} />} />
            <Route path="/product/:id" element={<ProductDetailPage handleAddToCart={handleAddToCart} />} />
            <Route path="/cart" element={<CartAndCheckout items={cartItems} onUpdateQuantity={(id, q) => q <= 0 ? setCartItems(cartItems.filter(i => i.id !== id)) : setCartItems(cartItems.map(i => i.id === id ? {...i, quantity: q} : i))} onRemoveItem={(id) => setCartItems(cartItems.filter(i => i.id !== id))} onOrderSuccess={() => setCartItems([])} />} />
            <Route path="/admin/*" element={<AdminLayout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <AIChatbotAgent />
      </div>
    </BrowserRouter>
  )
}