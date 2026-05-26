const mongoose = require('mongoose');
const ServiceItem = require('./models/ServiceItem');
const connectDB = require('./config/db');
require('dotenv').config();

connectDB().then(async () => {
  await ServiceItem.deleteMany({});
  await ServiceItem.insertMany([
    {
      category: 'Arjee',
      title: 'Vyaktigat Arjee',
      price: 249,
      priceText: '₹249',
      description: 'A dedicated Arjee, Reserved just for you.'
    },
    {
      category: 'Arjee',
      title: 'Dainik Arjee',
      price: 99,
      priceText: '₹99/month',
      description: 'Your Daily Arjee, with roses, ittar & mor pankh, offered to Khatu Shyam ji.'
    },
    {
      category: 'Arjee',
      title: 'Swayam Arjee',
      price: 299,
      priceText: '₹299',
      description: 'Your Arjee Basket, ready to offer when you arrive at Baba’s Darbar'
    }
  ]);
  console.log('Seeded database!');
  process.exit();
});
