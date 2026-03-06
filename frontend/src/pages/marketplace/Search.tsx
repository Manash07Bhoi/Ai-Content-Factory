import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSearchParams, Link } from 'react-router-dom';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  const { data, isLoading } = useQuery({
    queryKey: ['search', searchParams.get('q')],
    queryFn: async () => {
      const q = searchParams.get('q');
      if (!q) return [];
      const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
      return res.data;
    },
    enabled: !!searchParams.get('q'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Global Search</h1>

      <form onSubmit={handleSearch} className="mb-8 flex max-w-lg">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, scripts, prompts..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium rounded-r-md hover:bg-blue-700">
          Search
        </button>
      </form>

      {isLoading ? (
        <p className="text-gray-500">Searching...</p>
      ) : data?.data?.items ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Results for "{searchParams.get('q')}"</h2>
          {data.data.items.length === 0 ? (
            <p className="text-gray-500">No results found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.items.map((item: any) => (
                <Link to={`/marketplace/${item.id}`} key={item.id} className="block border rounded-lg p-4 hover:shadow-lg transition">
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <p className="text-blue-600 font-semibold">${Number(item.price_usd).toFixed(2)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
