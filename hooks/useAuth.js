import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userJobRole, setUserJobRole] = useState('Staff');
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
        // CASE INSENSITIVE - pakai ilike
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .ilike('email', user.email)
          .maybeSingle();

        if (userData) {
          console.log('🔥 Role asli:', userData.role);
          setUserJobRole(userData.role || 'Staff');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tentukan admin berdasarkan role
  const isAdmin = userJobRole === 'Admin' || userJobRole === 'ADMIN' || userJobRole === 'admin';
  
  return { 
    user,
    officerData,
    userJobRole,
    role: userJobRole, // biar kompatibel
    loading, 
    isAdmin
  };
}