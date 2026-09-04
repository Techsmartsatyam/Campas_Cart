import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Student from './pages/Student';
import ShopDetails from './pages/student/ShopDetails';
import ProductDetails from './pages/student/ProductDetails';
import CartPage from './pages/student/CartPage';
import CheckoutPage from './pages/student/CheckoutPage';
import OrderSuccessPage from './pages/student/OrderSuccessPage';
import OrderHistoryPage from './pages/student/OrderHistoryPage';
import OrderDetailsPage from './pages/student/OrderDetailsPage';
import NotificationsPage from './pages/NotificationsPage';
import Shopkeeper from './pages/Shopkeeper';
import Delivery from './pages/Delivery';
import Admin from './pages/Admin';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
