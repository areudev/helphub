import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import L, { type Marker as LeafletMarker } from 'leaflet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { patrasCenter } from '#app/utils/locations.ts'
import { Button } from './ui/button'
import { type loader } from '#app/routes/admin+/_manage+/maps.tsx'

export default function AdminMap() {
	const { vehicles, offers, requests, base } = useLoaderData<typeof loader>()
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
			<BaseMarker position={[base.latitude, base.longitude]} />
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
