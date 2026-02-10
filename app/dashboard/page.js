// app/dashboard/page.js
import DashboardCard from '@/components/DashboardCard';
import QuickLinks from '@/components/QuickLinks';

export default function DashboardPage() {
  const dashboardData = {
    totalAsset: 1250000,
    transactionVolume: 15430,
    activeOfficers: 212,
    scheduleCoverage: 94.5
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">GROUP-X Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your overview for today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <DashboardCard
          title="Total Asset (XLY)"
          value={`$${(dashboardData.totalAsset / 1000000).toFixed(1)}M`}
          change={+12.5}
          trend="up"
          icon="💰"
          color="blue"
        />
        <DashboardCard
          title="Transaction Volume"
          value={`${(dashboardData.transactionVolume / 1000).toFixed(1)}K TX`}
          change={-3.2}
          trend="down"
          icon="📊"
          color="green"
        />
        <DashboardCard
          title="Active Officers"
          value={dashboardData.activeOfficers.toString()}
          change={+2.1}
          trend="up"
          icon="👥"
          color="purple"
        />
        <DashboardCard
          title="Schedule Coverage"
          value={`${dashboardData.scheduleCoverage}%`}
          change={+0.5}
          trend="up"
          icon="📅"
          color="orange"
        />
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <QuickLinks />
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { icon: '➕', text: 'New transaction batch processed', time: '10 min ago' },
            { icon: '👋', text: 'Tamara Halim joined GROUP-X', time: '2 hours ago' },
            { icon: '📝', text: 'Schedule updated for March 15', time: '1 day ago' },
            { icon: '✅', text: 'Monthly report generated', time: '2 days ago' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
              <span className="text-lg">{activity.icon}</span>
              <div className="flex-1">
                <p className="text-gray-800">{activity.text}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center text-gray-500 text-sm">
        <p>© 2025 GROUP-X Dashboard • gerbangmagnix.vercel.app • Version 3.0</p>
      </footer>
    </div>
  );
}