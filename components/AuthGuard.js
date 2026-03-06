'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Import supabase

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Cek session dari Supabase dulu
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Fallback ke localStorage (buat backward compatibility)
        const localUser = JSON.parse(localStorage.getItem('magni_user') || 'null');
        if (!localUser) {
          router.push('/login');
          return;
        }
        
        // Tapi kalo pake localStorage, cek ke database untuk role terbaru
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', localUser.email)
          .single();
        
        if (userData) {
          // Update localStorage dengan data terbaru
          localStorage.setItem('magni_user', JSON.stringify(userData));
        }
      } else {
        // Kalo pake session, ambil data terbaru dari public.users
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();
        
        if (userData) {
          // Simpan di localStorage
          localStorage.setItem('magni_user', JSON.stringify(userData));
        }
      }
      
      setIsVerified(true);
    };

    checkAuth();
  }, []);

  if (!isVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}