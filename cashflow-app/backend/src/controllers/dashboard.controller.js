import * as dashboardService from '../services/dashboard.service.js';

export const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary(req.user.id, req.query);
    res.json(summary);
  } catch (e) { next(e); }
};

export const getExpensesByCategory = async (req, res, next) => {
  try {
    const data = await dashboardService.getExpensesByCategory(req.user.id, req.query);
    res.json(data);
  } catch (e) { next(e); }
};

export const getMonthly = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const data = await dashboardService.getMonthlyData(req.user.id, months);
    res.json(data);
  } catch (e) { next(e); }
};
