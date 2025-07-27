const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CourseModel = require('../models/Course');
const UserModel = require('../models/User');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const videosDir = path.join(uploadsDir, 'videos');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

[uploadsDir, videosDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, videosDir);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, thumbnailsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed'));
      }
    } else if (file.fieldname === 'thumbnail') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    } else {
      cb(null, true);
    }
  }
});

// Admin login (separate from regular auth)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    const user = UserModel.getByEmail(email.toLowerCase().trim());
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid admin credentials' 
      });
    }

    const isValidPassword = await UserModel.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid admin credentials' 
      });
    }

    const { password: _, ...adminResponse } = user;

    res.json({
      success: true,
      admin: adminResponse
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Admin login failed' 
    });
  }
});

// Get all courses (admin view)
router.get('/courses', (req, res) => {
  try {
    const courses = CourseModel.getAll();
    res.json({
      success: true,
      courses
    });
  } catch (error) {
    console.error('Fetch courses error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch courses' 
    });
  }
});

// Create new course
router.post('/courses', upload.single('thumbnail'), (req, res) => {
  try {
    const { title, description, category, level, price, duration } = req.body;
    
    // Validation
    const errors = {};
    
    if (!title || title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    }
    
    if (!description || description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }
    
    if (!['school', 'college', 'employee'].includes(category)) {
      errors.category = 'Invalid category';
    }
    
    if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
      errors.level = 'Invalid level';
    }
    
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      errors.price = 'Price must be a valid number';
    }
    
    if (isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
      errors.duration = 'Duration must be a positive number';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        errors 
      });
    }
    
    const courseData = {
      title: title.trim(),
      description: description.trim(),
      category,
      level,
      price: parseFloat(price) || 0,
      duration: parseInt(duration) || 0,
      thumbnail: req.file ? `/uploads/thumbnails/${req.file.filename}` : null
    };

    const course = CourseModel.create(courseData);

    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create course' 
    });
  }
});

// Update course
router.put('/courses/:id', upload.single('thumbnail'), (req, res) => {
  try {
    const { title, description, category, level, price, duration, isActive } = req.body;
    
    // Validation
    const errors = {};
    
    if (title && title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    }
    
    if (description && description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }
    
    if (category && !['school', 'college', 'employee'].includes(category)) {
      errors.category = 'Invalid category';
    }
    
    if (level && !['beginner', 'intermediate', 'advanced'].includes(level)) {
      errors.level = 'Invalid level';
    }
    
    if (price && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      errors.price = 'Price must be a valid number';
    }
    
    if (duration && (isNaN(parseInt(duration)) || parseInt(duration) <= 0)) {
      errors.duration = 'Duration must be a positive number';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        errors 
      });
    }
    
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (category) updateData.category = category;
    if (level) updateData.level = level;
    if (price !== undefined) updateData.price = parseFloat(price) || 0;
    if (duration !== undefined) updateData.duration = parseInt(duration) || 0;
    if (isActive !== undefined) updateData.isActive = isActive === 'true';

    if (req.file) {
      updateData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }

    const course = CourseModel.update(req.params.id, updateData);
    
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        error: 'Course not found' 
      });
    }

    res.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update course' 
    });
  }
});

// Delete course
router.delete('/courses/:id', (req, res) => {
  try {
    const course = CourseModel.delete(req.params.id);
    
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        error: 'Course not found' 
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete course' 
    });
  }
});

// Add video to course
router.post('/courses/:courseId/videos', upload.single('video'), (req, res) => {
  try {
    const { title, description, duration } = req.body;
    
    // Validation
    const errors = {};
    
    if (!title || title.trim().length < 3) {
      errors.title = 'Video title must be at least 3 characters long';
    }
    
    if (!description || description.trim().length < 10) {
      errors.description = 'Video description must be at least 10 characters long';
    }
    
    if (isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
      errors.duration = 'Duration must be a positive number';
    }
    
    if (!req.file) {
      errors.video = 'Video file is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        errors 
      });
    }

    const videoData = {
      title: title.trim(),
      description: description.trim(),
      videoUrl: `/uploads/videos/${req.file.filename}`,
      duration: parseInt(duration) || 0
    };

    const video = CourseModel.addVideo(req.params.courseId, videoData);
    
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        error: 'Course not found' 
      });
    }

    res.status(201).json({
      success: true,
      video
    });
  } catch (error) {
    console.error('Add video error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add video' 
    });
  }
});

// Update video
router.put('/courses/:courseId/videos/:videoId', (req, res) => {
  try {
    const { title, description, duration } = req.body;
    
    // Validation
    const errors = {};
    
    if (title && title.trim().length < 3) {
      errors.title = 'Video title must be at least 3 characters long';
    }
    
    if (description && description.trim().length < 10) {
      errors.description = 'Video description must be at least 10 characters long';
    }
    
    if (duration && (isNaN(parseInt(duration)) || parseInt(duration) <= 0)) {
      errors.duration = 'Duration must be a positive number';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        errors 
      });
    }
    
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (duration !== undefined) updateData.duration = parseInt(duration) || 0;

    const video = CourseModel.updateVideo(req.params.courseId, req.params.videoId, updateData);
    
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video not found' 
      });
    }

    res.json({
      success: true,
      video
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update video' 
    });
  }
});

// Delete video
router.delete('/courses/:courseId/videos/:videoId', (req, res) => {
  try {
    const video = CourseModel.deleteVideo(req.params.courseId, req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video not found' 
      });
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete video' 
    });
  }
});

// Get dashboard stats
router.get('/stats', (req, res) => {
  try {
    const courses = CourseModel.getAll();
    const users = UserModel.getAll();

    const stats = {
      totalCourses: courses.length,
      activeCourses: courses.filter(c => c.isActive).length,
      totalUsers: users.filter(u => u.role !== 'admin').length,
      schoolStudents: users.filter(u => u.role === 'school-student').length,
      collegeStudents: users.filter(u => u.role === 'college-student').length,
      employees: users.filter(u => u.role === 'employee').length,
      totalVideos: courses.reduce((total, course) => total + course.videos.length, 0)
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch stats' 
    });
  }
});

module.exports = router;