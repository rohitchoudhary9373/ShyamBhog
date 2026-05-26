const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const checkServices = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const services = await db.collection('serviceitems').find({}).toArray();
    console.log('Services with their tenantIds:');
    services.forEach(s => {
      console.log(`- ${s.name}: tenantId=${s.tenantId || s.adminId || 'NONE'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkServices();
