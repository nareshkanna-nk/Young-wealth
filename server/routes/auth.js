const express = require('express');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'young-wealth-secret-key';

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRole = (role) => {
  const validRoles = ['school-student', 'college-student', 'employee', 'admin'];
  return validRoles.includes(role);
};

const validateSchoolType = (schoolType) => {
  const validTypes = ['government', 'private'];
  return validTypes.includes(schoolType);
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role, schoolType } = req.body;

    // Validation
    const errors = {};

    if (!fullName || fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters long';
    }

    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!validatePassword(password)) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!validateRole(role)) {
      errors.role = 'Please select a valid role';
    }

    if (role === 'school-student' && !validateSchoolType(schoolType)) {
      errors.schoolType = 'Please select a valid school type';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        errors 
      });
    }

    // Create user
    const user = await UserModel.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      schoolType: role === 'school-student' ? schoolType : undefined
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.status(201).json({
      success: true,
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message === 'User with this email already exists') {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Registration failed. Please try again.' 
      });
    }
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    const errors = {};

    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    if (!validateRole(role)) {
      errors.role = 'Please select a valid role';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        errors 
      });
    }

    // Find user by email
    const user = UserModel.getByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Check role match
    if (user.role !== role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid role for this account' 
      });
    }

    // Validate password
    const isValidPassword = await UserModel.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed. Please try again.' 
    });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = UserModel.getById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
});

module.exports = router;