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
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user?.email) {
        // 🔥 AMBIL EMAIL DALAM BENTUK LOWERCASE
        const userEmail = user.email.toLowerCase();
        
        // Cek di tabel users (case insensitive)
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .ilike('email', userEmail)  // ilike = case insensitive
          .maybeSingle();

        if (userData?.role) {
          console.log('🔥 Role asli:', userData.role);
          setUserJobRole(userData.role);
        } else {
          // Fallback ke tabel officers kalau ga ketemu di users
          const { data: officerData } = await supabase
            .from('officers')
            .select('role')
            .ilike('email', userEmail)
            .maybeSingle();
            
          if (officerData?.role) {
            console.log('🔥 Role dari officers:', officerData.role);
            setUserJobRole(officerData.role);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userJobRole?.toLowerCase() === 'admin' || 
                  userJobRole?.toLowerCase() === 'administrator' || 
                  userJobRole?.toLowerCase() === 'superadmin';

  return { 
    user,
    officerData,
    userJobRole,
    role: userJobRole,
    loading, 
    isAdmin
  };
}