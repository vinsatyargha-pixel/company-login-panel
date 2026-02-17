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
          setRole(userData.role || 'Staff');
        }

        // Ambil data dari officers (optional)
        const { data: officer } = await supabase
          .from('officers')
          .select('*')
          .ilike('email', user.email)
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
    role,
    loading, 
    isAdmin: role === 'Admin' || role === 'ADMIN'
  };
}