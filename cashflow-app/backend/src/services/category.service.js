// Category service - CRUD operations for categories
// IMPORTANT: every query filters by userId to enforce multi-user isolation
import prisma from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

export const getAll = async (userId) => {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
};

export const create = async (userId, { name, type, color, icon }) => {
  if (!name || !type) {
    throw new AppError('Name and type are required', 400);
  }
  if (!['INCOME', 'EXPENSE'].includes(type)) {
    throw new AppError('Type must be INCOME or EXPENSE', 400);
  }

  return prisma.category.create({
    data: {
      name,
      type,
      color: color || '#6366f1',
      icon: icon || '💰',
      userId,
    },
  });
};

export const update = async (userId, id, data) => {
  // First verify the category belongs to this user
  const category = await prisma.category.findFirst({
    where: { id, userId },
  });
  if (!category) throw new AppError('Category not found', 404);

  return prisma.category.update({
    where: { id },
    data: {
      name: data.name ?? category.name,
      type: data.type ?? category.type,
      color: data.color ?? category.color,
      icon: data.icon ?? category.icon,
    },
  });
};

export const remove = async (userId, id) => {
  const category = await prisma.category.findFirst({
    where: { id, userId },
  });
  if (!category) throw new AppError('Category not found', 404);

  // Check if category has transactions
  const txCount = await prisma.transaction.count({
    where: { categoryId: id },
  });
  if (txCount > 0) {
    throw new AppError(
      `Cannot delete: ${txCount} transaction(s) use this category`,
      400
    );
  }

  await prisma.category.delete({ where: { id } });
  return { success: true };
};
