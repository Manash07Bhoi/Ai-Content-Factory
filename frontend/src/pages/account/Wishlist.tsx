import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { Trash2, Heart } from 'lucide-react';

export default function Wishlist() {
  const queryClient = useQueryClient();

  const { data: wishlistItems, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await api.get('/wishlists');
      return res.data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/wishlists/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  if (isLoading) return <div className="p-8">Loading wishlist...</div>;

  const items = wishlistItems?.data || [];

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-8 h-8 text-pink-500 fill-current" />
        <h1 className="text-3xl font-bold">My Wishlist</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Explore our marketplace and save your favorite products.</p>
          <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item: any) => (
            <div key={item.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition">
              <Link to={`/marketplace/${item.product.id}`}>
                <div className="h-48 bg-gray-200 w-full relative">
                  {/* Placeholder for product image */}
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.product.title)}&background=random&color=fff&size=400`}
                    alt={item.product.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md text-sm font-bold shadow">
                    ${Number(item.product.price_usd).toFixed(2)}
                  </div>
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/marketplace/${item.product.id}`}>
                  <h3 className="font-bold text-lg mb-1 truncate" title={item.product.title}>{item.product.title}</h3>
                </Link>
                <p className="text-sm text-gray-500 mb-4 truncate">{item.product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Added {new Date(item.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => removeMutation.mutate(item.product.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
