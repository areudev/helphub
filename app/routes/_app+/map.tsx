import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { lazy, Suspense } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { useGeolocation } from '#app/hooks/use-geolocation.tsx'
import { prisma } from '#app/utils/db.server.ts'
// import { useIsClient } from '#app/utils/misc.tsx'

const LazyMap = lazy(() => import('#app/components/map.tsx'))
export async function loader({ request }: LoaderFunctionArgs) {
	// const users = await prisma.user.findMany({
	// 	select: {
	// 		id: true,
	// 		longitude: true,
	// 		latitude: true,
	// 		roles: true,
	// 		username: true,
	// 	},
	// })

	const vehicles = await prisma.vehicle.findMany({
		select: {
			id: true,
			user: {
				select: {
					username: true,
					latitude: true,
					longitude: true,
					tasks: {
						select: {
							status: true,
							requestId: true,
							offerId: true,
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
			user: { select: { username: true, latitude: true, longitude: true } },
			item: { select: { name: true } },
			quantity: true,
		},
	})

	const requests = await prisma.request.findMany({
		select: {
			id: true,
			user: { select: { username: true, latitude: true, longitude: true } },
			item: { select: { name: true } },
			quantity: true,
		},
	})
	return json({ vehicles, offers, requests })
}
export default function MapRoute() {
	const { vehicles, offers, requests } = useLoaderData<typeof loader>()
	const allPositions = [
		...vehicles.map((vehicle) => ({
			latitude: vehicle.user.latitude,
			longitude: vehicle.user.longitude,
			username: vehicle.user.username,
			type: 'vehicle',
			name: vehicle.name,
		})),
		...offers.map((offer) => ({
			latitude: offer.user.latitude,
			longitude: offer.user.longitude,
			username: offer.user.username,
			type: 'offer',
			name: offer.item.name,
		})),
		...requests.map((request) => ({
			latitude: request.user.latitude,
			longitude: request.user.longitude,
			username: request.user.username,
			type: 'request',
			name: request.item.name,
		})),
	]
	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<h1 className="text-h3">Map</h1>

			{/* <Geolocation /> */}
			<div className="h-[600px]">
				<ClientOnly fallback={<p>Loading map...</p>}>
					{() => (
						<Suspense fallback={<div>Loading map...</div>}>
							<LazyMap positions={allPositions} />
						</Suspense>
					)}
				</ClientOnly>
			</div>
		</div>
	)
}

function Geolocation() {
	const {
		loading,
		latitude,
		longitude,
		error,
		accuracy,
		speed,
		altitude,
		altitudeAccuracy,
		heading,
		timestamp,
	} = useGeolocation()

	if (loading) return <p>Loading...</p>
	if (error) return <p>Error: {error.message}</p>

	return (
		<div>
			<div>
				<p>Latitude: {latitude}</p>
				<p>Longitude: {longitude}</p>
				<p>Accuracy: {accuracy}</p>
				<p>Speed: {speed}</p>
				<p>Altitude: {altitude}</p>
				<p>Altitude Accuracy: {altitudeAccuracy}</p>
				<p>Heading: {heading}</p>
				<p>Timestamp: {timestamp}</p>
			</div>
		</div>
	)
}

// const Map = lazy(() => import('#app/components/map.tsx'))

// export default function MapRoute() {
// 	// const isClient = useIsClient()

// 	// if (!isClient) return null

// 	return (
// 		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
// 			<h1 className="text-h3">Map</h1>
// 			<Suspense fallback={<div>Loading map...</div>}>
// 				<Map />
// 			</Suspense>
// 			<Geolocation />
// 		</div>
// 	)
// }
