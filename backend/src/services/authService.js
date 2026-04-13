const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function signup({ email, password, name, businessName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw { status: 409, message: 'Email already registered' };

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name, businessName },
    select: { id: true, email: true, name: true, businessName: true },
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { token, user };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { status: 401, message: 'Invalid credentials' };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw { status: 401, message: 'Invalid credentials' };

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, businessName: user.businessName },
  };
}

async function getProfile(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, businessName: true, createdAt: true },
  });
}

module.exports = { signup, login, getProfile };
