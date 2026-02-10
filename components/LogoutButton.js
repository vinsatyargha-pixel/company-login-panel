// components/LogoutButton.js
'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // Hapus cookie auth
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    
    // Redirect ke login
    router.push('/login');
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
    >
      <span>🚪</span>
      <span>Logout</span>
    </button>
  );
}