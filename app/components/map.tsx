import { useFetcher } from '@remix-run/react'
import L, { type Marker as LeafletMarker } from 'leaflet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { patrasCenter } from '#app/utils/locations.ts'
import { Button } from './ui/button'

type Position = {
	latitude: number | null
	longitude: number | null
	username: string
	type: 'vehicle' | 'offer' | 'request'
	name: string
}
// type VehiclePosition = Position & {
// 	userId: string
// 	tasks: { status: string; requestId: string | null; offerId: string | null }
// }
type VehiclePosition = Position & {
	userId: string
	tasks: { status: string; requestId: string | null; offerId: string | null }[]
}
export default function Map({
	vehiclePositions,
	offerPositions,
	requestPositions,
	base,
	userId,
}: {
	vehiclePositions: VehiclePosition[]
	offerPositions: Position[]
	requestPositions: Position[]
	base: {
		latitude: number
		longitude: number
	}
	userId: string | null
}) {
	let basePosition = [base.latitude, base.longitude] as [number, number]

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
			{vehiclePositions
				.filter((position) => position.latitude && position.longitude)
				.map((position) => {
					return (
						<VehicleMarker
							key={position.userId}
							position={[position.latitude!, position.longitude!]}
							userId={position.userId}
							vehicleName={position.name}
							username={position.username}
							tasks={position.tasks}
							loggedInUserId={userId}
						/>
					)
				})}

			{offerPositions
				.filter((position) => position.latitude && position.longitude)
				.map((position, index) => {
					return (
						<Marker
							key={`offer-${index}`}
							position={[position.latitude!, position.longitude!]}
							icon={offerIcon}
						>
							<Popup className="bg-background">
								<div>
									<p>{position.name}</p>
									<p>{position.username}</p>
									<p>{position.type}</p>
								</div>
							</Popup>
						</Marker>
					)
				})}

			{requestPositions
				.filter((position) => position.latitude && position.longitude)
				.map((position, index) => {
					return (
						<Marker
							key={`request-${index}`}
							position={[position.latitude!, position.longitude!]}
							icon={requestIcon}
						>
							<Popup className="bg-background">
								<div>
									<p>{position.name}</p>
									<p>{position.username}</p>
									<p>{position.type}</p>
								</div>
							</Popup>
						</Marker>
					)
				})}

			<BaseMarker position={basePosition} />
		</MapContainer>
	)
}
function VehicleMarker({
	position,
	userId,
	vehicleName,
	username,
	tasks,
	loggedInUserId,
}: {
	position: [number, number]
	userId: string
	vehicleName: string
	username: string
	tasks: { status: string; requestId: string | null; offerId: string | null }[]
	loggedInUserId: string | null
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
			opacity={loggedInUserId === userId ? 1 : 0.5}
		>
			<Popup minWidth={90}>
				<p>{vehicleName}</p>
				<p>{username}</p>
				{tasks.map((task) => (
					<p key={task.requestId || task.offerId}>
						{task.requestId ? 'Request' : 'Offer'} {task.status}
					</p>
				))}
				<Button onClick={toggleDraggable}>
					{draggable
						? 'Vehicle is draggable'
						: 'Click here to make vehicle draggable'}
				</Button>
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

const vehicleIcon = L.icon({
	iconUrl: '/img/mark-aid.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})
const warehouseIcon = L.icon({
	iconUrl: '/img/locationw.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})

const offerIcon = L.icon({
	iconUrl: '/img/mark-plus.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})

const requestIcon = L.icon({
	iconUrl: '/img/mark-x.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})
