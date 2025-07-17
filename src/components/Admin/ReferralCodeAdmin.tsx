import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PageWrapper } from '../Layout/PageWrapper';
import { Shield, Lock, Edit, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react';

interface ReferralCode {
  id: string;
  code: string;
  description: string;
  partner_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ADMIN_CODE = '12561';

export const ReferralCodeAdmin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [codePrompt, setCodePrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ReferralCode>>({});
  const [adding, setAdding] = useState(false);

  // Admin code auth
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codePrompt === ADMIN_CODE) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Incorrect admin code.');
    }
  };

  // Fetch codes
  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setCodes(data || []);
    setLoading(false);
  };
  useEffect(() => { if (isAuthenticated) fetchCodes(); }, [isAuthenticated]);

  // Add or update code
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code) return setError('Code is required');
    setError(null);
    if (editId) {
      // Update
      const { error } = await supabase
        .from('referral_codes')
        .update({
          code: form.code,
          description: form.description,
          partner_name: form.partner_name,
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editId);
      if (error) setError(error.message);
      else {
        setEditId(null);
        setForm({});
        fetchCodes();
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('referral_codes')
        .insert({
          code: form.code,
          description: form.description,
          partner_name: form.partner_name,
          is_active: true,
        });
      if (error) setError(error.message);
      else {
        setAdding(false);
        setForm({});
        fetchCodes();
      }
    }
  };

  // Deactivate/reactivate
  const handleToggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('referral_codes').update({ is_active: !isActive, updated_at: new Date().toISOString() }).eq('id', id);
    fetchCodes();
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this referral code?')) return;
    await supabase.from('referral_codes').delete().eq('id', id);
    fetchCodes();
  };

  if (!isAuthenticated) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg border-2 border-gray-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h2>
            <p className="text-gray-600">Enter the admin code to manage referral codes and partners</p>
          </div>
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <input
              type="password"
              value={codePrompt}
              onChange={e => setCodePrompt(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg text-center text-lg font-mono tracking-widest border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Admin Code"
              maxLength={5}
              autoComplete="off"
            />
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}
            <button type="submit" className="w-full py-3 px-4 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg">Access Admin</button>
          </form>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg border-2 border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Referral Codes & Partners</h2>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="/admin"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              ← Back to Admin
            </a>
            <button onClick={() => { setAdding(true); setEditId(null); setForm({}); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"><Plus className="w-4 h-4 mr-1" /> Add Code</button>
          </div>
        </div>
        {/* Add/Edit Form */}
        {(adding || editId) && (
          <form onSubmit={handleSave} className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Referral Code (e.g. learnworlds)"
                value={form.code || ''}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded"
                required
                disabled={!!editId}
              />
              <input
                type="text"
                placeholder="Partner Name (optional)"
                value={form.partner_name || ''}
                onChange={e => setForm(f => ({ ...f, partner_name: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded"
              />
            </div>
            <textarea
              placeholder="Description (optional)"
              value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
              rows={2}
            />
            <div className="flex items-center space-x-3">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">{editId ? 'Update' : 'Add'} Code</button>
              <button type="button" onClick={() => { setAdding(false); setEditId(null); setForm({}); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium">Cancel</button>
            </div>
            {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{error}</div>}
          </form>
        )}
        {/* Codes Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 border">Code</th>
                <th className="px-3 py-2 border">Partner</th>
                <th className="px-3 py-2 border">Description</th>
                <th className="px-3 py-2 border">Status</th>
                <th className="px-3 py-2 border">Created</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(rc => (
                <tr key={rc.id} className={rc.is_active ? '' : 'bg-gray-50 text-gray-400'}>
                  <td className="px-3 py-2 border font-mono">{rc.code}</td>
                  <td className="px-3 py-2 border">{rc.partner_name || '-'}</td>
                  <td className="px-3 py-2 border">{rc.description || '-'}</td>
                  <td className="px-3 py-2 border text-center">
                    {rc.is_active ? <span className="inline-flex items-center text-green-700"><CheckCircle className="w-4 h-4 mr-1" /> Active</span> : <span className="inline-flex items-center text-red-600"><XCircle className="w-4 h-4 mr-1" /> Inactive</span>}
                  </td>
                  <td className="px-3 py-2 border">{new Date(rc.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 border space-x-2">
                    <button onClick={() => { setEditId(rc.id); setForm(rc); setAdding(false); }} className="text-blue-600 hover:underline"><Edit className="w-4 h-4 inline" /> Edit</button>
                    <button onClick={() => handleToggleActive(rc.id, rc.is_active)} className={rc.is_active ? 'text-yellow-600 hover:underline' : 'text-green-600 hover:underline'}>{rc.is_active ? <XCircle className="w-4 h-4 inline" /> : <CheckCircle className="w-4 h-4 inline" />} {rc.is_active ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => handleDelete(rc.id)} className="text-red-600 hover:underline"><Trash2 className="w-4 h-4 inline" /> Delete</button>
                  </td>
                </tr>
              ))}
              {codes.length === 0 && !loading && (
                <tr><td colSpan={6} className="text-center py-6 text-gray-400">No referral codes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}; 