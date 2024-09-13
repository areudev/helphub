import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { dummyPositions, patrasCenter } from '#app/utils/locations.ts'

const baseIcon = L.icon({
	iconUrl: '/img/user.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
})

export default function Map() {
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
			{dummyPositions.map((position, index) => {
				return (
					<Marker
						key={index}
						position={[position.latitude, position.longitude]}
						icon={baseIcon}
					/>
				)
			})}
		</MapContainer>
	)
}
