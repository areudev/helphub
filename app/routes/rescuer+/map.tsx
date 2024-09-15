import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { lazy, Suspense } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithRole(request, 'rescuer')

	const formData = await request.formData()
	const table = formData.get('table')

	if (typeof table !== 'string') {
		return json({ error: 'Invalid table' }, { status: 400 })
	}

	if (table === 'vehicle') {
		const latitude = formData.get('latitude')
		const longitude = formData.get('longitude')

		if (typeof latitude !== 'string' || typeof longitude !== 'string') {
			return json({ error: 'Invalid latitude or longitude' }, { status: 400 })
		}

		await prisma.user.update({
			where: { id: userId },
			data: {
				latitude: parseFloat(latitude),
				longitude: parseFloat(longitude),
			},
		})
		return json({ success: true })
	}

	return json({ success: false, error: 'Invalid table' }, { status: 400 })
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserWithRole(request, 'rescuer')

	const vehicles = await prisma.vehicle.findMany({
		select: {
			currentLoad: true,
			name: true,
			user: {
				select: {
					id: true,
					username: true,
					latitude: true,
					longitude: true,
					tasks: {
						where: { status: 'in_progress' },
						select: {
							id: true,
							status: true,
							offer: {
								select: {
									user: { select: { latitude: true, longitude: true } },
								},
							},
							request: {
								select: {
									user: { select: { latitude: true, longitude: true } },
								},
							},
						},
					},
				},
			},
		},
	})

	const offers = await prisma.offer.findMany({
		select: {
			id: true,
			item: { select: { name: true } },
			user: {
				select: { username: true, latitude: true, longitude: true, name: true },
			},
			task: {
				select: {
					createdAt: true,
					updatedAt: true,
					id: true,
					rescuerId: true,
					status: true,
					rescuer: {
						select: { name: true },
					},
				},
			},
			quantity: true,
			createdAt: true,
		},
	})

	const requests = await prisma.request.findMany({
		select: {
			id: true,
			item: { select: { name: true } },
			user: {
				select: { username: true, latitude: true, longitude: true, name: true },
			},
			task: {
				select: {
					updatedAt: true,
					id: true,
					rescuerId: true,
					status: true,
					rescuer: {
						select: { name: true },
					},
				},
			},
			quantity: true,
			createdAt: true,
		},
	})

	return json({ vehicles, userId, offers, requests })
}

const LazyMap = lazy(() => import('#app/components/rescuer-map.tsx'))
export default function RescuerMap() {
	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<h1 className="text-h3">Rescuer Map</h1>

			<div className="light h-[600px]">
				<ClientOnly fallback={<p>Loading map...</p>}>
					{() => (
						<Suspense fallback={<div>Loading map...</div>}>
							<LazyMap />
						</Suspense>
					)}
				</ClientOnly>
			</div>
		</div>
	)
}
