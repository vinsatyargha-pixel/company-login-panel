// app/dashboard/analytics/player/upload/list/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface UploadGroup {
  upload_id: string;
  upload_date: string;
  total_records: number;
  first_upload: string;
}

export default function UploadListPage() {
  const [uploads, setUploads] = useState<UploadGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState<string | null>(null);
  const [uploadDetails, setUploadDetails] = useState<any[]>([]);

  useEffect(() => {
    fetchUploads();
  }, []);

  useEffect(() => {
    if (selectedUpload) {
      fetchUploadDetails(selectedUpload);
    }
  }, [selectedUpload]);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('player_uploads')
        .select('upload_id, upload_date')
        .order('upload_date', { ascending: false });

      if (error) throw error;

      // Group by upload_id
      const grouped = new Map<string, { upload_date: string; count: number }>();
      
      data?.forEach((item: any) => {
        if (!grouped.has(item.upload_id)) {
          grouped.set(item.upload_id, {
            upload_date: item.upload_date,
            count: 0
          });
        }
        grouped.get(item.upload_id)!.count++;
      });

      const uploadList = Array.from(grouped.entries()).map(([upload_id, info]) => ({
        upload_id,
        upload_date: info.upload_date,
        total_records: info.count,
        first_upload: info.upload_date
      }));

      setUploads(uploadList);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadDetails = async (uploadId: string) => {
    try {
      const { data, error } = await supabase
        .from('player_uploads')
        .select('*')
        .eq('upload_id', uploadId)
        .order('no', { ascending: true });

      if (error) throw error;
      setUploadDetails(data || []);
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <Link href="/dashboard/analytics/player/upload" className="text-[#FFD700] hover:underline">
          ← BACK TO UPLOAD
        </Link>
        <div className="text-[#FFD700] font-bold text-xl">📋 MEMBER UPLOADS</div>
        <Link
          href="/dashboard/analytics/player/upload"
          className="bg-[#FFD700] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#FFD700]/90 transition-all"
        >
          + UPLOAD NEW
        </Link>
      </div>

      {/* UPLOAD LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - UPLOAD HISTORY */}
        <div className="lg:col-span-1">
          <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
            <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
              <h3 className="text-[#FFD700] font-bold">Upload History</h3>
            </div>
            <div className="divide-y divide-[#FFD700]/10">
              {uploads.length === 0 ? (
                <div className="p-6 text-center text-[#A7D8FF]">
                  No uploads yet. Click "UPLOAD NEW" to add member data.
                </div>
              ) : (
                uploads.map((upload) => (
                  <button
                    key={upload.upload_id}
                    onClick={() => setSelectedUpload(upload.upload_id)}
                    className={`w-full text-left p-4 hover:bg-[#0B1A33]/50 transition-all ${
                      selectedUpload === upload.upload_id ? 'bg-[#FFD700]/10 border-l-4 border-[#FFD700]' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {formatDate(upload.upload_date)}
                        </div>
                        <div className="text-xs text-[#A7D8FF] mt-1">
                          {upload.total_records} records
                        </div>
                      </div>
                      <div className="text-xs text-[#FFD700]">
                        ID: {upload.upload_id.slice(0, 8)}...
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - UPLOAD DETAILS */}
        <div className="lg:col-span-2">
          {selectedUpload ? (
            <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
              <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
                <h3 className="text-[#FFD700] font-bold">Upload Details</h3>
                <p className="text-xs text-[#A7D8FF] mt-1">
                  Upload ID: {selectedUpload}
                </p>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#0B1A33]/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-[#FFD700]">No</th>
                      <th className="px-3 py-2 text-left text-[#FFD700]">Username</th>
                      <th className="px-3 py-2 text-left text-[#FFD700]">Full Name</th>
                      <th className="px-3 py-2 text-left text-[#FFD700]">Loyalty</th>
                      <th className="px-3 py-2 text-left text-[#FFD700]">Group</th>
                      <th className="px-3 py-2 text-right text-[#FFD700]">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadDetails.map((player, idx) => (
                      <tr key={idx} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/30">
                        <td className="px-3 py-2">{player.no}</td>
                        <td className="px-3 py-2 text-[#A7D8FF] font-mono">{player.username}</td>
                        <td className="px-3 py-2">{player.full_name}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            player.loyalty_level === 'Gold' ? 'bg-yellow-500/20 text-yellow-400' :
                            player.loyalty_level === 'Silver' ? 'bg-gray-400/20 text-gray-300' :
                            'bg-amber-600/20 text-amber-400'
                          }`}>
                            {player.loyalty_level || 'Bronze'}
                          </span>
                        </td>
                        <td className="px-3 py-2">{player.player_group}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(player.current_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-[#FFD700] mb-2">Select an Upload</h3>
              <p className="text-[#A7D8FF]">
                Click on any upload from the left to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}