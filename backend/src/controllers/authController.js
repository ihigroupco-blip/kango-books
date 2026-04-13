const authService = require('../services/authService');

async function signup(req, res, next) {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getProfile(req.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, me };
