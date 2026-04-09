// Auth service - handles registration, login, and JWT generation
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

// Default categories created automatically for new users
const DEFAULT_CATEGORIES = [
  { name: 'Salaire', type: 'INCOME', color: '#10b981', icon: '💼' },
  { name: 'Business', type: 'INCOME', color: '#3b82f6', icon: '📈' },
  { name: 'Trading', type: 'INCOME', color: '#8b5cf6', icon: '💹' },
  { name: 'Nourriture', type: 'EXPENSE', color: '#f59e0b', icon: '🍔' },
  { name: 'Transport', type: 'EXPENSE', color: '#ef4444', icon: '🚗' },
  { name: 'Logement', type: 'EXPENSE', color: '#ec4899', icon: '🏠' },
  { name: 'Abonnements', type: 'EXPENSE', color: '#6366f1', icon: '📱' },
  { name: 'Loisirs', type: 'EXPENSE', color: '#14b8a6', icon: '🎮' },
];

// Generate a signed JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register a new user
export const registerUser = async ({ email, password, name }) => {
  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  // Hash the password (10 salt rounds is a good balance)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the user AND default categories in one transaction
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      categories: {
        create: DEFAULT_CATEGORIES,
      },
    },
  });

  const token = generateToken(user);

  // NEVER return the password hash
  return {
    user: { id: user.id, email: user.email, name: user.name },
    token,
  };
};

// Login an existing user
export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    token,
  };
};

// Get current user info
export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};
