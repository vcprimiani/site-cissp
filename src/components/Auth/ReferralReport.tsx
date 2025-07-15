import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PageWrapper } from '../Layout/PageWrapper';

interface ReferralRow {
  user_id: string;
  ref_code: string;
  created_at: string;
  email: string;
}

function exportToCSV(rows: ReferralRow[]) {
  const header = ['Email', 'Referral Code', 'Signup Date'];
  const csv = [
    header.join(','),
    ...rows.map(row => [
      `"${row.email}"`,
      `"${row.ref_code}"`,
      `"${new Date(row.created_at).toLocaleString()}"`
    ].join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'referral_report.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

export const ReferralReport: React.FC = () => {
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCode, setFilterCode] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  useEffect(() => {
    const fetchReferrals = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('referral_report')
        .select('user_id, ref_code, created_at, email')
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
        setRows([]);
      } else {
        setRows(data || []);
      }
      setLoading(false);
    };
    fetchReferrals();
  }, []);

  // Filtering
  const filteredRows = rows.filter(row => {
    const matchesCode = filterCode ? row.ref_code.toLowerCase().includes(filterCode.toLowerCase()) : true;
    const date = new Date(row.created_at);
    const matchesStart = filterStart ? date >= new Date(filterStart) : true;
    const matchesEnd = filterEnd ? date <= new Date(filterEnd) : true;
    return matchesCode && matchesStart && matchesEnd;
  });

  // Summary
  const totalSignups = filteredRows.length;
  const byCode: Record<string, number> = {};
  filteredRows.forEach(row => {
    byCode[row.ref_code] = (byCode[row.ref_code] || 0) + 1;
  });

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center py-12">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-3xl w-full">
          {/* Branding and Logo */}
          <div className="flex items-center mb-8 p-4 bg-white border border-gray-200 rounded shadow-sm space-x-4">
            <img 
              src="/Untitled design-7.png" 
              alt="CISSP.app Logo" 
              className="w-12 h-12 object-contain rounded-lg border border-gray-100 bg-gray-50"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">www.cissp.app</h1>
              <p className="text-sm text-gray-600 font-medium">by <a href="https://CISSPStudyGroup.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">CISSPStudyGroup.com</a></p>
            </div>
          </div>

          {/* Testing URLs for LearnWorlds Integration */}
          <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <h3 className="font-bold text-blue-800 mb-2">Production Onboarding URL (for LearnWorlds)</h3>
            <p className="text-blue-900 text-sm mb-2">
              This is the production onboarding URL for LearnWorlds integration. Use this in your LearnWorlds external link activity to onboard users and track referrals.
            </p>
            <div className="bg-white border border-blue-200 rounded px-2 py-1 my-2 font-mono text-xs text-blue-900">
              {'https://www.cissp.app/onboard?email={{USER_EMAIL}}&name={{USER_NAME}}&ref=learnworlds'}
            </div>
            <p className="text-blue-900 text-xs">
              All users who sign up via this flow will appear in the referral report below.
            </p>
          </div>

          {/* Summary */}
          <div className="mb-6 flex flex-wrap gap-6 items-center justify-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{totalSignups}</div>
              <div className="text-gray-600">Total Signups</div>
            </div>
            {Object.keys(byCode).map(code => (
              <div key={code} className="bg-green-50 border border-green-200 rounded-lg px-6 py-4 text-center">
                <div className="text-xl font-bold text-green-700">{byCode[code]}</div>
                <div className="text-gray-600">Referral: <span className="font-mono">{code}</span></div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4 items-end justify-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code</label>
              <input
                type="text"
                value={filterCode}
                onChange={e => setFilterCode(e.target.value)}
                className="border px-3 py-2 rounded w-40"
                placeholder="e.g. learnworlds"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filterStart}
                onChange={e => setFilterStart(e.target.value)}
                className="border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filterEnd}
                onChange={e => setFilterEnd(e.target.value)}
                className="border px-3 py-2 rounded"
              />
            </div>
            <button
              className="ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => exportToCSV(filteredRows)}
              disabled={filteredRows.length === 0}
            >
              Download CSV
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center text-gray-600">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : filteredRows.length === 0 ? (
            <div className="text-center text-gray-500">No signups found for the selected filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Referral Code</th>
                    <th className="px-4 py-2 text-left">Signup Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.user_id} className="border-t border-gray-100">
                      <td className="px-4 py-2">{row.email}</td>
                      <td className="px-4 py-2">{row.ref_code}</td>
                      <td className="px-4 py-2">{new Date(row.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}; 