import { createClient } from '@supabase/supabase-js'

// Lấy thông tin từ Supabase Dashboard: Project Settings -> API
// 1. URL: Ví dụ https://xyzcompany.supabase.co
const SUPABASE_URL = 'https://yfrhusrgdfgzfxqbajbd.supabase.co'

// 2. Anon Key: Mã public anon key của dự án
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmcmh1c3JnZGZnemZ4cWJhamJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxOTg5MjEsImV4cCI6MjEwNDc3NDkyMX0.envJmYZxz3uVn1V7GwcHvhcOibpO20ZuQE7p0rmxGjg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)