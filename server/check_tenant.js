const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const checkTenantData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const services = await db.collection('serviceitems').find({}).toArray();
    console.log('Sample Services:', JSON.stringify(services.slice(0, 2), null, 2));
    
    const settings = await db.collection('settings').find({}).toArray();
    console.log('Settings:', JSON.stringify(settings, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkTenantData();
