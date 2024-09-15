import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { formatDistanceToNow } from 'date-fns'
import { type Marker as LeafletMarker } from 'leaflet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'
import { type FilterState, type loader } from '#app/routes/rescuer+/map.tsx'
// import { patrasCenter } from '#app/utils/locations.ts'
import { AddOfferToTasksForm } from '#app/routes/rescuer+/offers.tsx'
import { AddRequestToTasksForm } from '#app/routes/rescuer+/requests.tsx'
import { offerIcon, requestIcon, taskIcon, vehicleIcon } from './admin-map.tsx'
import { Button } from './ui/button.tsx'

export default function RescuerMap({ filters }: { filters: FilterState }) {
	const { vehicles, userId, offers, requests, activeTasks } =
		useLoaderData<typeof loader>()
	const currentRescuerVehicle = vehicles.find(
		(vehicle) => vehicle.user.id === userId,
	)
	if (!currentRescuerVehicle) {
		return <div>You are not assigned to any vehicle</div>
	}

	const offersWithTask = offers.filter(
		(offer) => offer.task !== null && offer.task.status !== 'completed',
	)
	const requestsWithTask = requests.filter(
		(request) => request.task !== null && request.task.status !== 'completed',
	)

	const offersWithNoTask = filters.showOffers
		? offers.filter((offer) => offer.task === null)
		: []
	const requestsWithNoTask = filters.showRequests
		? requests.filter((request) => request.task === null)
		: []

	const currentRescuerTasksOffers = offersWithTask.filter(
		(offer) => offer.task?.rescuerId === userId,
	)
	const currentRescuerTasksRequests = requestsWithTask.filter(
		(request) => request.task?.rescuerId === userId,
	)
	const otherRescuerTasksOffers = filters.showOtherTasks
		? offersWithTask.filter((offer) => offer.task?.rescuerId !== userId)
		: []

	const otherRescuerTasksRequests = filters.showOtherTasks
		? requestsWithTask.filter((request) => request.task?.rescuerId !== userId)
		: []

	const otherVehicles = filters.showOtherVehicles
		? vehicles.filter((vehicle) => vehicle.user.id !== userId)
		: []

	const inProgressTasks = currentRescuerVehicle.user.tasks.filter(
		(task) => task.status === 'in_progress',
	)

	const taskLines = inProgressTasks
		.map((task) => {
			const taskLocation = task.offer?.user || task.request?.user
			if (taskLocation && taskLocation.latitude && taskLocation.longitude) {
				return [
					[
						currentRescuerVehicle.user.latitude!,
						currentRescuerVehicle.user.longitude!,
					],
					[taskLocation.latitude, taskLocation.longitude],
				] as [number, number][]
			}
			return null
		})
		.filter((line): line is [number, number][] => line !== null)

	return (
		<MapContainer
			className="h-full w-full"
			center={[
				currentRescuerVehicle.user.latitude!,
				currentRescuerVehicle.user.longitude!,
			]}
			zoom={12}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
				{/* <Marker position={[patrasCenter.latitude, patrasCenter.longitude]} /> */}
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
				{currentRescuerTasksRequests.map((requesttask) => (
					<Marker
						key={requesttask.id}
						position={[requesttask.user.latitude!, requesttask.user.longitude!]}
						icon={taskIcon}
					>
						<Popup>
							<p>
								Request created before{' '}
								{formatDistanceToNow(new Date(requesttask.createdAt))}
							</p>
							<p>
								{requesttask.quantity} {requesttask.item.name}
							</p>
							<p>
								Task Updated{' '}
								{formatDistanceToNow(
									new Date(requesttask.task?.updatedAt ?? ''),
								)}
							</p>
							<p>Status: {requesttask.task?.status}</p>
							<Button asChild>
								<Link
									className="!text-primary-foreground"
									to={`/users/${currentRescuerVehicle.user.username}/tasks/${requesttask.task?.id}`}
								>
									View or Edit
								</Link>
							</Button>
						</Popup>
					</Marker>
				))}
				{currentRescuerTasksOffers.map((offertask) => (
					<Marker
						key={offertask.id}
						position={[offertask.user.latitude!, offertask.user.longitude!]}
						icon={taskIcon}
					>
						<Popup>
							<p>
								Offer created before{' '}
								{formatDistanceToNow(new Date(offertask.createdAt))}
							</p>
							<p>
								{offertask.quantity} {offertask.item.name}
							</p>
							<p>
								Task Updated{' '}
								{formatDistanceToNow(new Date(offertask.task?.updatedAt ?? ''))}
							</p>
							<p>Status: {offertask.task?.status}</p>
							<Button asChild>
								<Link
									className="!text-primary-foreground"
									to={`/users/${currentRescuerVehicle.user.username}/tasks/${offertask.task?.id}`}
								>
									View or Edit
								</Link>
							</Button>
						</Popup>
					</Marker>
				))}
				{otherRescuerTasksOffers.map((offertask) => (
					<Marker
						key={offertask.id}
						position={[offertask.user.latitude!, offertask.user.longitude!]}
						icon={taskIcon}
						opacity={0.6}
					>
						<Popup>
							<p>Offer from {offertask.user.name}</p>
							<p>
								{offertask.quantity} {offertask.item.name}
							</p>
							<p>Task to {offertask.task?.rescuer.name}</p>
							<p>Task status: {offertask.task?.status}</p>
						</Popup>
					</Marker>
				))}

				{otherRescuerTasksRequests.map((requesttask) => (
					<Marker
						key={requesttask.id}
						position={[requesttask.user.latitude!, requesttask.user.longitude!]}
						icon={taskIcon}
						opacity={0.6}
					>
						<Popup>
							<p>Request from {requesttask.user.name}</p>
							<p>
								{requesttask.quantity} {requesttask.item.name}
							</p>
							<p>Task to {requesttask.task?.rescuer.name}</p>
							<p>Status: {requesttask.task?.status}</p>
						</Popup>
					</Marker>
				))}

				{offersWithNoTask.map((offer) => (
					<Marker
						key={offer.id}
						position={[offer.user.latitude!, offer.user.longitude!]}
						icon={offerIcon}
					>
						<Popup>
							<p>
								{offer.quantity} {offer.item.name}
							</p>
							<p>Offer from {offer.user.name}</p>
							<p>
								Created before {formatDistanceToNow(new Date(offer.createdAt))}
							</p>
							<AddOfferToTasksForm
								offerId={offer.id}
								activeTasks={activeTasks}
							/>
						</Popup>
					</Marker>
				))}
				{requestsWithNoTask.map((request) => (
					<Marker
						key={request.id}
						position={[request.user.latitude!, request.user.longitude!]}
						icon={requestIcon}
					>
						<Popup>
							<p>
								{request.quantity} {request.item.name}
							</p>
							<p>Request from {request.user.name}</p>
							<p>
								Created before{' '}
								{formatDistanceToNow(new Date(request.createdAt))}
							</p>
							<AddRequestToTasksForm
								requestId={request.id}
								activeTasks={activeTasks}
							/>
						</Popup>
					</Marker>
				))}
			</MarkerClusterGroup>
			{taskLines.map((positions, index) => (
				<Polyline key={index} positions={positions} color="red" />
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
				<Button onClick={toggleDraggable}>
					{draggable
						? 'Vehicle is draggable'
						: 'Click here to make vehicle draggable'}
				</Button>
			</Popup>
		</Marker>
	)
}
