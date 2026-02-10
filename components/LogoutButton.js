// components/LogoutButton.js
'use client'; // Karena pakai window dan event handler

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // 1. Hapus cookie auth
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    
    // 2. Hapus juga dari localStorage jika ada
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }
    
    // 3. Redirect ke login
    router.push('/login');
  };

  return (
    <button 
      onClick={handleLogout}
      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
    >
      🚪 Logout
    </button>
  );
}