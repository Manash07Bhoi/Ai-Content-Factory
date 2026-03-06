import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-lg font-bold text-gray-900">AI Content Factory</h1>
        </div>
        <nav className="p-4 space-y-2">
          <Link to="/admin/dashboard" className="block px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100">Dashboard</Link>
          <Link to="/admin/generator" className="block px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100">AI Generator</Link>
          <Link to="/admin/review" className="block px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100">Review Queue</Link>
          <Link to="/admin/product-builder" className="block px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100">Product Builder</Link>
          <Link to="/admin/products" className="block px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100">Products</Link>
          <Link to="/admin/orders" className="block px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100">Orders</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b flex items-center px-6 justify-between">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Admin</span>
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
