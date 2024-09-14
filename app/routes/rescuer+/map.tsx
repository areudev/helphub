import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { json, LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { lazy, Suspense } from 'react'
import { ClientOnly } from 'remix-utils/client-only'

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
				},
			},
		},
	})

	const offers = await prisma.offer.findMany({
		select: {
			id: true,
			item: { select: { name: true } },
			user: { select: { username: true, latitude: true, longitude: true } },
			task: { select: { id: true, rescuerId: true } },
			quantity: true,
			createdAt: true,
		},
	})

	const requests = await prisma.request.findMany({
		select: {
			id: true,
			item: { select: { name: true } },
			user: { select: { username: true, latitude: true, longitude: true } },
			task: { select: { id: true, rescuerId: true } },
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
