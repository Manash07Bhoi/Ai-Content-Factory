import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Award, Zap, AlertCircle, RefreshCw, Activity } from 'lucide-react';

export default function TrendIntelligence() {
  const { data: trends, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-trends'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/automation/trends');
      return res.data;
    },
    retry: 1,
  });

  if (isLoading) return <div className="p-8">Loading trends...</div>;

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Trend Intelligence Engine</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Failed to load trend signals</h3>
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

  const data = trends?.data || [];

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Trend Intelligence Engine</h1>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Currently Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No active trends</h3>
                <p className="text-gray-500 mt-1">The intelligence engine is active but hasn't identified new signals yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.map((trend: any) => (
                  <Card key={trend.id} className="border-gray-200 shadow-sm bg-gray-50 flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold">{trend.topic}</CardTitle>
                        {trend.score > 90 && <Award className="w-5 h-5 text-yellow-500" />}
                      </div>
                      <Badge className="mt-2 w-fit">{trend.category}</Badge>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between text-sm mt-4 text-gray-500">
                        <span>Source: {trend.source}</span>
                        <span className="flex items-center gap-1 font-semibold text-gray-700">
                          <Zap className="w-4 h-4 text-orange-400" /> {trend.score} / 100
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="min-h-[200px] flex items-center justify-center bg-gray-50 border-dashed border-2 text-center p-6">
        <div>
          <h3 className="font-bold text-gray-700 mb-2">Automated Generation Pipeline Active</h3>
          <p className="text-sm text-gray-500">The Scheduler automatically queues prompt, script, and poster generations based on these trending topics daily.</p>
        </div>
      </Card>
    </div>
  );
}
