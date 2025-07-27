const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.fullName = data.fullName;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role; // 'school-student', 'college-student', 'employee', 'admin'
    this.schoolType = data.schoolType; // 'government', 'private' - only for school students
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
  }
}

// Mock database
let users = [
  new User({
    id: '1',
    fullName: 'John Doe',
    email: 'john@student.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    role: 'school-student',
    schoolType: 'government'
  }),
  new User({
    id: '2',
    fullName: 'Jane Smith',
    email: 'jane@college.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    role: 'college-student'
  }),
  new User({
    id: 'admin',
    fullName: 'Admin User',
    email: 'admin@youngwealth.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
    role: 'admin'
  })
];

const UserModel = {
  getAll: () => users.filter(user => user.isActive),
  
  getById: (id) => users.find(user => user.id === id && user.isActive),
  
  getByEmail: (email) => users.find(user => user.email === email && user.isActive),
  
  create: async (userData) => {
    // Check if user already exists
    const existingUser = users.find(user => user.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = new User({
      ...userData,
      password: hashedPassword
    });
    
    users.push(user);
    return user;
  },
  
  update: (id, updateData) => {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updateData, updatedAt: new Date() };
      return users[index];
    }
    return null;
  },
  
  delete: (id) => {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      users[index].isActive = false;
      users[index].updatedAt = new Date();
      return users[index];
    }
    return null;
  },
  
  validatePassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
};

module.exports = UserModel;