import { z } from 'zod';
import { TIPOS_DOCUMENTO } from '../constants/permissions';

const tipos = TIPOS_DOCUMENTO.map((t) => t.value);

export const clientFormSchema = z.object({
  tipo_documento: z.enum(tipos),
  numero_documento: z.string().max(20).optional().or(z.literal('')),
  nombre: z.string().min(2).max(150),
  email: z.union([z.literal(''), z.string().email('Email inválido')]).optional(),
  telefono: z.string().max(30).optional().or(z.literal('')),
  direccion: z.string().max(255).optional().or(z.literal('')),
  estado: z.enum(['activo', 'inactivo']),
  limite_credito: z
    .union([z.literal(''), z.coerce.number().min(0)])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
});

export const movementFormSchema = z
  .object({
    producto_id: z.coerce.number().positive('Seleccione un producto'),
    tipo: z.enum(['entrada', 'salida', 'ajuste']),
    cantidad: z.coerce.number().positive('Cantidad mayor a 0'),
    motivo_select: z.string().min(1, 'Seleccione un motivo'),
    motivo_detalle: z.string().max(200).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.motivo_select === '__otro__') {
      const detalle = (data.motivo_detalle || '').trim();
      if (detalle.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Escriba el motivo (mínimo 3 caracteres)',
          path: ['motivo_detalle'],
        });
      }
    }
  });
