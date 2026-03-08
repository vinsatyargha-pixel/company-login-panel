'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth'; // Import useAuth

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAdmin } = useAuth();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 AuthGuard checking...');
      
      // Cek session dari Supabase
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📊 Session:', session);
      
      if (!session) {
        console.log('❌ No session, redirecting to login');
        router.push('/login');
        return;
      }

      // Cek akses berdasarkan role dan halaman
      if (pathname.startsWith('/dashboard/admin') && !isAdmin) {
        console.log('⛔ Admin access denied');
        router.push('/dashboard');
        return;
      }

      console.log('✅ Auth OK');
      setIsVerified(true);
    };

    if (!loading) {
      checkAuth();
    }
  }, [loading, user, isAdmin, pathname, router]);

  if (loading || !isVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}