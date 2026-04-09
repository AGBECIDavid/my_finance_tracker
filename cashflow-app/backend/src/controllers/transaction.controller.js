import * as transactionService from '../services/transaction.service.js';

export const getAll = async (req, res, next) => {
  try {
    // Query filters come from req.query: /api/transactions?startDate=...&search=...
    const transactions = await transactionService.getAll(req.user.id, req.query);
    res.json(transactions);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const tx = await transactionService.create(req.user.id, req.body);
    res.status(201).json(tx);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const tx = await transactionService.update(
      req.user.id,
      parseInt(req.params.id),
      req.body
    );
    res.json(tx);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await transactionService.remove(req.user.id, parseInt(req.params.id));
    res.json({ success: true });
  } catch (e) { next(e); }
};
