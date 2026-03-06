import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AdminLayout from './layouts/AdminLayout';
import MarketplaceLayout from './layouts/MarketplaceLayout';

import Dashboard from './pages/admin/Dashboard';
import AIGenerator from './pages/admin/AIGenerator';
import ReviewQueue from './pages/admin/ReviewQueue';
import ProductBuilder from './pages/admin/ProductBuilder';

import Home from './pages/marketplace/Home';
import ProductDetail from './pages/marketplace/ProductDetail';
import CustomerOrders from './pages/marketplace/CustomerOrders';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Marketplace Routes */}
          <Route element={<MarketplaceLayout />}>
            <Route path="/" element={<Navigate to="/marketplace" replace />} />
            <Route path="/marketplace" element={<Home />} />
            <Route path="/marketplace/:id" element={<ProductDetail />} />
            <Route path="/account/orders" element={<CustomerOrders />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="generator" element={<AIGenerator />} />
            <Route path="review" element={<ReviewQueue />} />
            <Route path="product-builder" element={<ProductBuilder />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
