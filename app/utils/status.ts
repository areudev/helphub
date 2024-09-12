import { z } from 'zod'

export const TaskStatus = z.enum(['pending', 'in_progress', 'completed'])
export const VehicleStatus = z.enum(['active', 'maintenance', 'inactive'])

export function getOfferOrRequestStatus(taskStatus?: string) {
	if (!taskStatus) return 'pending'

	switch (taskStatus) {
		case 'pending':
		case 'in_progress':
			return 'approved'
		case 'completed':
			return 'received'
		case 'cancelled':
			return 'cancelled'
		default:
			return 'pending'
	}
}
