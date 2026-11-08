import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { env } from '../config/env';
import { validate } from '../middleware/validate';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const googleSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'Conflict', message: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: email.toLowerCase(), passwordHash, name });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Login failed' });
  }
});

// POST /api/auth/google
router.post('/google', validate(googleSchema), async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    // Decode Google JWT token (simplified - in production, verify with Google's public keys)
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());

    const email = payload.email;
    const name = payload.name || email.split('@')[0];

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        email: email.toLowerCase(),
        name,
        passwordHash: '', // No password for OAuth users
        googleId: payload.sub,
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Google login failed' });
  }
});

export default router;
