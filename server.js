const express = require('express');
const cors = require('cors');
const path = require('path');
const { read, write, nextId } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const TAX_RATE = 0.10;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Products ──────────────────────────────────────────────

app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let list = read().products;
  if (category && category !== 'All') list = list.filter(p => p.category === category);
  if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  res.json(list.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
});

app.get('/api/products/categories', (req, res) => {
  const cats = [...new Set(read().products.map(p => p.category))].sort();
  res.json(['All', ...cats]);
});

app.post('/api/products', (req, res) => {
  const { name, price, icon, category, stock } = req.body;
  if (!name || price == null || !category)
    return res.status(400).json({ error: 'name, price, and category are required' });

  const db = read();
  const product = { id: nextId(db, 'products'), name, price, icon: icon || '📦', category, stock: stock ?? 0 };
  db.products.push(product);
  write(db);
  res.status(201).json(product);
});

app.put('/api/products/:id', (req, res) => {
  const db = read();
  const idx = db.products.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  db.products[idx] = { ...db.products[idx], ...req.body, id: db.products[idx].id };
  write(db);
  res.json(db.products[idx]);
});

app.delete('/api/products/:id', (req, res) => {
  const db = read();
  const idx = db.products.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  db.products.splice(idx, 1);
  write(db);
  res.json({ success: true });
});

// ── Orders ────────────────────────────────────────────────

app.post('/api/orders', (req, res) => {
  const { items, cash } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'No items provided' });
  if (cash == null) return res.status(400).json({ error: 'Cash amount required' });

  const db = read();

  // Validate stock
  for (const { product_id, qty } of items) {
    const p = db.products.find(x => x.id === product_id);
    if (!p) return res.status(404).json({ error: `Product ${product_id} not found` });
    if (p.stock < qty) return res.status(409).json({ error: `Insufficient stock for "${p.name}"` });
  }

  // Calculate totals
  let subtotal = 0;
  const enriched = items.map(({ product_id, qty }) => {
    const p = db.products.find(x => x.id === product_id);
    subtotal += p.price * qty;
    return { product_id, qty, name: p.name, price: p.price };
  });

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const change = cash - total;

  if (change < 0) return res.status(400).json({ error: 'Insufficient cash tendered' });

  // Persist order
  const orderId = nextId(db, 'orders');
  const order = {
    id: orderId,
    subtotal,
    tax,
    total,
    cash,
    change,
    created_at: new Date().toISOString(),
  };
  db.orders.push(order);

  for (const item of enriched) {
    db.order_items.push({ id: nextId(db, 'order_items'), order_id: orderId, ...item });
    const p = db.products.find(x => x.id === item.product_id);
    p.stock -= item.qty;
  }

  write(db);
  res.status(201).json(order);
});

app.get('/api/orders', (req, res) => {
  const orders = read().orders.slice().reverse().slice(0, 100);
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const db = read();
  const order = db.orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ ...order, items: db.order_items.filter(i => i.order_id === order.id) });
});

// ── Start ─────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`POS server running at http://localhost:${PORT}`);
});
