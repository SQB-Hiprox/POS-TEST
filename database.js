const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

const SEED = {
  sequences: { products: 12, orders: 0, order_items: 0 },
  products: [
    { id: 1,  name: 'Espresso',       price: 3.50, icon: '☕', category: 'Coffee', stock: 50 },
    { id: 2,  name: 'Latte',          price: 4.50, icon: '🥛', category: 'Coffee', stock: 50 },
    { id: 3,  name: 'Cappuccino',     price: 4.25, icon: '☕', category: 'Coffee', stock: 50 },
    { id: 4,  name: 'Green Tea',      price: 3.00, icon: '🍵', category: 'Tea',    stock: 30 },
    { id: 5,  name: 'Chai Latte',     price: 4.00, icon: '🫖', category: 'Tea',    stock: 30 },
    { id: 6,  name: 'Croissant',      price: 3.25, icon: '🥐', category: 'Food',   stock: 15 },
    { id: 7,  name: 'Muffin',         price: 2.75, icon: '🧁', category: 'Food',   stock: 20 },
    { id: 8,  name: 'Sandwich',       price: 6.50, icon: '🥪', category: 'Food',   stock: 10 },
    { id: 9,  name: 'Orange Juice',   price: 3.75, icon: '🍊', category: 'Drinks', stock: 25 },
    { id: 10, name: 'Sparkling Water',price: 2.00, icon: '💧', category: 'Drinks', stock: 40 },
    { id: 11, name: 'Smoothie',       price: 5.50, icon: '🥤', category: 'Drinks', stock: 20 },
    { id: 12, name: 'Brownie',        price: 2.50, icon: '🍫', category: 'Food',   stock: 18 },
  ],
  orders: [],
  order_items: [],
};

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(SEED, null, 2));
}

function read() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function nextId(data, table) {
  data.sequences[table] = (data.sequences[table] || 0) + 1;
  return data.sequences[table];
}

module.exports = { read, write, nextId };
