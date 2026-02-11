// components/QuickLinks.js
import Link from 'next/link';

const links = [
  {
    title: "Officers Database",
    description: "Manage all officers",
    icon: "👥",
    href: "/officers",
    color: "bg-blue-50 text-blue-600"
  },
  {
    title: "Export Data Report",
    description: "Generate PDF/Excel",
    icon: "📊",
    href: "/reports/import",
    color: "bg-green-50 text-green-600"
  },
  {
    title: "Schedule",
    description: "View & edit shifts",
    icon: "⏰",
    href: "/schedules/manage",
    color: "bg-purple-50 text-purple-600"
  },
  {
    title: "Settings",
    description: "System configuration",
    icon: "⚙️",
    href: "/settings",
    color: "bg-gray-50 text-gray-600"
  },
  {
    title: "Analytics KPI",
    description: "Detailed reports",
    icon: "📈",
    href: "/analytics",
    color: "bg-orange-50 text-orange-600"
  },
  {
    title: "Admin Panel",
    description: "Admin access",
    icon: "🔒",
    href: "/admin",
    color: "bg-red-50 text-red-600"
  }
];

export default function QuickLinks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${link.color}`}>
              <div className="text-2xl">{link.icon}</div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                {link.title}
              </h3>
              <p className="text-sm text-gray-500">{link.description}</p>
            </div>
            <div className="text-gray-400 group-hover:text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}