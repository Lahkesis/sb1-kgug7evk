/*
  # Initial Schema Setup for Restaurant QR Ordering System

  1. New Tables
    - restaurants
      - Basic restaurant information
    - tables
      - Restaurant tables with QR codes
    - menu_categories
      - Menu item categories
    - menu_items
      - Individual menu items
    - orders
      - Customer orders
    - order_items
      - Items within each order

  2. Security
    - Enable RLS on all tables
    - Add policies for restaurant owners and customers
*/

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can manage their restaurants"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Public can view restaurants"
  ON restaurants
  FOR SELECT
  TO public
  USING (true);

-- Tables table
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number text NOT NULL,
  qr_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can manage their tables"
  ON tables
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = tables.restaurant_id
    AND restaurants.owner_id = auth.uid()
  ));

CREATE POLICY "Public can view tables"
  ON tables
  FOR SELECT
  TO public
  USING (true);

-- Menu Categories table
CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can manage their menu categories"
  ON menu_categories
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = menu_categories.restaurant_id
    AND restaurants.owner_id = auth.uid()
  ));

CREATE POLICY "Public can view menu categories"
  ON menu_categories
  FOR SELECT
  TO public
  USING (true);

-- Menu Items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can manage their menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM restaurants
    JOIN menu_categories ON menu_categories.restaurant_id = restaurants.id
    WHERE menu_categories.id = menu_items.category_id
    AND restaurants.owner_id = auth.uid()
  ));

CREATE POLICY "Public can view menu items"
  ON menu_items
  FOR SELECT
  TO public
  USING (true);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id uuid REFERENCES tables(id),
  status text NOT NULL DEFAULT 'pending',
  total_amount decimal(10,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payconiq_payment_id text,
  customer_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can manage their orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = orders.restaurant_id
    AND restaurants.owner_id = auth.uid()
  ));

CREATE POLICY "Public can create and view their orders"
  ON orders
  FOR ALL
  TO public
  USING (true);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id),
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can view their order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM restaurants
    JOIN orders ON orders.restaurant_id = restaurants.id
    WHERE orders.id = order_items.order_id
    AND restaurants.owner_id = auth.uid()
  ));

CREATE POLICY "Public can create and view their order items"
  ON order_items
  FOR ALL
  TO public
  USING (true);