import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';

export default function ReviewQueue() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const res = await api.get('/approvals/pending');
      return res.data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/approvals/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/approvals/${id}/reject`, { reason: 'Rejected by admin' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals'] }),
  });

  if (isLoading) return <div>Loading queue...</div>;

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data?.items?.map((item: any) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.content_type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  {item.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => approveMutation.mutate(item.id)}
                  disabled={approveMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => rejectMutation.mutate(item.id)}
                  disabled={rejectMutation.isPending}
                >
                  Reject
                </Button>
              </td>
            </tr>
          ))}
          {(!data?.items || data.items.length === 0) && (
            <tr>
              <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No items pending review.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
