import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userJobRole, setUserJobRole] = useState(null);
  const [officerData, setOfficerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      console.log('🔍 Getting user...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('✅ User from auth:', user);
      setUser(user);

      if (user?.email) {
        const userEmail = user.email.toLowerCase();
        console.log('📧 Email:', userEmail);
        
        // Cek di tabel users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .ilike('email', userEmail)
          .maybeSingle();

        console.log('📊 User data:', userData);
        console.log('❌ User error:', userError);

        if (userData?.role) {
          console.log('🔥 Role dari users:', userData.role);
          setUserJobRole(userData.role);
        } else {
          // Fallback ke tabel officers
          const { data: officerData, error: officerError } = await supabase
            .from('officers')
            .select('role')
            .ilike('email', userEmail)
            .maybeSingle();
            
          console.log('📊 Officer data:', officerData);
          console.log('❌ Officer error:', officerError);
          
          if (officerData?.role) {
            console.log('🔥 Role dari officers:', officerData.role);
            setUserJobRole(officerData.role);
            setOfficerData(officerData);
          } else {
            console.log('⚠️ Role tidak ditemukan di mana pun');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error di getUser:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Handle semua kemungkinan role admin
  const roleLower = userJobRole?.toLowerCase() || '';
  const isAdmin = roleLower === 'admin' || 
                  roleLower === 'administrator' || 
                  roleLower === 'superadmin' ||
                  userJobRole === 'ADMIN' ||    // Langsung cek uppercase
                  userJobRole === 'Admin';       // Langsung cek capitalized

  console.log('🎯 Final role:', userJobRole, 'isAdmin:', isAdmin);

  return { 
    user,
    officerData,
    userJobRole,
    role: userJobRole,
    loading, 
    isAdmin
  };
}