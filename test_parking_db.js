const mongoose = require('mongoose');
const Parking = require('./server/models/Parking');
require('dotenv').config({ path: './server/.env' });

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const parkings = await Parking.find();
    console.log(JSON.stringify(parkings, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
