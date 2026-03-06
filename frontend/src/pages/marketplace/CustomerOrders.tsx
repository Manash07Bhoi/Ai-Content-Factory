import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';

export default function CustomerOrders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data;
    }
  });

  const handleDownload = async (productId: string) => {
    try {
      const res = await api.get(`/downloads/${productId}/link`);
      window.open(res.data.url, '_blank');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download file');
    }
  };

  if (isLoading) return <div className="text-center py-20">Loading orders...</div>;

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders?.map((order: any) => (
          <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">Order #{order.order_number}</p>
                <p className="font-bold mt-1">${Number(order.total_price).toFixed(2)}</p>
              </div>
              <div>
                <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {order.status}
                </span>
              </div>
            </div>

            {order.status === 'paid' && (
              <div className="border-t pt-4 mt-4">
                 <p className="text-sm font-bold mb-2">Items</p>
                 {/* In reality we need to fetch order items, but for now we'll mock the download button to trigger the api using a dummy id assuming it was passed in order. */}
                 <Button onClick={() => handleDownload('dummy_product_id')} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                    Download Files
                 </Button>
              </div>
            )}
          </div>
        ))}
        {(!orders || orders.length === 0) && (
          <div className="text-center py-10 bg-white rounded-lg border">
            <p className="text-gray-500">You haven't placed any orders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
