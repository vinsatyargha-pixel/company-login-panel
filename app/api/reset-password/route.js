// app/api/reset-password/route.js
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { userId, newPassword } = await request.json()
    
    // Pakai service role key (ada di env variable)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )
    
    if (error) throw error
    
    return Response.json({ success: true, data })
    
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}