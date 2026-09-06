import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Student from './pages/Student';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded routes for performance & bundle splitting
const ShopDetails = lazy(() => import('./pages/student/ShopDetails'));
const ProductDetails = lazy(() => import('./pages/student/ProductDetails'));
const CartPage = lazy(() => import('./pages/student/CartPage'));
const CheckoutPage = lazy(() => import('./pages/student/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/student/OrderSuccessPage'));
const OrderHistoryPage = lazy(() => import('./pages/student/OrderHistoryPage'));
const OrderDetailsPage = lazy(() => import('./pages/student/OrderDetailsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const Shopkeeper = lazy(() => import('./pages/Shopkeeper'));
const Delivery = lazy(() => import('./pages/Delivery'));
const Admin = lazy(() => import('./pages/Admin'));

const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', padding: '2rem' }}>
    <div style={{ width: '2rem', height: '2rem', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="unauthorized" element={<Unauthorized />} />

            {/* Protected Student Routes */}
            <Route
              path="student"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <Student />
                </ProtectedRoute>
              }
            />
            <Route
              path="student/shops/:id"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <ShopDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="student/products/:id"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <ProductDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="cart"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="checkout"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <OrderHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/:orderId"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'SHOPKEEPER', 'ADMIN', 'DELIVERY_BOY']}>
                  <OrderDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/:orderId/success"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <OrderSuccessPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="notifications"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'SHOPKEEPER', 'ADMIN', 'DELIVERY_BOY']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Staff & Admin Protected Routes */}
            <Route
              path="shopkeeper"
              element={
                <ProtectedRoute allowedRoles={['SHOPKEEPER']}>
                  <Shopkeeper />
                </ProtectedRoute>
              }
            />
            <Route
              path="delivery"
              element={
                <ProtectedRoute allowedRoles={['DELIVERY_BOY']}>
                  <Delivery />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
