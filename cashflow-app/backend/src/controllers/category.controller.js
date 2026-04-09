import * as categoryService from '../services/category.service.js';

export const getAll = async (req, res, next) => {
  try {
    const categories = await categoryService.getAll(req.user.id);
    res.json(categories);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const category = await categoryService.create(req.user.id, req.body);
    res.status(201).json(category);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const category = await categoryService.update(
      req.user.id,
      parseInt(req.params.id),
      req.body
    );
    res.json(category);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await categoryService.remove(req.user.id, parseInt(req.params.id));
    res.json({ success: true });
  } catch (e) { next(e); }
};
