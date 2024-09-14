import * as React from 'react'

type GeolocationState = {
	loading: boolean
	accuracy: number | null
	altitude: number | null
	altitudeAccuracy: number | null
	heading: number | null
	latitude: number | null
	longitude: number | null
	speed: number | null
	timestamp: number | null
	error: { message: string } | null
}

type GeolocationOptions = {
	enableHighAccuracy?: boolean
	timeout?: number
	maximumAge?: number
}

export function useGeolocation(options: GeolocationOptions = {}) {
	const [state, setState] = React.useState<GeolocationState>({
		loading: true,
		accuracy: null,
		altitude: null,
		altitudeAccuracy: null,
		heading: null,
		latitude: null,
		longitude: null,
		speed: null,
		timestamp: null,
		error: null,
	})

	const optionsRef = React.useRef(options)

	React.useEffect(() => {
		const onEvent = ({ coords, timestamp }: GeolocationPosition) => {
			setState({
				loading: false,
				accuracy: coords.accuracy,
				altitude: coords.altitude,
				altitudeAccuracy: coords.altitudeAccuracy,
				heading: coords.heading,
				latitude: coords.latitude,
				longitude: coords.longitude,
				speed: coords.speed,
				timestamp: timestamp,
				error: null,
			})
		}

		const onError = (error: GeolocationPositionError) => {
			setState((s) => ({
				...s,
				loading: false,
				error: error,
			}))
		}
		if (!navigator.geolocation) {
			setState((prevState) => ({
				...prevState,
				loading: false,
				error: { message: 'Geolocation is not supported' },
			}))
			return
		}

		navigator.geolocation.getCurrentPosition(
			onEvent,
			onError,
			optionsRef.current,
		)

		const watchId = navigator.geolocation.watchPosition(
			onEvent,
			onError,
			optionsRef.current,
		)

		return () => {
			navigator.geolocation.clearWatch(watchId)
		}
	}, [])

	return state
}
