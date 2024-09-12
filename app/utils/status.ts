import { z } from 'zod'

export const OfferStatus = z.enum(['pending', 'approved', 'received'])
export const RequestStatus = z.enum(['pending', 'approved', 'received'])
export const TaskStatus = z.enum(['pending', 'in_progress', 'completed'])
export const VehicleStatus = z.enum(['active', 'maintenance', 'inactive'])
