import { useFetcher } from '@remix-run/react'
import L, { type Marker as LeafletMarker } from 'leaflet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { patrasCenter } from '#app/utils/locations.ts'
import { Button } from './ui/button'

export default function Map({
	positions,
	base,
}: {
	base: {
		latitude: number
		longitude: number
	}
	positions: {
		latitude: number | null
		longitude: number | null
		username: string
		type: string
		name: string
	}[]
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
			{positions
				.filter((position) => position.latitude && position.longitude)
				.map((position, index) => {
					return (
						<Marker
							key={index}
							position={[position.latitude!, position.longitude!]}
							icon={
								position.type === 'vehicle'
									? vehicleIcon
									: position.type === 'offer'
										? offerIcon
										: requestIcon
							}
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
							latitude: newPos.lat.toString(),
							longitude: newPos.lng.toString(),
						},
						{ method: 'post' },
					)
				}
			},
		}),
		[],
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
