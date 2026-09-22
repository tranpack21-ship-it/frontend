import { z } from 'zod';

export const cashConceptFormSchema = z.object({
  nombre: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .trim(),
  tipo: z.enum(['ingreso', 'egreso', 'ambos']),
  orden: z.coerce.number().int().min(0).max(9999).optional().default(0),
  estado: z.enum(['activo', 'inactivo']).optional().default('activo'),
});

export const cashConceptEditSchema = cashConceptFormSchema;
