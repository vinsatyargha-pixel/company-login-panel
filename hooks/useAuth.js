import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [accessRole, setAccessRole] = useState('user'); // dari officers.access_role
  const [userJobRole, setUserJobRole] = useState('');   // dari users.role (Staff/Admin)
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
        // 1. Ambil role dari public.users (untuk tampilan)
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .maybeSingle();

        if (userData) {
          setUserJobRole(userData.role);
        }

        // 2. Ambil data dari officers (untuk akses edit)
        const { data: officer } = await supabase
          .from('officers')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (officer) {
          setOfficerData(officer);
          setAccessRole(officer.access_role || 'user');
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
    userJobRole,    // Staff/Admin (untuk tampilan)
    accessRole,     // admin/user (untuk akses)
    loading, 
    isAdmin: accessRole === 'admin'  // HAK EDIT berdasarkan access_role
  };
}