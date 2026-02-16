import Link from 'next/link';
import DashboardCardWithClaw from '@/components/dashboardcardwithclaw';

export default function DashboardCard({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  href = null
}) {
  const colorClasses = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500'
  };

  const iconBgClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  const CardContent = () => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 ${colorClasses[color]} border-l-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
          <div className="text-2xl">{icon}</div>
        </div>
      </div>
      
      <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <p className="text-gray-500 text-sm mt-2">Updated just now</p>
      
      {href && (
        <div className="absolute bottom-4 right-4 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}