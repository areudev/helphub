import { useGeolocation } from '#app/hooks/use-geolocation.tsx'
import { useIsClient } from '#app/utils/misc.js'
import { lazy, Suspense } from 'react'
import { ClientOnly } from 'remix-utils/client-only'

const LazyMap = lazy(() => import('#app/components/map.tsx'))

export default function MapRoute() {
	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<h1 className="text-h3">Map</h1>

			{/* <ClientOnly fallback={<p>Loading map...</p>}>
				{() => (
					<Suspense fallback={<div>Loading map...</div>}>
						<LazyMap />
					</Suspense>
				)}
			</ClientOnly> */}
			<Geolocation />
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
			<div className="h-[400px]">
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
