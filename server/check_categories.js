const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const checkCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const categories = await db.collection('serviceitems').distinct('category');
    console.log('Available Categories:', categories);
    
    const counts = {};
    for (let cat of categories) {
      counts[cat] = await db.collection('serviceitems').countDocuments({ category: cat });
    }
    console.log('Counts:', counts);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkCategories();
