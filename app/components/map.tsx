import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { dummyPositions, patrasCenter } from '#app/utils/locations.ts'

const vehicleIcon = L.icon({
	iconUrl: '/img/rocket.svg',
	iconSize: [32, 32],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})

const offerIcon = L.icon({
	iconUrl: '/img/mark-aid.svg',
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
						/>
					)
				})}
		</MapContainer>
	)
}
