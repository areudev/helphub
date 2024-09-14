import { useFetcher, useLoaderData } from '@remix-run/react'
import L, { type Marker as LeafletMarker } from 'leaflet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { type loader } from '#app/routes/rescuer+/map.tsx'
import { patrasCenter } from '#app/utils/locations.ts'
import { offerIcon, requestIcon, taskIcon, vehicleIcon } from './admin-map.tsx'
import { Button } from './ui/button'

export default function RescuerMap() {
	const { vehicles, userId, offers, requests } = useLoaderData<typeof loader>()
	const currentRescuerVehicle = vehicles.find(
		(vehicle) => vehicle.user.id === userId,
	)
	if (!currentRescuerVehicle) {
		return <div>You are not assigned to any vehicle</div>
	}

	const offersWithTask = offers.filter((offer) => offer.task !== null)
	const requestsWithTask = requests.filter((request) => request.task !== null)

	const offersWithNoTask = offers.filter((offer) => offer.task === null)
	const requestsWithNoTask = requests.filter((request) => request.task === null)

	const currentRescuerTasksOffers = offersWithTask.filter(
		(offer) => offer.task?.rescuerId === userId,
	)
	const otherRescuerTasksOffers = offersWithTask.filter(
		(offer) => offer.task?.rescuerId !== userId,
	)

	const currentRescuerTasksRequests = requestsWithTask.filter(
		(request) => request.task?.rescuerId === userId,
	)
	const otherRescuerTasksRequests = requestsWithTask.filter(
		(request) => request.task?.rescuerId !== userId,
	)

	const otherVehicles = vehicles.filter((vehicle) => vehicle.user.id !== userId)
	return (
		<MapContainer
			className="h-full w-full"
			center={[patrasCenter.latitude, patrasCenter.longitude]}
			zoom={12}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<Marker position={[patrasCenter.latitude, patrasCenter.longitude]} />
			<CurrentVehicleMarker />
			{otherVehicles.map((vehicle) => (
				<Marker
					key={vehicle.user.id}
					position={[vehicle.user.latitude!, vehicle.user.longitude!]}
					icon={vehicleIcon}
					opacity={0.6}
				>
					<Popup>
						<p>{vehicle.user.username}</p>
						<p>{vehicle.currentLoad}</p>
						<p>{vehicle.name}</p>
					</Popup>
				</Marker>
			))}
			{currentRescuerTasksOffers.map((task) => (
				<Marker
					key={task.id}
					position={[task.user.latitude!, task.user.longitude!]}
					icon={taskIcon}
				/>
			))}
			{otherRescuerTasksOffers.map((task) => (
				<Marker
					key={task.id}
					position={[task.user.latitude!, task.user.longitude!]}
					icon={taskIcon}
					opacity={0.6}
				/>
			))}
			{currentRescuerTasksRequests.map((task) => (
				<Marker
					key={task.id}
					position={[task.user.latitude!, task.user.longitude!]}
					icon={taskIcon}
				/>
			))}
			{otherRescuerTasksRequests.map((task) => (
				<Marker
					key={task.id}
					position={[task.user.latitude!, task.user.longitude!]}
					icon={taskIcon}
					opacity={0.6}
				/>
			))}
			{offersWithNoTask.map((offer) => (
				<Marker
					key={offer.id}
					position={[offer.user.latitude!, offer.user.longitude!]}
					icon={offerIcon}
				/>
			))}
			{requestsWithNoTask.map((request) => (
				<Marker
					key={request.id}
					position={[request.user.latitude!, request.user.longitude!]}
					icon={requestIcon}
				/>
			))}
		</MapContainer>
	)
}
function CurrentVehicleMarker() {
	const { userId, vehicles } = useLoaderData<typeof loader>()
	const currentRescuerVehicle = vehicles.find(
		(vehicle) => vehicle.user.id === userId,
	)
	const fetcher = useFetcher()
	const [draggable, setDraggable] = useState(false)

	const markerRef = useRef<LeafletMarker | null>(null)
	const eventHandlers = useMemo(
		() => ({
			dragend() {
				const marker = markerRef.current
				if (marker != null) {
					const newPos = marker.getLatLng()
					console.log(newPos)
					fetcher.submit(
						{
							table: 'vehicle',
							userId,
							latitude: newPos.lat.toString(),
							longitude: newPos.lng.toString(),
						},
						{ method: 'post' },
					)
				}
			},
		}),
		[fetcher, userId],
	)
	const toggleDraggable = useCallback(() => {
		setDraggable((d) => !d)
	}, [])

	return (
		<Marker
			draggable={draggable}
			eventHandlers={eventHandlers}
			position={[
				currentRescuerVehicle?.user.latitude!,
				currentRescuerVehicle?.user.longitude!,
			]}
			icon={vehicleIcon}
			ref={markerRef}
		>
			<Popup minWidth={90}>
				<p>{currentRescuerVehicle?.name}</p>
				<p>{currentRescuerVehicle?.user.username}</p>
				{/* {currentRescuerVehicle?.currentLoad.map((task) => (
					<p key={task.requestId || task.offerId}>
						{task.requestId ? 'Request' : 'Offer'} {task.status}
					</p>
				))} */}
				<Button onClick={toggleDraggable}>
					{draggable
						? 'Vehicle is draggable'
						: 'Click here to make vehicle draggable'}
				</Button>
			</Popup>
		</Marker>
	)
}
