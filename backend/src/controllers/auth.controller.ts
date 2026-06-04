import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { User } from '../models/User'
import { env } from '../config/env'
import { AuthRequest } from '../middleware/auth'

function signToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions)
}

const RegisterSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name:     z.string().min(1, 'Name is required').max(80),
})

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const { email, password, name } = parsed.data

  const existing = await User.findOne({ email })
  if (existing) {
    res.status(409).json({ error: 'Conflict', message: 'Email already registered' })
    return
  }

  const user = await User.create({ email, password, name })
  const token = signToken(user._id.toString())

  res.status(201).json({
    token,
    user: { id: user._id, email: user.email, name: user.name },
  })
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const { email, password } = parsed.data
  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' })
    return
  }

  const token = signToken(user._id.toString())
  res.json({ token, user: { id: user._id, email: user.email, name: user.name } })
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.userId)
  if (!user) {
    res.status(404).json({ error: 'Not Found', message: 'User not found' })
    return
  }
  res.json({ id: user._id, email: user.email, name: user.name, createdAt: user.createdAt })
}
