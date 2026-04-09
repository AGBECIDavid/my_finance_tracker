import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/summary', dashboardController.getSummary);
router.get('/expenses-by-category', dashboardController.getExpensesByCategory);
router.get('/monthly', dashboardController.getMonthly);

export default router;
