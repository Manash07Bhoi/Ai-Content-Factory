import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, Users } from 'lucide-react';

export default function AdminAffiliates() {
  const queryClient = useQueryClient();

  const { data: affiliates, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-affiliates'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/affiliates?limit=100');
      return res.data;
    },
    retry: 1,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.patch(`/api/v1/affiliates/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.patch(`/api/v1/affiliates/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to reject'),
  });

  if (isLoading) return <div className="p-8">Loading affiliates...</div>;

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Affiliate Management</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Failed to load affiliates</h3>
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

  const items = affiliates?.data?.items || [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Affiliate Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate Applications & Partners</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No affiliates found</h3>
              <p className="text-gray-500 mt-1">There are currently no affiliate partners or pending applications.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Code / User</th>
                    <th scope="col" className="px-6 py-3">PayPal Email</th>
                    <th scope="col" className="px-6 py-3">Rate</th>
                    <th scope="col" className="px-6 py-3">Balance</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((aff: any) => (
                    <tr key={aff.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        <div className="font-mono text-blue-600">{aff.referral_code}</div>
                        <div className="text-xs text-gray-400 mt-1">{aff.user_id}</div>
                      </td>
                      <td className="px-6 py-4">{aff.payment_email}</td>
                      <td className="px-6 py-4">{(aff.commission_rate * 100).toFixed(0)}%</td>
                      <td className="px-6 py-4">
                        <div className="text-green-600 font-bold">${Number(aff.available_balance).toFixed(2)}</div>
                        <div className="text-xs text-yellow-600">Pending: ${Number(aff.pending_balance).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="badge" variant={aff.status === 'approved' ? 'default' : aff.status === 'pending' ? 'secondary' : 'destructive'}>
                          {aff.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {aff.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button className="text-sm text-green-600 border-green-600 hover:bg-green-50" onClick={() => approveMutation.mutate(aff.id)}>Approve</Button>
                            <Button className="text-sm text-red-600 border-red-600 hover:bg-red-50" onClick={() => rejectMutation.mutate(aff.id)}>Reject</Button>
                          </div>
                        )}
                        {aff.status === 'approved' && aff.available_balance > 0 && (
                          <Button className="text-sm">Mark Paid</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
