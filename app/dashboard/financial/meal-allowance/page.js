echo 'import Link from "next/link";

export default function SalaryPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6 flex items-center gap-4">
        <Link 
          href="/dashboard/financial" 
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Financial</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#FFD700]">SALARY</h1>
          <p className="text-[#A7D8FF] mt-1">Coming Soon</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center h-96 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg">
        <div className="text-center">
          <span className="text-9xl block mb-6">💰</span>
          <p className="text-[#FFD700] text-2xl font-bold">Halaman dalam pengembangan</p>
          <p className="text-[#A7D8FF] mt-4">Salary calculation akan segera hadir</p>
        </div>
      </div>
    </div>
  );
}' > app/dashboard/financial/salary/page.js