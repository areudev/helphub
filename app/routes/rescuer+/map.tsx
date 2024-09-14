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
	const { vehicles, userId, offers, requests } = useLoaderData<typeof loader>()
	// separate current rescuer vehicle from the others
	const currentRescuerVehicle = vehicles.find(
		(vehicle) => vehicle.user.id === userId,
	)
	if (!currentRescuerVehicle) {
		return <div>You are not assigned to any vehicle</div>
	}

	// separate current rescuer tasks offers from the others
	const currentRescuerTasksOffers = offers.filter(
		(offer) => offer.task?.rescuerId === userId,
	)

	const otherRescuerTasksOffers = offers.filter(
		(offer) => offer.task?.rescuerId !== userId,
	)

	const currentRescuerTasksRequests = requests.filter(
		(request) => request.task?.rescuerId === userId,
	)

	const otherRescuerTasksRequests = requests.filter(
		(request) => request.task?.rescuerId !== userId,
	)

	const otherVehicles = vehicles.filter((vehicle) => vehicle.user.id !== userId)
	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<h1 className="text-h3">Rescuer Map</h1>

			<div className="light h-[600px]">
				<ClientOnly fallback={<p>Loading map...</p>}>
					{() => (
						<Suspense fallback={<div>Loading map...</div>}>
							<LazyMap
								currentRescuerVehicle={currentRescuerVehicle}
								otherVehicles={otherVehicles}
								currentRescuerTasksOffers={currentRescuerTasksOffers}
								otherRescuerTasksOffers={otherRescuerTasksOffers}
								currentRescuerTasksRequests={currentRescuerTasksRequests}
								otherRescuerTasksRequests={otherRescuerTasksRequests}
							/>
						</Suspense>
					)}
				</ClientOnly>
			</div>
		</div>
	)
}

type RescuerVehicle = {
	name: string
	currentLoad: number
	user: {
		id: string
		latitude: number | null
		longitude: number | null
		username: string
	}
}
type RescuerTaskOffer = {
	id: string
	user: {
		latitude: number | null
		longitude: number | null
		username: string
	}
	createdAt: string
	quantity: number
	item: {
		name: string
	}
	task: {
		id: string
		rescuerId: string
	} | null
}

type RescuerTaskRequest = {
	id: string
	user: {
		latitude: number | null
		longitude: number | null
		username: string
	}
	createdAt: string
	quantity: number
	item: {
		name: string
	}
	task: {
		id: string
		rescuerId: string
	} | null
}

export type LazyMapProps = {
	currentRescuerVehicle: RescuerVehicle
	otherVehicles: RescuerVehicle[]
	currentRescuerTasksOffers: RescuerTaskOffer[]
	otherRescuerTasksOffers: RescuerTaskOffer[]
	currentRescuerTasksRequests: RescuerTaskRequest[]
	otherRescuerTasksRequests: RescuerTaskRequest[]
}
