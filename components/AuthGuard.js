'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('magni_user') || 'null');
    if (!user) {
      router.push('/login'); // redirect ke login jika belum ada user
    } else {
      setIsVerified(true);
    }
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
