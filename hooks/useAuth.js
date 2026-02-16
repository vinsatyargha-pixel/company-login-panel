import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [accessRole, setAccessRole] = useState('user');
  const [userJobRole, setUserJobRole] = useState('');
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
        // 1. Ambil role dari public.users
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .maybeSingle();

        if (userData) {
          console.log('🔥 User role from DB:', userData.role);
          setUserJobRole(userData.role);
          
          // 🔥 FIX: Case insensitive comparison
          const userRole = userData.role || '';
          const isUserAdmin = userRole.toUpperCase() === 'ADMIN';
          setAccessRole(isUserAdmin ? 'admin' : 'user');
        }

        // 2. Ambil data dari officers (optional)
        const { data: officer } = await supabase
          .from('officers')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (officer) {
          setOfficerData(officer);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { 
    user,
    officerData,
    userJobRole,
    accessRole,
    loading, 
    isAdmin: accessRole === 'admin'
  };
}