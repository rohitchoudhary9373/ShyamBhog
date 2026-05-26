const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId("6a01ee4b200d140be9238eb2") });
    console.log('Admin User:', JSON.stringify(user, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkAdmin();
