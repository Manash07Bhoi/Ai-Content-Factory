import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';

export default function MarketplaceHome() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    }
  });

  if (isLoading) return <div className="text-center py-20">Loading products...</div>;

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Discover the best AI assets</h1>
        <p className="text-xl text-gray-500">Premium prompts, scripts, and posters for creators.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data?.items?.map((product: any) => (
          <Link key={product.id} to={`/marketplace/${product.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border">
            <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400">
              [Image Placeholder]
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {product.product_type.replace('_', ' ')}
                </span>
                <span className="font-bold text-gray-900">${Number(product.price).toFixed(2)}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{product.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
            </div>
          </Link>
        ))}
      </div>
      {(!data?.items || data.items.length === 0) && (
        <div className="text-center py-10 text-gray-500">No products available at the moment.</div>
      )}
    </div>
  );
}
