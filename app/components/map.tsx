import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { patrasCenter } from '#app/utils/locations.ts'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Marker as LeafletMarker } from 'leaflet'
import { Button } from './ui/button'

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

export default function Map({
	positions,
}: {
	positions: {
		latitude: number | null
		longitude: number | null
		username: string
		type: string
		name: string
	}[]
}) {
	return (
		<MapContainer
			className="h-full w-full"
			center={[patrasCenter.latitude, patrasCenter.longitude]}
			zoom={12}
			// style={{ height: '400px' }}
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
			{/* Marker for Base */}

			<BaseMarker />
		</MapContainer>
	)
}
const warehousePosition: [number, number] = [
	38.24200983952633, 21.736916818180042,
]

function BaseMarker() {
	const [draggable, setDraggable] = useState(false)
	const [position, setPosition] = useState(warehousePosition)
	const markerRef = useRef<LeafletMarker | null>(null)
	const eventHandlers = useMemo(
		() => ({
			dragend() {
				const marker = markerRef.current
				if (marker != null) {
					const newPos = marker.getLatLng()
					console.log(newPos)
					setPosition([newPos.lat, newPos.lng])
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
			position={position}
			icon={warehouseIcon}
			ref={markerRef}
		>
			<Popup minWidth={90}>
				<Button onClick={toggleDraggable}>
					{draggable
						? 'Base is draggable'
						: 'Click here to make marker draggable'}
				</Button>
			</Popup>
		</Marker>
	)
}

// const warehousePosition = [38.24200983952633, 21.736916818180042] as const
// function DraggableMarker() {
// 	const [position, setPosition] = useState<[number, number]>(warehousePosition)
// 	const map = useMap()

// 	useEffect(() => {
// 		map.on('click', (e) => {
// 			setPosition([e.latlng.lat, e.latlng.lng])
// 		})
// 	}, [map])

// 	return (
// 		<Marker
// 			draggable={true}
// 			position={position}
// 			eventHandlers={{
// 				dragend: (e) => {
// 					const marker = e.target
// 					const position = marker.getLatLng()
// 					setPosition([position.lat, position.lng])
// 				},
// 			}}
// 		>
// 			<Popup>Drag me to set the base location!</Popup>
// 		</Marker>
// 	)
// }
