const jwt = require('jsonwebtoken');
const HotelUser = require('../models/HotelUser');
const HotelOwner = require('../models/HotelOwner');

const hotelCustomerProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.hotelUser = await HotelUser.findById(decoded.id);
      if (!req.hotelUser) return res.status(401).json({ message: 'Not authorized, customer not found' });
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const hotelVendorProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.hotelOwner = await HotelOwner.findById(decoded.id);
      if (!req.hotelOwner) return res.status(401).json({ message: 'Not authorized, owner not found' });
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { hotelCustomerProtect, hotelVendorProtect };
