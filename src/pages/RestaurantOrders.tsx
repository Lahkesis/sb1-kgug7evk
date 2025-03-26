import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X } from 'lucide-react';

function RestaurantOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    loadOrders();
    const ordersSubscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadOrders)
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, []);

  async function loadOrders() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: restaurantData } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (restaurantData) {
      setRestaurant(restaurantData);

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          table:tables(table_number),
          order_items(
            quantity,
            unit_price,
            menu_item:menu_items(name)
          )
        `)
        .eq('restaurant_id', restaurantData.id)
        .order('created_at', { ascending: false });

      if (ordersData) setOrders(ordersData);
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    loadOrders();
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Orders</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <div
            key={order.id}
            className={`bg-white rounded-lg shadow p-6 ${
              order.status === 'pending' ? 'border-l-4 border-yellow-500' :
              order.status === 'preparing' ? 'border-l-4 border-blue-500' :
              order.status === 'completed' ? 'border-l-4 border-green-500' :
              'border-l-4 border-red-500'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium">Table {order.table?.table_number}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {order.order_items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.menu_item.name}
                  </span>
                  <span>€{(item.quantity * item.unit_price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>€{order.total_amount.toFixed(2)}</span>
              </div>
              <div className="mt-2">
                <span className={`text-sm ${
                  order.payment_status === 'pending' ? 'text-yellow-600' :
                  order.payment_status === 'completed' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  Payment: {order.payment_status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RestaurantOrders;