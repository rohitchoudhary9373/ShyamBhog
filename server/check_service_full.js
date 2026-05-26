const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const checkServiceSchema = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const service = await db.collection('serviceitems').findOne({});
    console.log('Full Service Document:', JSON.stringify(service, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkServiceSchema();
