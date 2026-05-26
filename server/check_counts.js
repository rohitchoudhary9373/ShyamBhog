const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (let coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`${coll.name}: ${count}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDB();
