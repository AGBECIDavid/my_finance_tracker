// Dashboard service - aggregations for stats and charts
import prisma from '../config/database.js';

// Build a date filter from query params
const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return Object.keys(filter).length > 0 ? filter : undefined;
};

// Total income, total expense, and cashflow (income - expense)
export const getSummary = async (userId, { startDate, endDate } = {}) => {
  const dateFilter = buildDateFilter(startDate, endDate);
  const where = { userId };
  if (dateFilter) where.date = dateFilter;

  // Use Prisma aggregation to sum amounts grouped by type
  const results = await prisma.transaction.groupBy({
    by: ['type'],
    where,
    _sum: { amount: true },
    _count: { id: true },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let transactionCount = 0;

  results.forEach((r) => {
    transactionCount += r._count.id;
    if (r.type === 'INCOME') totalIncome = r._sum.amount || 0;
    if (r.type === 'EXPENSE') totalExpense = r._sum.amount || 0;
  });

  return {
    totalIncome,
    totalExpense,
    cashflow: totalIncome - totalExpense,
    transactionCount,
  };
};

// Expenses grouped by category - for the pie chart
export const getExpensesByCategory = async (userId, { startDate, endDate } = {}) => {
  const dateFilter = buildDateFilter(startDate, endDate);
  const where = { userId, type: 'EXPENSE' };
  if (dateFilter) where.date = dateFilter;

  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where,
    _sum: { amount: true },
  });

  // Get full category info (name, color) for each group
  const categoryIds = grouped.map((g) => g.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });

  return grouped
    .map((g) => {
      const cat = categories.find((c) => c.id === g.categoryId);
      return {
        categoryId: g.categoryId,
        name: cat?.name || 'Unknown',
        color: cat?.color || '#6366f1',
        icon: cat?.icon || '💰',
        total: g._sum.amount || 0,
      };
    })
    .sort((a, b) => b.total - a.total);
};

// Monthly income vs expense for the last N months - for the bar chart
export const getMonthlyData = async (userId, months = 6) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    select: { amount: true, type: true, date: true },
  });

  // Build a map: "YYYY-MM" -> { income, expense }
  const monthMap = {};

  // Initialize all months so empty months still show up on the chart
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = {
      month: key,
      label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      income: 0,
      expense: 0,
    };
  }

  transactions.forEach((tx) => {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) return;
    if (tx.type === 'INCOME') monthMap[key].income += tx.amount;
    else monthMap[key].expense += tx.amount;
  });

  return Object.values(monthMap);
};
