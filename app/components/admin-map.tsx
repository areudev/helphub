import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { formatDistanceToNow } from 'date-fns'
import L, { type Marker as LeafletMarker } from 'leaflet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'
import { type loader } from '#app/routes/admin+/_manage+/maps.tsx'
import { patrasCenter } from '#app/utils/locations.ts'
import { Button } from './ui/button'

export default function AdminMap() {
	const { vehicles, offers, requests, base } = useLoaderData<typeof loader>()

	const offersWithTask = offers.filter(
		(offer) => offer.task !== null && offer.task.status !== 'completed',
	)
	const requestsWithTask = requests.filter(
		(request) => request.task !== null && request.task.status !== 'completed',
	)

	const offersWithNoTask = offers.filter((offer) => offer.task === null)
	const requestsWithNoTask = requests.filter((request) => request.task === null)

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
			<MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
				{vehicles.map((vehicle) => (
					<VehicleMarker
						key={vehicle.id}
						position={[vehicle.user.latitude!, vehicle.user.longitude!]}
						userId={vehicle.user.id}
						vehicleName={vehicle.name}
						username={vehicle.user.username}
						tasks={vehicle.user.tasks}
					/>
				))}
				{offersWithTask.map((offertask) => (
					<Marker
						key={offertask.id}
						position={[offertask.user.latitude!, offertask.user.longitude!]}
						icon={taskIcon}
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
				{requestsWithTask.map((requesttask) => (
					<Marker
						key={requesttask.id}
						position={[requesttask.user.latitude!, requesttask.user.longitude!]}
						icon={taskIcon}
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
						</Popup>
					</Marker>
				))}
				<BaseMarker position={[base.latitude, base.longitude]} />
			</MarkerClusterGroup>
		</MapContainer>
	)
}
function VehicleMarker({
	position,
	userId,
	vehicleName,
	username,
	tasks,
}: {
	position: [number, number]
	userId: string
	vehicleName: string
	username: string
	tasks: {
		status: string
		requestId: string | null
		offerId: string | null
		request: { item: { name: string } } | null
		offer: { item: { name: string } } | null
	}[]
}) {
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
			position={position as [number, number]}
			icon={vehicleIcon}
			ref={markerRef}
		>
			<Popup minWidth={90}>
				<p>{vehicleName}</p>
				<p>{username}</p>
				<div>
					{tasks.map((task) => {
						if (task.requestId && task.request) {
							return (
								<p key={task.requestId}>
									Request for {task.request.item.name} {task.status}
								</p>
							)
						}
						if (task.offerId && task.offer) {
							return (
								<p key={task.offerId}>
									Offer for {task.offer.item.name} {task.status}
								</p>
							)
						}
						return null
					})}
				</div>
				<div className="flex flex-col gap-1">
					<Button size="sm" asChild>
						<Link className="!text-white" to={`/users/${username}/tasks`}>
							View Rescuer Tasks
						</Link>
					</Button>
					<Button size="sm" onClick={toggleDraggable}>
						{draggable ? 'Vehicle is draggable' : 'Click to make it draggable'}
					</Button>
				</div>
			</Popup>
		</Marker>
	)
}

function BaseMarker({ position }: { position: [number, number] }) {
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
							table: 'base',
							latitude: newPos.lat.toString(),
							longitude: newPos.lng.toString(),
						},
						{ method: 'post' },
					)
				}
			},
		}),
		[fetcher],
	)
	const toggleDraggable = useCallback(() => {
		setDraggable((d) => !d)
	}, [])

	return (
		<Marker
			draggable={draggable}
			eventHandlers={eventHandlers}
			position={position as [number, number]}
			icon={warehouseIcon}
			ref={markerRef}
		>
			<Popup minWidth={90}>
				<Button onClick={toggleDraggable}>
					{draggable
						? 'Base is draggable'
						: 'Click here to make base draggable'}
				</Button>
			</Popup>
		</Marker>
	)
}

export const vehicleIcon = L.icon({
	iconUrl: '/img/track.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})
export const warehouseIcon = L.icon({
	iconUrl: '/img/locationw.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})

export const offerIcon = L.icon({
	iconUrl: '/img/mark-plus.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})

export const taskIcon = L.icon({
	iconUrl: '/img/task.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})

export const requestIcon = L.icon({
	iconUrl: '/img/mark-x.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})
