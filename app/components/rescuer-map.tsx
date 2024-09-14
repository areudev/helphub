import { useFetcher, useLoaderData } from '@remix-run/react'
import L, { type Marker as LeafletMarker } from 'leaflet'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { patrasCenter } from '#app/utils/locations.ts'
import { Button } from './ui/button'
import { loader } from '#app/routes/rescuer+/map.tsx'
import { offerIcon, requestIcon, taskIcon, vehicleIcon } from './admin-map.tsx'

export default function RescuerMap() {
	const { vehicles, userId, offers, requests } = useLoaderData<typeof loader>()
	const currentRescuerVehicle = vehicles.find(
		(vehicle) => vehicle.user.id === userId,
	)
	if (!currentRescuerVehicle) {
		return <div>You are not assigned to any vehicle</div>
	}

	const offersWithTask = offers.filter((offer) => offer.task !== null)
	const requestsWithTask = requests.filter((request) => request.task !== null)

	const offersWithNoTask = offers.filter((offer) => offer.task === null)
	const requestsWithNoTask = requests.filter((request) => request.task === null)

	const currentRescuerTasksOffers = offersWithTask.filter(
		(offer) => offer.task?.rescuerId === userId,
	)
	const otherRescuerTasksOffers = offersWithTask.filter(
		(offer) => offer.task?.rescuerId !== userId,
	)

	const currentRescuerTasksRequests = requestsWithTask.filter(
		(request) => request.task?.rescuerId === userId,
	)
	const otherRescuerTasksRequests = requestsWithTask.filter(
		(request) => request.task?.rescuerId !== userId,
	)

	const otherVehicles = vehicles.filter((vehicle) => vehicle.user.id !== userId)
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
					icon={taskIcon}
				/>
			))}
			{otherRescuerTasksOffers.map((task) => (
				<Marker
					key={task.id}
					position={[task.user.latitude!, task.user.longitude!]}
					icon={taskIcon}
					opacity={0.6}
				/>
			))}
			{currentRescuerTasksRequests.map((task) => (
				<Marker
					key={task.id}
					position={[task.user.latitude!, task.user.longitude!]}
					icon={taskIcon}
				/>
			))}
			{otherRescuerTasksRequests.map((task) => (
				<Marker
					key={task.id}
					position={[task.user.latitude!, task.user.longitude!]}
					icon={taskIcon}
					opacity={0.6}
				/>
			))}
			{offersWithNoTask.map((offer) => (
				<Marker
					key={offer.id}
					position={[offer.user.latitude!, offer.user.longitude!]}
					icon={offerIcon}
				/>
			))}
			{requestsWithNoTask.map((request) => (
				<Marker
					key={request.id}
					position={[request.user.latitude!, request.user.longitude!]}
					icon={requestIcon}
				/>
			))}
		</MapContainer>
	)
}
