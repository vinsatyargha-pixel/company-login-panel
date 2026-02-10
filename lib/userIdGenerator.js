// lib/userIdGenerator.js
import { supabase } from '@/lib/supabase'; // IMPORT DI SINI

const departmentCodes = {
  'ADMIN': 'ADM',
  'IT': 'IT',
  'SECURITY': 'SEC',
  'FINANCE': 'FIN',
  'HR': 'HR',
  'OPERATIONS': 'OPS',
  'DEVELOPMENT': 'DEV',
  'SUPPORT': 'SUP'
};

export function generateUserId(department) {
  const dept = department.toUpperCase();
  const deptCode = departmentCodes[dept] || 'GEN';
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `MAGNI-${deptCode}-${randomNum}`;
}

// Cek apakah user_id sudah ada
export async function isUserIdUnique(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('user_id')
    .eq('user_id', userId)
    .single();
    
  return !data; // Return true jika UNIK (tidak ada data)
}