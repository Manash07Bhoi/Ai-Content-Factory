import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Analytics() {
  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await api.get('/analytics');
      return res.data;
    },
    retry: 1,
  });

  if (isLoading) return <div className="p-8">Loading analytics...</div>;

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Revenue Intelligence & Analytics</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Failed to load analytics data</h3>
            <p className="text-red-700 mb-4">{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
            <Button onClick={() => refetch()} className="bg-white hover:bg-red-50 border-red-200 text-red-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = stats?.data || {};

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Revenue Intelligence & Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">${data.totalRevenue?.toLocaleString() || '0'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Orders</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{data.orders || '0'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Active Affiliates</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{data.activeAffiliates || '0'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Top Product</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold mt-1 text-blue-600">{data.topProduct || 'N/A'}</div></CardContent>
        </Card>
      </div>

      <Card className="min-h-[300px] flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Revenue Chart Visualization Placeholder</div>
      </Card>
    </div>
  );
}
