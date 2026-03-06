import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [checkingOut, setCheckout] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data;
    }
  });

  const handleCheckout = async () => {
    setCheckout(true);
    try {
      const res = await api.post('/orders/checkout', { productIds: [id] });
      // Usually here you redirect to Stripe Elements checkout flow.
      // We will mock the next step with an alert for now.
      alert(`Stripe Client Secret acquired: ${res.data.clientSecret}. Proceed to Stripe Elements.`);
    } catch (err) {
      alert('Checkout failed. Please ensure you are logged in.');
    } finally {
      setCheckout(false);
    }
  };

  if (isLoading) return <div className="text-center py-20">Loading...</div>;
  if (!product) return <div className="text-center py-20">Product not found</div>;

  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="bg-white rounded-xl shadow-sm border p-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2 bg-gray-100 rounded-lg min-h-[300px] flex items-center justify-center">
           <span className="text-gray-400">Thumbnail Preview</span>
        </div>
        <div className="w-full md:w-1/2 space-y-6">
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-blue-600">{product.product_type.replace('_', ' ')}</span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">{product.title}</h1>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>

          <div className="text-4xl font-bold text-gray-900">
            ${Number(product.price).toFixed(2)}
          </div>

          <Button onClick={handleCheckout} disabled={checkingOut} className="w-full h-12 text-lg">
            {checkingOut ? 'Processing...' : 'Buy Now'}
          </Button>

          <div className="pt-6 border-t">
             <h3 className="font-bold text-gray-900 mb-2">What's included:</h3>
             <ul className="list-disc pl-5 text-gray-600 space-y-1">
               <li>{product.item_count} premium quality items</li>
               <li>Instant digital download (ZIP/PDF)</li>
               <li>Commercial usage license</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
