import { Outlet, Link } from 'react-router-dom';

export default function MarketplaceLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-600">AI Content Factory</Link>
          <nav className="flex items-center gap-6">
            <Link to="/marketplace" className="text-gray-600 hover:text-gray-900">Explore</Link>
            <Link to="/account/orders" className="text-gray-600 hover:text-gray-900">My Orders</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-gray-50 py-8">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">AI Content Factory</h3>
            <p className="text-gray-400">Automated digital products, delivered instantly.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Products</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Prompts</li>
              <li>Posters</li>
              <li>Scripts</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li>FAQ</li>
              <li>Contact Us</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
