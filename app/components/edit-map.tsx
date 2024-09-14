import L, { type Marker as LeafletMarker } from 'leaflet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { patrasCenter } from '#app/utils/locations.ts'
import { Button } from './ui/button.tsx'

export default function EditMap({
	initialPin,
	setPin,
}: {
	initialPin: { latitude: number; longitude: number }
	setPin: (position: { latitude: number; longitude: number }) => void
}) {
	return (
		<MapContainer
			center={[patrasCenter.latitude, patrasCenter.longitude]}
			zoom={10}
			className="h-full w-full"
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<UserPin
				setPin={setPin}
				position={[initialPin.latitude, initialPin.longitude]}
				saved={false}
			/>
		</MapContainer>
	)
}

function UserPin({
	position,
	saved,
	setPin,
}: {
	position: [number, number]
	saved: boolean
	setPin: (position: { latitude: number; longitude: number }) => void
}) {
	const [draggable, setDraggable] = useState(false)

	const markerRef = useRef<LeafletMarker | null>(null)
	const eventHandlers = useMemo(
		() => ({
			dragend() {
				const marker = markerRef.current
				if (marker != null) {
					const newPos = marker.getLatLng()
					setPin({ latitude: newPos.lat, longitude: newPos.lng })
				}
			},
		}),
		[setPin],
	)
	const toggleDraggable = useCallback(() => {
		setDraggable((d) => !d)
	}, [])

	return (
		<Marker
			draggable={draggable}
			eventHandlers={eventHandlers}
			position={position as [number, number]}
			icon={saved ? pinSavedIcon : pinUnsavedIcon}
			ref={markerRef}
		>
			<Popup minWidth={90}>
				<Button onClick={toggleDraggable}>
					{draggable ? 'You can drag me now' : 'Click to make me draggable'}
				</Button>
			</Popup>
		</Marker>
	)
}

const pinSavedIcon = L.icon({
	iconUrl: '/img/pin-saved.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})

const pinUnsavedIcon = L.icon({
	iconUrl: '/img/pin-unsaved.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})
