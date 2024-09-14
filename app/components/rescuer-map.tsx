import { useFetcher } from '@remix-run/react'
import L, { type Marker as LeafletMarker } from 'leaflet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { patrasCenter } from '#app/utils/locations.ts'
import { Button } from './ui/button'
import { LazyMapProps } from '#app/routes/rescuer+/map.js'
import { offerIcon, requestIcon, vehicleIcon } from './admin-map'

export default function RescuerMap({
	currentRescuerVehicle,
	otherVehicles,
	currentRescuerTasksOffers,
	otherRescuerTasksOffers,
	currentRescuerTasksRequests,
	otherRescuerTasksRequests,
}: LazyMapProps) {
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
			<Marker
				position={[
					currentRescuerVehicle.user.latitude!,
					currentRescuerVehicle.user.longitude!,
				]}
				icon={vehicleIcon}
			/>
			{otherVehicles.map((vehicle) => (
				<Marker
					key={vehicle.user.id}
					position={[vehicle.user.latitude!, vehicle.user.longitude!]}
					icon={vehicleIcon}
					opacity={0.6}
				/>
			))}
			{currentRescuerTasksOffers.map((task) => (
				<Marker
					key={task.id}
					position={[task.user.latitude!, task.user.longitude!]}
					icon={offerIcon}
				/>
			))}
			{otherRescuerTasksOffers.map((task) => (
				<Marker
					key={task.id}
					position={[task.user.latitude!, task.user.longitude!]}
					icon={offerIcon}
					opacity={0.6}
				/>
			))}
			{currentRescuerTasksRequests.map((task) => (
				<Marker
					key={task.id}
					position={[task.user.latitude!, task.user.longitude!]}
					icon={requestIcon}
				/>
			))}
			{otherRescuerTasksRequests.map((task) => (
				<Marker
					key={task.id}
					position={[task.user.latitude!, task.user.longitude!]}
					icon={requestIcon}
					opacity={0.6}
				/>
			))}
		</MapContainer>
	)
}
