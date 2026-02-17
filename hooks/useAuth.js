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
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .ilike('email', user.email)
          .maybeSingle();

        if (userData?.role) {
          console.log('🔥 Role asli:', userData.role);
          setUserJobRole(userData.role);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userJobRole?.toLowerCase() === 'admin';

  return { 
    user,
    officerData,
    userJobRole,
    role: userJobRole,
    loading, 
    isAdmin
  };
}