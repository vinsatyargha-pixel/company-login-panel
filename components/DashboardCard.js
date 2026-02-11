// components/DashboardCard.js
import Link from 'next/link';

export default function DashboardCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  color = 'blue',
  href = null, // Tambah prop untuk link
  onClick = null // Tambah prop untuk click handler
}) {
  const colorClasses = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500'
  };

  // Warna background untuk icon
  const iconBgClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  // Card content
  const CardContent = () => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 ${colorClasses[color]} border-l-4 hover:shadow-md transition-shadow ${href || onClick ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
          <div className="text-2xl">{icon}</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {trend === 'up' ? '↗' : '↘'} {change > 0 ? '+' : ''}{change}%
        </div>
      </div>
      
      <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <p className="text-gray-500 text-sm mt-2">Updated just now</p>
      
      {/* Indicator arrow jika ada link */}
      {(href || onClick) && (
        <div className="absolute bottom-4 right-4 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );

  // Jika ada href, wrap dengan Link
  if (href) {
    return (
      <Link href={href} className="block">
        <CardContent />
      </Link>
    );
  }

  // Jika ada onClick handler
  if (onClick) {
    return (
      <div onClick={onClick} className="block">
        <CardContent />
      </div>
    );
  }

  // Default tanpa link
  return <CardContent />;
}