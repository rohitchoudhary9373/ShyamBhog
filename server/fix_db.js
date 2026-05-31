const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const fixDb = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shyam';
    await mongoose.connect(mongoUri);
    console.log('Connected to DB:', mongoUri);

    const User = require('./models/User');
    const newAdmin = await User.findOne({ role: 'admin' });

    if (!newAdmin) {
      console.error("No admin found!");
      process.exit(1);
    }

    const newAdminId = newAdmin._id;
    console.log("New Admin ID:", newAdminId);

    // Let's find an existing setting to get the OLD adminId
    const Setting = require('./models/Setting');
    const oldSetting = await Setting.findOne();

    if (oldSetting && oldSetting.adminId.toString() !== newAdminId.toString()) {
      const oldAdminId = oldSetting.adminId;
      console.log("Old Admin ID found:", oldAdminId);

      const collectionsToUpdate = [
        require('./models/Setting'),
        require('./models/ServiceItem'),
        require('./models/FAQ'),
        require('./models/Gallery'),
        require('./models/Content'),
        require('./models/Parking'),
        require('./models/CrowdStatus'),
        require('./models/Feedback'),
        require('./models/Transaction'),
        require('./models/ArjeeOrder'),
        require('./models/Refund')
      ];

      for (let Model of collectionsToUpdate) {
        if (Model && Model.modelName) {
           // Update documents where adminId exists and matches oldAdminId
           const result = await Model.updateMany(
             { adminId: oldAdminId },
             { $set: { adminId: newAdminId } }
           );
           console.log(`Updated ${result.modifiedCount} records in ${Model.modelName} collection.`);
        }
      }
      
      // Also update agent parentAdmin links
      const agentResult = await User.updateMany(
        { parentAdmin: oldAdminId },
        { $set: { parentAdmin: newAdminId } }
      );
      console.log(`Updated ${agentResult.modifiedCount} agent parentAdmin links in User collection.`);

    } else {
      console.log("No old adminId mismatch detected in Settings.");
    }

    process.exit(0);
  } catch (err) {
    console.error('Error fixing DB:', err);
    process.exit(1);
  }
};

fixDb();
