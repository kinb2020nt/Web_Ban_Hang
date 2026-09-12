import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState('customer')
  const [loading, setLoading] = useState(true)

  // Lấy dữ liệu profile người dùng từ bảng 'profiles'
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Lỗi khi lấy thông tin Profile:', error.message)
      }

      if (data) {
        setProfile(data)
        setRole(data.role || 'customer')
      } else {
        // Dự phòng: Nếu Trigger DB chưa kịp tạo, tự động chèn dòng profile với mặc định role là 'customer'
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({ id: userId, role: 'customer' })
          .select()
          .single()

        if (!insertError && newProfile) {
          setProfile(newProfile)
          setRole(newProfile.role || 'customer')
        }
      }
    } catch (err) {
      console.error('Lỗi kết nối profile:', err)
    }
  }

  useEffect(() => {
    // 1. Lấy phiên đăng nhập hiện tại khi load trang
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }

    getInitialSession()

    // 2. Lắng nghe sự thay đổi trạng thái Auth (Đăng nhập / Đăng xuất)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setRole('customer')
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Đăng ký tài khoản
  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName } // Lưu họ tên vào metadata để Trigger SQL tự copy sang bảng profiles
      }
    })
    return { data, error }
  }

  // Đăng nhập
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  // Đăng xuất
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
      setRole('customer')
    }
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin: role === 'admin',
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile: () => user && fetchProfile(user.id)
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)