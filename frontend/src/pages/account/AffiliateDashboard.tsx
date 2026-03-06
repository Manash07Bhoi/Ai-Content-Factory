import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { DollarSign, Link, Copy, CheckCircle, TrendingUp } from 'lucide-react';

export default function AffiliateDashboard() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');

  const { data: affiliate, isLoading } = useQuery({
    queryKey: ['affiliate-profile'],
    queryFn: async () => {
      try {
        const res = await api.get('/affiliates/me');
        return res.data;
      } catch (e: any) {
        if (e.response?.status === 404) return null;
        throw e;
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (email: string) => {
      await api.post('/affiliates/register', { payment_email: email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-profile'] });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="p-8">Loading dashboard...</div>;

  const data = affiliate?.data;

  if (!data) {
    return (
      <div className="container mx-auto py-12 max-w-2xl text-center">
        <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-4">Join our Affiliate Program</h1>
        <p className="text-xl text-gray-600 mb-8">
          Earn 30% commission on every digital product sale you refer. High converting products, fast payouts via PayPal.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); registerMutation.mutate(paypalEmail); }}
          className="bg-gray-50 p-8 rounded-lg shadow-md border border-gray-200"
        >
          <div className="mb-4 text-left">
            <label className="block text-sm font-medium text-gray-700 mb-2">PayPal Email Address for Payouts</label>
            <input
              type="email"
              required
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {registerMutation.isPending ? 'Applying...' : 'Apply Now'}
          </button>
          <p className="text-sm text-gray-500 mt-4">By applying, you agree to our Affiliate Terms and Conditions.</p>
        </form>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/ref/${data.referral_code}`;

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
        <div className="px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wide bg-blue-100 text-blue-800">
          Status: {data.status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-full">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Available Balance</p>
            <h3 className="text-3xl font-bold text-gray-900">${Number(data.available_balance).toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-yellow-100 text-yellow-600 rounded-full">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Commissions</p>
            <h3 className="text-3xl font-bold text-gray-900">${Number(data.pending_balance).toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Commission Rate</p>
            <h3 className="text-3xl font-bold text-gray-900">{(data.commission_rate * 100).toFixed(0)}%</h3>
          </div>
        </div>
      </div>

      {data.status === 'approved' ? (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-2">
              <Link className="w-5 h-5" /> Your Referral Link
            </h3>
            <p className="text-sm text-blue-700">Share this link to earn commission on qualifying sales.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              readOnly
              value={referralLink}
              className="px-4 py-2 border border-blue-300 rounded-md bg-white text-gray-700 w-full md:w-80 outline-none"
            />
            <button
              onClick={() => copyToClipboard(referralLink)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-8 text-yellow-800">
          <strong>Application Pending:</strong> Your affiliate application is currently under review by our team. We'll email you at {data.payment_email} once approved.
        </div>
      )}

      {/* Placeholder for conversions table */}
      <h3 className="text-xl font-bold mb-4 mt-12 border-b pb-2">Recent Conversions</h3>
      <div className="text-center py-12 text-gray-500 bg-gray-50 border border-dashed rounded-lg">
        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        No conversions yet. Share your link to start earning!
      </div>
    </div>
  );
}
