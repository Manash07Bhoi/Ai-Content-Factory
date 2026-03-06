import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';

export default function AIGenerator() {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);

  const handleGenerate = async (type: string) => {
    setLoading(true);
    try {
      await api.post(`/ai/generate/${type}`, { topic: topic || 'Cyberpunk city', count });
      alert('Generation queued successfully!');
    } catch (err) {
      alert('Error triggering generation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Generation Settings</h2>
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Topic (e.g., Sci-Fi Landscapes)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-24 border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button disabled={loading} onClick={() => handleGenerate('prompts')}>Generate Prompts</Button>
          <Button disabled={loading} onClick={() => handleGenerate('scripts')}>Generate Scripts</Button>
          <Button disabled={loading} onClick={() => handleGenerate('posters')}>Generate Posters</Button>
          <Button disabled={loading} onClick={() => handleGenerate('social')}>Generate Social</Button>
        </div>
      </div>
    </div>
  );
}
