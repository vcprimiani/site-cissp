import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PageWrapper } from '../Layout/PageWrapper';

interface ReferralRow {
  user_id: string;
  ref_code: string;
  created_at: string;
  email: string;
}

export const ReferralReport: React.FC = () => {
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferrals = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('user_referrals')
        .select('user_id, ref_code, created_at, users: user_id (email)')
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
        setRows([]);
      } else {
        setRows(
          (data || []).map((row: any) => ({
            user_id: row.user_id,
            ref_code: row.ref_code,
            created_at: row.created_at,
            email: row.users?.email || ''
          }))
        );
      }
      setLoading(false);
    };
    fetchReferrals();
  }, []);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center py-12">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-2xl w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Referral Report</h2>
          {loading ? (
            <div className="text-center text-gray-600">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : (
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Referral Code</th>
                  <th className="px-4 py-2 text-left">Signup Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.user_id} className="border-t border-gray-100">
                    <td className="px-4 py-2">{row.email}</td>
                    <td className="px-4 py-2">{row.ref_code}</td>
                    <td className="px-4 py-2">{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}; 