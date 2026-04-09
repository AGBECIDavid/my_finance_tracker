// Transaction service - CRUD + filtering for transactions
import prisma from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

// Get all transactions with optional filters
// Filters: startDate, endDate, type, categoryId, search
export const getAll = async (userId, filters = {}) => {
  const { startDate, endDate, type, categoryId, search } = filters;

  const where = { userId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (type) where.type = type;
  if (categoryId) where.categoryId = parseInt(categoryId);
  if (search) {
    where.description = { contains: search };
  }

  return prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: 'desc' },
  });
};

export const create = async (userId, { amount, type, description, date, categoryId }) => {
  // Validation
  if (!amount || !type || !description || !categoryId) {
    throw new AppError('Amount, type, description and categoryId are required', 400);
  }
  if (amount <= 0) {
    throw new AppError('Amount must be positive', 400);
  }
  if (!['INCOME', 'EXPENSE'].includes(type)) {
    throw new AppError('Type must be INCOME or EXPENSE', 400);
  }

  // Verify the category belongs to this user
  const category = await prisma.category.findFirst({
    where: { id: parseInt(categoryId), userId },
  });
  if (!category) throw new AppError('Category not found', 404);

  return prisma.transaction.create({
    data: {
      amount: parseFloat(amount),
      type,
      description,
      date: date ? new Date(date) : new Date(),
      categoryId: parseInt(categoryId),
      userId,
    },
    include: { category: true },
  });
};

export const update = async (userId, id, data) => {
  // Verify ownership
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new AppError('Transaction not found', 404);

  // If a new categoryId is provided, verify it belongs to the user
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: parseInt(data.categoryId), userId },
    });
    if (!category) throw new AppError('Category not found', 404);
  }

  const updateData = {};
  if (data.amount !== undefined) updateData.amount = parseFloat(data.amount);
  if (data.type) updateData.type = data.type;
  if (data.description) updateData.description = data.description;
  if (data.date) updateData.date = new Date(data.date);
  if (data.categoryId) updateData.categoryId = parseInt(data.categoryId);

  return prisma.transaction.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });
};

export const remove = async (userId, id) => {
  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!tx) throw new AppError('Transaction not found', 404);

  await prisma.transaction.delete({ where: { id } });
  return { success: true };
};
