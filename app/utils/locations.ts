interface Coordinate {
	latitude: number
	longitude: number
}

export const patrasCenter: Coordinate = {
	latitude: 38.246639,
	longitude: 21.734573,
}

export const patras100kmBoundary = [
	{ lat: 39.14596, lon: 21.73457 },
	{ lat: 39.13213, lon: 22.13086 },
	{ lat: 38.24608, lon: 22.87963 },
	{ lat: 37.56545, lon: 22.46375 },
	{ lat: 37.34732, lon: 21.73457 },
	{ lat: 37.56545, lon: 21.00539 },
	{ lat: 38.24608, lon: 20.58951 },
	{ lat: 39.13213, lon: 21.33826 },
]

export const dummyPositions = [
	{ latitude: 38.246639, longitude: 21.734573 },
	{ latitude: 38.27973314738955, longitude: 21.76889308222365 },
	{ latitude: 38.30827797135121, longitude: 21.807143999339814 },
	{ latitude: 38.20870136926265, longitude: 21.767370300348965 },
	{ latitude: 38.18577825500854, longitude: 21.700383421056245 },
	{ latitude: 38.1708438469576, longitude: 21.456267194043285 },
	{ latitude: 38.14066837382343, longitude: 21.555111748474655 },
	{ latitude: 38.10500834226745, longitude: 21.469817848568383 },
	{ latitude: 38.053167419998864, longitude: 21.381434744395275 },
	{ latitude: 38.04201844526803, longitude: 21.44969778773879 },
	{ latitude: 38.10708738646101, longitude: 21.784023610957185 },
	{ latitude: 38.19156326787096, longitude: 21.804957707743004 },
	{ latitude: 38.16364804395653, longitude: 21.728546449944645 },
	{ latitude: 38.04385242421566, longitude: 21.695519592963727 },
	{ latitude: 38.12047969949003, longitude: 21.931236961346837 },
	{ latitude: 38.0572184796295, longitude: 21.75111428266655 },
	{ latitude: 38.07589562278406, longitude: 21.798747841082463 },
]

export function generateRandomPositions(
	center: Coordinate,
	radiusKm: number,
	count: number,
): Coordinate[] {
	const positions: Coordinate[] = []
	const earthRadiusKm = 6371

	for (let i = 0; i < count; i++) {
		// Generate random angle and distance
		const angle = Math.random() * 2 * Math.PI
		const distance = Math.random() * radiusKm

		// Convert distance to radians
		const distanceRadians = distance / earthRadiusKm

		// Calculate new position
		const lat1 = (center.latitude * Math.PI) / 180
		const lon1 = (center.longitude * Math.PI) / 180

		const lat2 = Math.asin(
			Math.sin(lat1) * Math.cos(distanceRadians) +
				Math.cos(lat1) * Math.sin(distanceRadians) * Math.cos(angle),
		)

		const lon2 =
			lon1 +
			Math.atan2(
				Math.sin(angle) * Math.sin(distanceRadians) * Math.cos(lat1),
				Math.cos(distanceRadians) - Math.sin(lat1) * Math.sin(lat2),
			)

		positions.push({
			latitude: (lat2 * 180) / Math.PI,
			longitude: (lon2 * 180) / Math.PI,
		})
	}

	return positions
}

// const randomPositions = generateRandomPositions(patrasCenter, 10, 5)
