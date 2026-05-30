const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const HotelUser = require('../models/HotelUser');
const HotelOwner = require('../models/HotelOwner');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

// @route POST /api/hotel-auth/customer/register
router.post('/customer/register', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const userExists = await HotelUser.findOne({ $or: [{ email }, { mobile }] });
    if (userExists) return res.status(400).json({ message: 'Hotel Customer already exists' });
    
    const user = await HotelUser.create({ name, email, mobile, password });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/hotel-auth/customer/login
router.post('/customer/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const user = await HotelUser.findOne({ mobile }).select('+password');
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/hotel-auth/vendor/register
router.post('/vendor/register', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const ownerExists = await HotelOwner.findOne({ $or: [{ email }, { mobile }] });
    if (ownerExists) return res.status(400).json({ message: 'Hotel Owner already exists' });
    
    const owner = await HotelOwner.create({ name, email, mobile, password });
    res.status(201).json({
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      mobile: owner.mobile,
      role: owner.role,
      status: owner.status,
      token: generateToken(owner._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/hotel-auth/vendor/login
router.post('/vendor/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const owner = await HotelOwner.findOne({ mobile }).select('+password');
    if (owner && (await bcrypt.compare(password, owner.password))) {
      res.json({
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        mobile: owner.mobile,
        role: owner.role,
        status: owner.status,
        token: generateToken(owner._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
