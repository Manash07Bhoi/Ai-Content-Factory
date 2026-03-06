
export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Content Generated</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">1,248</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">42</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">$3,490.00</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm h-96 flex items-center justify-center">
        <p className="text-gray-500">Chart Visualization Placeholder (e.g. Recharts)</p>
      </div>
    </div>
  );
}
