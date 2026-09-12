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

import { ShoppingCart, Eye, Loader2, Package, Palette, Receipt, ShieldAlert } from 'lucide-react'

// ==========================================
// TRANG CHỦ (HOME PAGE)
// ==========================================
function HomePage({ products, loadingProducts, activeCategory, setActiveCategory, setSearchQuery, handleAddToCart, formatVND }) {
  const navigate = useNavigate()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            {activeCategory === 'ALL' && 'Tất Cả Sản Phẩm Smart PIM'}
            {activeCategory === 'IT' && 'Công Nghệ IT & Linh Kiện PC'}
            {activeCategory === 'CO_KHI' && 'Dụng Cụ Cơ Khí Kỹ Thuật'}
            {activeCategory === 'GIA_DUNG_NOI_THAT' && 'Gia Dụng & Nội Thất'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">Danh mục lưu thuộc tính kỹ thuật động JSONB trên Supabase</p>
        </div>
      </div>

      {loadingProducts ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">Đang tải danh sách sản phẩm...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 space-y-3">
          <p className="text-sm font-semibold text-gray-500">Không tìm thấy sản phẩm nào phù hợp.</p>
          <button
            onClick={() => { setActiveCategory('ALL'); setSearchQuery(''); }}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((prod) => {
            const attrs = prod.dynamic_attributes || {}
            return (
              <div key={prod.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                <div>
                  <div className="relative aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden mb-3 border border-gray-100">
                    <img src={prod.images?.[0] || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400'} alt={prod.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300" />
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-gray-900/80 text-white px-2 py-0.5 rounded-md">{prod.category}</span>
                  </div>
                  <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug hover:text-blue-600 transition">{prod.name}</h3>
                  <div className="mt-2 text-[11px] text-gray-500 space-y-1 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    {prod.category === 'IT' && <p className="truncate">Socket: <strong className="text-blue-600">{attrs.socket || 'Standard'}</strong> | TDP: <strong>{attrs.tdp || 'N/A'}</strong></p>}
                    {prod.category === 'CO_KHI' && <p className="truncate">Ren: <strong className="text-amber-600">{attrs.chuan_ren || 'M8'}</strong> | Lực siết: <strong>{attrs.luc_siet || 'N/A'}</strong></p>}
                    {prod.category === 'GIA_DUNG_NOI_THAT' && <p className="truncate">KT: <strong className="text-emerald-600">{attrs.kich_thuoc || `${attrs.dai_cm || 100}x${attrs.rong_cm || 50} cm`}</strong></p>}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-blue-600">{formatVND(prod.sale_price || prod.price)}</p>
                    {prod.sale_price && <p className="text-[10px] text-gray-400 line-through">{formatVND(prod.price)}</p>}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => navigate(`/product/${prod.id}`)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition" title="Xem chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleAddToCart(prod, 1)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition" title="Thêm giỏ hàng">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ==========================================
// TRANG CHI TIẾT SẢN PHẨM (/product/:id)
// ==========================================
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
      <div className="flex justify-center items-center py-20 text-gray-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold">Đang tải chi tiết sản phẩm...</span>
      </div>
    )
  }

  return <ProductDetail product={product} onAddToCart={handleAddToCart} onOpenRFQ={(p, q) => alert(`Báo giá RFQ cho ${q}x ${p.name}`)} />
}

// ==========================================
// TRANG QUẢN TRỊ ADMIN (/admin) - BẢO MẬT ROLE
// ==========================================
function AdminLayout() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [adminTab, setAdminTab] = useState('PIM')

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
        <p className="text-xs text-gray-500">Chỉ tài khoản Quản trị viên (role === 'admin') mới có quyền xem khu vực này.</p>
        <a href="/" className="inline-block py-2.5 px-5 bg-blue-600 text-white rounded-xl text-xs font-bold">Quay lại Trang chủ</a>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-gray-500 uppercase">Hệ thống Quản trị Admin:</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setAdminTab('PIM')} className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${adminTab === 'PIM' ? 'bg-amber-500 text-white shadow' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}>
              <Package className="w-3.5 h-3.5" /> Quản Lý Sản Phẩm PIM
            </button>
            <button onClick={() => setAdminTab('THEME')} className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${adminTab === 'THEME' ? 'bg-indigo-600 text-white shadow' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'}`}>
              <Palette className="w-3.5 h-3.5" /> Giao Diện & Quảng Cáo
            </button>
            <button onClick={() => setAdminTab('ORDERS_TAX')} className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${adminTab === 'ORDERS_TAX' ? 'bg-emerald-600 text-white shadow' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}>
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

// ==========================================
// COMPONENT CHÍNH APP KẾT NỐI ROUTER
// ==========================================
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
      <div className="min-h-screen bg-gray-50 relative pb-16 font-sans">
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