// components/QuickLinks.js
import Link from 'next/link';

export default function QuickLinks() {
  const links = [
    { href: '/Officers', label: 'Officer Database', icon: '👥', desc: 'Manage all officers' },
    { href: '/Schedule', label: 'Schedule', icon: '📅', desc: 'View & edit shifts' },
    { href: '/dashboard', label: 'Analytics', icon: '📊', desc: 'Detailed reports' },
    { href: '#', label: 'Reports', icon: '📈', desc: 'Generate PDF/Excel' },
    { href: '#', label: 'Settings', icon: '⚙️', desc: 'System configuration' },
    { href: 'https://gerbangmagnix.vercel.app/login', label: 'Admin Panel', icon: '🔐', desc: 'Admin access' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {links.map((link) => (
        <Link
          href={link.href}
          key={link.label}
          className="group bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="text-2xl group-hover:scale-110 transition-transform">
              {link.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                {link.label}
              </h3>
              <p className="text-sm text-gray-600">{link.desc}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}