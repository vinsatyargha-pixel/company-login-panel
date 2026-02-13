"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Plus, Filter, Download } from "lucide-react";

export default function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState("day");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [formData, setFormData] = useState({
    officer_id: "",
    date: new Date().toISOString().split("T")[0],
    shift_type: "PAGI",
    notes: "",
  });

  const router = useRouter();

  const shiftTypes = [
    { value: "PAGI", label: "PAGI (09:00 - 21:00)", color: "bg-green-900/50 text-blue-400" },
    { value: "SIANG", label: "SIANG (14:00 - 02:00)", color: "bg-yellow-900/50 text-black-400" },
    { value: "MALAM", label: "MALAM (21:00 - 09:00)", color: "bg-purple-900/50 text-yellow-400" },
    { value: "OFFDAY", label: "OFFDAY", color: "bg-black-800 text-white-300" },
    { value: "CUTI", label: "CUTI", color: "bg-green-900/50 text-black-400" },
    { value: "SAKIT", label: "SAKIT", color: "bg-yellow-900/50 text-blue-400" },
    { value: "IZIN", label: "IZIN", color: "bg-blue-900/50 text-white-400" },
    { value: "SPECIAL", label: "SPECIAL DAY", color: "bg-cyan-900/50 text-black-400" },
    { value: "RESIGN", label: "RESIGN", color: "bg-red-700 text-black-300" },
    { value: "TERMINATED", label: "TERMINATED", color: "bg-red-950/50 text-yellow-300" },
    { value: "ABSEN", label: "ABSEN", color: "bg-red text-white" },
  ];

  useEffect(() => {
    checkAuth();
    fetchOfficers();
    fetchSchedules();
  }, [selectedDate, filterStatus]);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
    }
  };

  const fetchOfficers = async () => {
    const { data, error } = await supabase
      .from("officers")
      .select("id, name, status")
      .eq("employment_status", "ACTIVE")
      .order("name");

    if (!error && data) {
      setOfficers(data);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    
    let query = supabase
      .from("schedules")
      .select(`
        *,
        officer:officers(name, status, group_id)
      `)
      .order("date", { ascending: true });

    if (viewMode === "day") {
      query = query.eq("date", selectedDate);
    } else if (viewMode === "week") {
      const startDate = new Date(selectedDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
      
      query = query
        .gte("date", startDate.toISOString().split("T")[0])
        .lt("date", endDate.toISOString().split("T")[0]);
    }

    if (filterStatus !== "ALL") {
      query = query.eq("shift_type", filterStatus);
    }

    const { data, error } = await query;

    if (!error && data) {
      setSchedules(data);
    } else {
      console.error("Error fetching schedules:", error);
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.officer_id) {
      alert("Please select an officer");
      return;
    }

    const { data, error } = await supabase
      .from("schedules")
      .insert([formData])
      .select();

    if (error) {
      console.error("Insert error:", error);
      alert("Error: " + error.message);
    } else {
      console.log("✅ Schedule added:", data);
      setShowForm(false);
      setFormData({
        officer_id: "",
        date: new Date().toISOString().split("T")[0],
        shift_type: "PAGI",
        notes: "",
      });
      fetchSchedules();
      alert("Schedule added successfully!");
    }
  };

  const deleteSchedule = async (id) => {
    if (!confirm("Delete this schedule entry?")) return;

    const { error } = await supabase.from("schedules").delete().eq("id", id);

    if (!error) {
      fetchSchedules();
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Officer", "Shift Type", "Notes"];
    const csvData = schedules.map((s) => [
      s.date,
      s.officer?.name || "Unknown",
      s.shift_type,
      s.notes || "",
    ]);

    const csv = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule_${selectedDate}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading schedules...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 p-6 bg-gradient-to-r from-gray-900 to-black rounded-2xl border border-gray-800">
        <div className="flex items-center space-x-4">
          <Calendar size={32} className="text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              📅 Schedule Management
            </h1>
            <p className="text-gray-400 mt-2">
              Manage officer shifts: PAGI, SIANG, MALAM, CUTI, SAKIT, IZIN, etc.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            ← Dashboard
          </Link>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition flex items-center"
          >
            <Download size={18} className="mr-2" /> Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-lg font-semibold transition flex items-center"
          >
            <Plus size={20} className="mr-2" /> Add Schedule
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          <label className="block text-sm text-gray-300 mb-2">View Mode</label>
          <select
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="day">Daily View</option>
            <option value="week">Weekly View</option>
            <option value="month">Monthly View</option>
          </select>
        </div>

        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          <label className="block text-sm text-gray-300 mb-2">Select Date</label>
          <input
            type="date"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          <label className="block text-sm text-gray-300 mb-2">Filter Shift</label>
          <select
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Shifts</option>
            {shiftTypes.map((shift) => (
              <option key={shift.value} value={shift.value}>
                {shift.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex items-center">
          <div className="text-center w-full">
            <p className="text-gray-400 text-sm">Schedules Found</p>
            <p className="text-2xl font-bold text-cyan-400">{schedules.length}</p>
          </div>
        </div>
      </div>

      {/* Shift Legend */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Shift Legend</h3>
        <div className="flex flex-wrap gap-2">
          {shiftTypes.map((shift) => (
            <div
              key={shift.value}
              className={`px-3 py-1 rounded-full text-xs font-semibold ${shift.color}`}
            >
              {shift.value}
            </div>
          ))}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add Schedule Entry</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Officer *
                </label>
                <select
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
                  value={formData.officer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, officer_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select Officer</option>
                  {officers.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name} ({officer.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Shift Type *
                  </label>
                  <select
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
                    value={formData.shift_type}
                    onChange={(e) =>
                      setFormData({ ...formData, shift_type: e.target.value })
                    }
                    required
                  >
                    {shiftTypes.map((shift) => (
                      <option key={shift.value} value={shift.value}>
                        {shift.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Notes</label>
                <textarea
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
                  rows="3"
                  placeholder="Special instructions, reasons for leave, etc."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg font-semibold"
                >
                  Save Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedules Table */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">
              {viewMode === "day"
                ? `Schedules for ${selectedDate}`
                : viewMode === "week"
                ? `Weekly Schedules from ${selectedDate}`
                : "All Schedules"}
            </h2>
            <p className="text-gray-400">
              {schedules.length} schedule entries found
            </p>
          </div>
          <Filter className="text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Officer</th>
                <th className="p-4 text-left">Shift Type</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Notes</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No schedules found for selected criteria.
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => {
                  const shiftColor = shiftTypes.find(
                    (s) => s.value === schedule.shift_type
                  )?.color || "bg-gray-800 text-gray-300";

                  return (
                    <tr
                      key={schedule.id}
                      className="border-b border-gray-800 hover:bg-gray-900/30"
                    >
                      <td className="p-4 font-semibold">{schedule.date}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold">
                            {schedule.officer?.name || "Unknown Officer"}
                          </p>
                          <p className="text-sm text-gray-400">
                            Group: {schedule.officer?.group_id || "N/A"}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${shiftColor}`}
                        >
                          {schedule.shift_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            schedule.officer?.status === "REGULER"
                              ? "bg-green-900/50 text-green-400"
                              : "bg-yellow-900/50 text-yellow-400"
                          }`}
                        >
                          {schedule.officer?.status || "N/A"}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="text-gray-300 text-sm truncate">
                          {schedule.notes || "No notes"}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              alert(`Edit schedule for ${schedule.date}`)
                            }
                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteSchedule(schedule.id)}
                            className="px-3 py-1 bg-red-900/50 hover:bg-red-800 rounded text-sm transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calendar Summary */}
      <div className="mt-8 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
        <h3 className="text-xl font-bold mb-4">📊 Today's Shift Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {shiftTypes.slice(0, 4).map((shift) => {
            const count = schedules.filter(
              (s) => s.shift_type === shift.value
            ).length;
            return (
              <div
                key={shift.value}
                className="bg-gray-800/50 p-4 rounded-xl text-center"
              >
                <p className="text-gray-400 text-sm">{shift.value}</p>
                <p className="text-2xl font-bold mt-2">{count}</p>
                <p className="text-xs text-gray-500 mt-1">officers</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex justify-center space-x-6 border-t border-gray-800 pt-8">
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition"
        >
          📊 Dashboard
        </Link>
        <Link
          href="/officers"
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition"
        >
          👥 Officers
        </Link>
        <Link
          href="/dashboard/schedule"
          className="px-4 py-2 bg-cyan-900/30 hover:bg-cyan-800/30 rounded-lg transition"
        >
          📅 Schedule
        </Link>
        <Link
          href="#"
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition"
        >
          💰 Transactions
        </Link>
        <Link
          href="#"
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition"
        >
          📈 KPI
        </Link>
      </div>
    </div>
  );
}