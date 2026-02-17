import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('Staff');
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
          setRole(userData.role || 'Staff');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tentukan admin berdasarkan role
  const isUserAdmin = role === 'Admin' || role === 'ADMIN' || role === 'admin';
  
  // Return role yang sudah dibersihkan
  const displayRole = isUserAdmin ? 'Admin' : 'Staff';

  return { 
    user,
    officerData,
    role: displayRole,  // ← ini yang ditampilkan jadi 'Admin' bukan 'Staff'
    originalRole: role, // ← kalau perlu role asli
    loading, 
    isAdmin: isUserAdmin
  };
}