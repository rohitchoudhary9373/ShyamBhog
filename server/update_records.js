const mongoose = require('mongoose');
const Feedback = require('./models/Feedback');
const Gallery = require('./models/Gallery');
const ServiceItem = require('./models/ServiceItem');
const FAQ = require('./models/FAQ');
const Setting = require('./models/Setting');
const User = require('./models/User');

const update = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/shyam');
    console.log('Connected to DB');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('Admin not found!');
      process.exit(1);
    }
    const adminId = admin._id;
    console.log('Target Admin ID:', adminId);

    const result1 = await Feedback.updateMany({}, { $set: { adminId } });
    console.log(`Updated ${result1.modifiedCount} Feedbacks`);

    const result2 = await Gallery.updateMany({}, { $set: { adminId } });
    console.log(`Updated ${result2.modifiedCount} Gallery items`);

    const result3 = await ServiceItem.updateMany({}, { $set: { adminId } });
    console.log(`Updated ${result3.modifiedCount} ServiceItems`);

    const result4 = await FAQ.updateMany({}, { $set: { adminId } });
    console.log(`Updated ${result4.modifiedCount} FAQs`);

    const result5 = await Setting.updateMany({}, { $set: { adminId } });
    console.log(`Updated ${result5.modifiedCount} Settings`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

update();
