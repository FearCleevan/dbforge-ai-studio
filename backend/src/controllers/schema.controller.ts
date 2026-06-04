import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { generateSchema, validateSchema } from '../services/ai.service'

const GenerateSchemaSchema = z.object({
  prompt:           z.string().min(10, 'Prompt must be at least 10 characters').max(2000),
  target:           z.string().min(1),
  namingConvention: z.object({
    tableCase:  z.string().optional(),
    columnCase: z.string().optional(),
    prefix:     z.string().optional(),
    suffix:     z.string().optional(),
  }).optional(),
})

const ValidateSchemaSchema = z.object({
  schema: z.unknown(),
  target: z.string().min(1),
})

export async function generate(req: AuthRequest, res: Response): Promise<void> {
  const parsed = GenerateSchemaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const raw = await generateSchema(parsed.data)

  let schema: unknown
  try {
    schema = JSON.parse(raw)
  } catch {
    res.status(502).json({ error: 'AI Error', message: 'Failed to parse AI response as JSON', raw })
    return
  }

  res.json({ schema })
}

export async function validate(req: AuthRequest, res: Response): Promise<void> {
  const parsed = ValidateSchemaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const raw = await validateSchema(parsed.data.schema, parsed.data.target as string)

  let result: unknown
  try {
    result = JSON.parse(raw)
  } catch {
    res.status(502).json({ error: 'AI Error', message: 'Failed to parse AI response as JSON', raw })
    return
  }

  res.json({ result })
}
