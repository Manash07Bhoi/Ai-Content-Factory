import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function SystemHealth() {
  const { data: health, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await api.get('/health');
      return res.data;
    },
    refetchInterval: 10000,
    retry: 1,
  });

  if (isLoading && !health) return <div className="p-8">Loading system health...</div>;

  if (isError && !health) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">System Health & Observability</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Failed to retrieve system health</h3>
            <p className="text-red-700 mb-4">{error instanceof Error ? error.message : 'System is unreachable'}</p>
            <Button onClick={() => refetch()} className="bg-white hover:bg-red-50 border-red-200 text-red-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = health?.status || 'down';
  const info = health?.info || {};
  const errData = health?.error || {};
  const allServices = { ...info, ...errData };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Health & Observability</h1>
        <Badge variant={status === 'ok' ? 'default' : 'destructive'} className="text-lg py-1 px-4">
          {status.toUpperCase()}
        </Badge>
      </div>

      {Object.keys(allServices).length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          No detailed health metrics available.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(allServices).map(([service, data]: [string, any]) => (
            <Card key={service}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md capitalize">{service}</CardTitle>
                <div className={`h-3 w-3 rounded-full ${data.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  {Object.entries(data).map(([k, v]) => {
                    if (k === 'status') return null;
                    return (
                      <div key={k} className="flex justify-between mt-1">
                        <span className="capitalize">{k}:</span>
                        <span className="font-medium text-gray-900">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="min-h-[250px] flex flex-col items-center justify-center bg-gray-50 mb-8 p-6 text-center">
        <h3 className="font-bold text-lg mb-2 text-gray-700">Prometheus / Grafana Metrics</h3>
        <p className="text-gray-500">Live Grafana charts and deeper observability dashboards are accessible internally.</p>
        <a href="/admin/queues" className="mt-4 text-blue-600 hover:underline font-medium">View BullMQ Dashboard →</a>
      </Card>
    </div>
  );
}
