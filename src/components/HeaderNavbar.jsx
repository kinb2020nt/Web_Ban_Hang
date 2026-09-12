import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import { supabase } from '../supabaseClient'
import { 
  Search, ShoppingCart, User, LogOut, ShieldCheck, 
  Menu, X, Cpu, Wrench, Home, Megaphone, ChevronDown 
} from 'lucide-react'

export default function HeaderNavbar({ cartCount = 0, onSearch, onSelectCategory }) {
  const { user, profile, isAdmin, signOut } = useAuth()
  const [topBannerAds, setTopBannerAds] = useState([])
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  // Lấy danh sách Top Banner từ bảng advertisements
  useEffect(() => {
    const fetchTopAds = async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('position', 'top_banner')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (!error && data && data.length > 0) {
        setTopBannerAds(data)
      }
    }
    fetchTopAds()
  }, [])

  // Chạy chữ Top Banner tự động chuyển quảng cáo
  useEffect(() => {
    if (topBannerAds.length <= 1) return
    const timer = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % topBannerAds.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [topBannerAds])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearch) onSearch(searchQuery, selectedCategory)
  }

  const handleCategoryClick = (catKey) => {
    setSelectedCategory(catKey)
    if (onSelectCategory) onSelectCategory(catKey)
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full shadow-md bg-white">
      {/* 1. TOP BANNER QUẢNG CÁO CHẠY CHỮ */}
      {topBannerAds.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 text-white text-xs py-2 px-4 flex items-center justify-center gap-2 overflow-hidden transition-all duration-300">
          <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <a
            href={topBannerAds[currentAdIndex]?.link_url || '#'}
            target="_blank"
            rel="noreferrer"
            className="hover:underline font-medium truncate max-w-xl text-center"
          >
            {topBannerAds[currentAdIndex]?.title}
          </a>
        </div>
      )}

      {/* 2. THANH MAIN NAVBAR TRÊN DESKTOP & MOBILE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* LOGO SHOP */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 md:hidden hover:bg-gray-100 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-amber-500 bg-clip-text text-transparent">
                KinB Shop
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                SMART PIM
              </span>
            </a>
          </div>

          {/* THANH TÌM KIẾM SMART PIM ĐA NGÀNH */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl hidden md:flex items-center">
            <div className="relative flex w-full border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-50 text-xs font-semibold text-gray-700 px-3 border-r border-gray-300 outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả ngành</option>
                <option value="IT">Công nghệ IT</option>
                <option value="CO_KHI">Cơ khí - Dụng cụ</option>
                <option value="GIA_DUNG_NOI_THAT">Gia dụng - Nội thất</option>
              </select>
              <input
                type="text"
                placeholder="Tìm sản phẩm theo Socket, TDP, Chuẩn ren, Kích thước..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 flex items-center justify-center transition"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* GIỎ HÀNG VÀ TÀI KHOẢN NGUỜI DÙNG */}
          <div className="flex items-center gap-3">
            {/* GIỎ HÀNG */}
            <button className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-xl transition">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* KHU VỰC TÀI KHOẢN */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-gray-200 hover:border-blue-500 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden lg:inline text-xs font-medium text-gray-700 max-w-[100px] truncate">
                    {profile?.full_name || user.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* DROPDOWN USER MENU */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-800">{profile?.full_name || 'Khách hàng'}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                          <ShieldCheck className="w-3 h-3" /> ADMIN SYSTEM
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <a
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        <ShieldCheck className="w-4 h-4" /> Quản trị Admin
                      </a>
                    )}
                    <button
                      onClick={() => {
                        signOut()
                        setIsUserMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
                    >
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow transition"
              >
                <User className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. MENU DANH MỤC ĐA NGÀNH (DESKTOP) */}
      <nav className="hidden md:block border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-8 text-xs font-bold text-gray-700 py-2.5">
          <button
            onClick={() => handleCategoryClick('ALL')}
            className={`flex items-center gap-1.5 hover:text-blue-600 transition ${
              selectedCategory === 'ALL' ? 'text-blue-600' : ''
            }`}
          >
            Tất cả sản phẩm
          </button>
          <button
            onClick={() => handleCategoryClick('IT')}
            className={`flex items-center gap-1.5 hover:text-blue-600 transition ${
              selectedCategory === 'IT' ? 'text-blue-600' : ''
            }`}
          >
            <Cpu className="w-4 h-4 text-blue-500" /> Công nghệ IT
          </button>
          <button
            onClick={() => handleCategoryClick('CO_KHI')}
            className={`flex items-center gap-1.5 hover:text-blue-600 transition ${
              selectedCategory === 'CO_KHI' ? 'text-blue-600' : ''
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-500" /> Dụng cụ Cơ khí
          </button>
          <button
            onClick={() => handleCategoryClick('GIA_DUNG_NOI_THAT')}
            className={`flex items-center gap-1.5 hover:text-blue-600 transition ${
              selectedCategory === 'GIA_DUNG_NOI_THAT' ? 'text-blue-600' : ''
            }`}
          >
            <Home className="w-4 h-4 text-emerald-500" /> Gia dụng & Nội thất
          </button>
        </div>
      </nav>

      {/* 4. DRAWER MENU CHO MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-l-lg px-3 py-2 text-xs outline-none"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-r-lg text-xs font-bold">
              Tìm
            </button>
          </form>
          <div className="flex flex-col gap-2 pt-2 text-xs font-semibold">
            <button
              onClick={() => handleCategoryClick('IT')}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 text-gray-800"
            >
              <Cpu className="w-4 h-4 text-blue-500" /> Công nghệ IT
            </button>
            <button
              onClick={() => handleCategoryClick('CO_KHI')}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-50 text-gray-800"
            >
              <Wrench className="w-4 h-4 text-amber-500" /> Dụng cụ Cơ khí
            </button>
            <button
              onClick={() => handleCategoryClick('GIA_DUNG_NOI_THAT')}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-emerald-50 text-gray-800"
            >
              <Home className="w-4 h-4 text-emerald-500" /> Gia dụng & Nội thất
            </button>
          </div>
        </div>
      )}

      {/* MODAL AUTH DÙNG CHUNG */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </header>
  )
}