import { invariantResponse } from '@epic-web/invariant'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
} from '@remix-run/node'
import { lazy, Suspense } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

const LazyMap = lazy(() => import('#app/components/admin-map.tsx'))

export async function action({ request }: ActionFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const formData = await request.formData()
	const table = formData.get('table')
	const latitude = formData.get('latitude')
	const longitude = formData.get('longitude')

	if (typeof latitude !== 'string' || typeof longitude !== 'string') {
		return json({ error: 'Invalid latitude or longitude' }, { status: 400 })
	}

	if (table === 'base') {
		const base = await prisma.base.findFirst({
			select: { id: true },
		})
		invariantResponse(base, 'Base not found')

		await prisma.base.update({
			where: { id: base.id },
			data: {
				latitude: parseFloat(latitude),
				longitude: parseFloat(longitude),
			},
		})
	}

	if (table === 'vehicle') {
		const userId = formData.get('userId')

		invariantResponse(userId, 'User not found')
		if (typeof userId !== 'string') {
			return json({ error: 'Invalid user id' }, { status: 400 })
		}
		await prisma.user.update({
			where: { id: userId },
			data: {
				latitude: parseFloat(latitude),
				longitude: parseFloat(longitude),
			},
		})
	}

	return json({ success: true })
}
export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')

	const base = await prisma.base.findFirst({
		select: {
			latitude: true,
			longitude: true,
		},
	})
	invariantResponse(base, 'no base found :(')

	const vehicles = await prisma.vehicle.findMany({
		select: {
			id: true,
			user: {
				select: {
					id: true,
					username: true,
					name: true,
					latitude: true,
					longitude: true,
					tasks: {
						select: {
							status: true,
							requestId: true,
							offerId: true,
							offer: {
								select: {
									item: { select: { name: true } },
								},
							},
							request: {
								select: {
									item: { select: { name: true } },
								},
							},
						},
					},
				},
			},

			name: true,
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

	return json({ vehicles, offers, requests, base })
}
export default function MapRoute() {
	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<h1 className="text-h3">Map</h1>

			<div className="light h-[600px]">
				<ClientOnly fallback={<p>Loading map...</p>}>
					{() => (
						<Suspense fallback={<div>Loading map...</div>}>
							{/* <LazyMap
								vehiclePositions={vehiclePositions}
								offerPositions={offerPositions}
								requestPositions={requestPositions}
								base={base}
							/> */}
							<LazyMap />
						</Suspense>
					)}
				</ClientOnly>
			</div>
		</div>
	)
}
