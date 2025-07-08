import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SubscribedUser {
  customer_id: string;
  status: string;
  email: string | null;
}

export const AdminSubscriptionCard: React.FC = () => {
  const [subs, setSubs] = useState<SubscribedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      // Get all active/trialing subscriptions and join with customers
      const { data, error } = await supabase
        .from('stripe_subscriptions')
        .select('customer_id, status, stripe_customers!inner(user_id, email)')
        .in('status', ['active', 'trialing']);

      if (error) {
        setSubs([]);
      } else {
        // Map to a flat structure
        setSubs((data || []).map((sub: any) => ({
          customer_id: sub.customer_id,
          status: sub.status,
          email: sub.stripe_customers?.email || null,
        })));
      }
      setLoading(false);
    };
    fetchSubs();
  }, []);

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6 mb-8">
      <h3 className="text-lg font-bold text-yellow-900 mb-2">Admin: Subscribed Users</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {subs.map((sub, idx) => (
            <li key={idx} className="flex justify-between">
              <span className="font-mono">{sub.email || sub.customer_id}</span>
              <span className="text-xs text-green-700">{sub.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}; 