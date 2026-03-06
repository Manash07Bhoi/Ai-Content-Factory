import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';

export default function ProductBuilder() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    product_type: 'prompt_pack',
    price: '9.99',
    content_ids: 'id1,id2,id3'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        content_ids: formData.content_ids.split(',').map(id => id.trim())
      };
      await api.post('/product-builder/create-pack', payload);
      alert('Product pack creation started in the background.');
    } catch (err) {
      alert('Failed to start product builder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm max-w-2xl">
      <h2 className="text-xl font-bold mb-6">Build New Product Pack</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text" required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            required rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})}
            >
              <option value="prompt_pack">Prompt Pack</option>
              <option value="script_pack">Script Pack</option>
              <option value="poster_pack">Poster Pack</option>
              <option value="social_pack">Social Pack</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
            <input
              type="number" step="0.01" min="0.99" required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Content IDs (comma separated)</label>
          <input
            type="text" required placeholder="id1, id2, id3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-500"
            value={formData.content_ids} onChange={e => setFormData({...formData, content_ids: e.target.value})}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full mt-4">
          {loading ? 'Building...' : 'Build Pack'}
        </Button>
      </form>
    </div>
  );
}
