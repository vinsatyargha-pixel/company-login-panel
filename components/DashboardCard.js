// components/DashboardCard.js
export default function DashboardCard({ title, value, change, trend, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500'
  };

  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 ${colorClasses[color]} border-l-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl">{icon}</div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {trend === 'up' ? '↗' : '↘'} {change > 0 ? '+' : ''}{change}%
        </div>
      </div>
      
      <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <p className="text-gray-500 text-sm mt-2">Updated just now</p>
    </div>
  );
}