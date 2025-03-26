import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import CustomerMenu from './pages/CustomerMenu';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RestaurantOrders from './pages/RestaurantOrders';
import RestaurantSettings from './pages/RestaurantSettings';
import QRScanner from './pages/QRScanner';
import Auth from './components/Auth';
import { Utensils, LogOut } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Utensils className="h-8 w-8 text-indigo-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">QR Order</span>
                </div>
              </div>
              {user && (
                <div className="flex items-center">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-5 w-5 mr-1" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/menu/:restaurantId/:tableId" element={<CustomerMenu />} />
            <Route path="/scan" element={<QRScanner />} />
            <Route
              path="/dashboard"
              element={user ? <RestaurantDashboard /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/orders"
              element={user ? <RestaurantOrders /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/settings"
              element={user ? <RestaurantSettings /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/auth"
              element={!user ? <Auth /> : <Navigate to="/dashboard" replace />}
            />
            <Route
              path="/"
              element={<Navigate to={user ? "/dashboard" : "/auth"} replace />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;