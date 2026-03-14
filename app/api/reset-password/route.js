// app/api/reset-password/route.js
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { email, newPassword } = await request.json()
    
    if (!email || !newPassword) {
      return Response.json({ 
        success: false, 
        error: 'Email and new password are required' 
      }, { status: 400 })
    }
    
    // Pakai service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Cari user berdasarkan email di auth.users
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) throw listError
    
    const targetUser = users.users.find(u => u.email === email)
    
    if (!targetUser) {
      return Response.json({ 
        success: false, 
        error: 'User not found in auth system' 
      }, { status: 404 })
    }
    
    // Reset password pake UUID yang bener
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,  // Ini UUID yang bener dari auth.users
      { password: newPassword }
    )
    
    if (error) throw error
    
    return Response.json({ success: true, data })
    
  } catch (error) {
    console.error('Reset password API error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}