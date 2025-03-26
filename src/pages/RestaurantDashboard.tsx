import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Store } from 'lucide-react';

function RestaurantDashboard() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [isCreatingRestaurant, setIsCreatingRestaurant] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newRestaurantDescription, setNewRestaurantDescription] = useState('');

  useEffect(() => {
    loadRestaurantData();
  }, []);

  async function loadRestaurantData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: restaurantData, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (restaurantData) {
      setRestaurant(restaurantData);

      // Load tables
      const { data: tablesData } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantData.id);
      
      if (tablesData) setTables(tablesData);

      // Load menu categories
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('sort_order');

      if (categoriesData) {
        setMenuCategories(categoriesData);

        // Load menu items
        const { data: menuItemsData } = await supabase
          .from('menu_items')
          .select('*')
          .in('category_id', categoriesData.map(c => c.id));

        if (menuItemsData) setMenuItems(menuItemsData);
      }
    }
  }

  const createRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newRestaurant, error } = await supabase
      .from('restaurants')
      .insert([{
        name: newRestaurantName,
        description: newRestaurantDescription,
        owner_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating restaurant:', error);
      return;
    }

    setRestaurant(newRestaurant);
    setIsCreatingRestaurant(false);
    loadRestaurantData();
  };

  const addTable = async () => {
    if (!restaurant || !newTableNumber.trim()) return;

    const { data: newTable } = await supabase
      .from('tables')
      .insert([{
        restaurant_id: restaurant.id,
        table_number: newTableNumber,
        qr_code: `${window.location.origin}/menu/${restaurant.id}/${newTableNumber}`
      }])
      .select()
      .single();

    if (newTable) {
      setTables([...tables, newTable]);
      setNewTableNumber('');
    }
  };

  const deleteTable = async (tableId: string) => {
    await supabase
      .from('tables')
      .delete()
      .eq('id', tableId);

    setTables(tables.filter(table => table.id !== tableId));
  };

  if (!restaurant && !isCreatingRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Store className="h-16 w-16 text-indigo-600 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to QR Order</h2>
        <p className="text-gray-600 text-center mb-8 max-w-md">
          Get started by creating your restaurant profile. You'll be able to manage your menu, 
          tables, and orders all in one place.
        </p>
        <button
          onClick={() => setIsCreatingRestaurant(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Your Restaurant
        </button>
      </div>
    );
  }

  if (isCreatingRestaurant) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Create Your Restaurant</h2>
        <form onSubmit={createRestaurant} className="space-y-6">
          <div>
            <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700">
              Restaurant Name
            </label>
            <input
              type="text"
              id="restaurantName"
              value={newRestaurantName}
              onChange={(e) => setNewRestaurantName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="restaurantDescription" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="restaurantDescription"
              value={newRestaurantDescription}
              onChange={(e) => setNewRestaurantDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsCreatingRestaurant(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Create Restaurant
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{restaurant.name} Dashboard</h1>
        <p className="mt-2 text-gray-600">{restaurant.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Tables</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              placeholder="Table number"
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button
              onClick={addTable}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            {tables.map(table => (
              <div key={table.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Table {table.table_number}</h3>
                  <button
                    onClick={() => deleteTable(table.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex justify-center bg-white p-4">
                  <QRCodeSVG
                    value={table.qr_code}
                    size={128}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Menu Overview</h2>
          <div className="space-y-6">
            {menuCategories.map(category => (
              <div key={category.id}>
                <h3 className="font-medium text-lg mb-2">{category.name}</h3>
                <div className="space-y-2">
                  {menuItems
                    .filter(item => item.category_id === category.id)
                    .map(item => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span>{item.name}</span>
                        <span>€{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RestaurantDashboard;