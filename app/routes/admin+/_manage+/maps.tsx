import { invariantResponse } from '@epic-web/invariant'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
} from '@remix-run/node'
import { lazy, Suspense, useReducer } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { Toggle } from '#app/components/ui/toggle.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

const LazyMap = lazy(() => import('#app/components/admin-map.tsx'))

export async function action({ request }: ActionFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const formData = await request.formData()
	const table = formData.get('table')
	const latitude = formData.get('latitude')
	const longitude = formData.get('longitude')

	if (typeof latitude !== 'string' || typeof longitude !== 'string') {
		return json({ error: 'Invalid latitude or longitude' }, { status: 400 })
	}

	if (table === 'base') {
		const base = await prisma.base.findFirst({
			select: { id: true },
		})
		invariantResponse(base, 'Base not found')

		await prisma.base.update({
			where: { id: base.id },
			data: {
				latitude: parseFloat(latitude),
				longitude: parseFloat(longitude),
			},
		})
	}

	if (table === 'vehicle') {
		const userId = formData.get('userId')

		invariantResponse(userId, 'User not found')
		if (typeof userId !== 'string') {
			return json({ error: 'Invalid user id' }, { status: 400 })
		}
		await prisma.user.update({
			where: { id: userId },
			data: {
				latitude: parseFloat(latitude),
				longitude: parseFloat(longitude),
			},
		})
	}

	return json({ success: true })
}
export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')

	const base = await prisma.base.findFirst({
		select: {
			latitude: true,
			longitude: true,
		},
	})
	invariantResponse(base, 'no base found :(')

	const vehicles = await prisma.vehicle.findMany({
		select: {
			id: true,
			user: {
				select: {
					id: true,
					username: true,
					name: true,
					latitude: true,
					longitude: true,
					tasks: {
						select: {
							status: true,
							requestId: true,
							offerId: true,
							offer: {
								select: {
									item: { select: { name: true } },
								},
							},
							request: {
								select: {
									item: { select: { name: true } },
								},
							},
						},
					},
				},
			},

			name: true,
		},
	})
	const offers = await prisma.offer.findMany({
		select: {
			id: true,
			item: { select: { name: true } },
			user: {
				select: { username: true, latitude: true, longitude: true, name: true },
			},
			task: {
				select: {
					createdAt: true,
					updatedAt: true,
					id: true,
					rescuerId: true,
					status: true,
					rescuer: {
						select: { name: true },
					},
				},
			},
			quantity: true,
			createdAt: true,
		},
	})

	const requests = await prisma.request.findMany({
		select: {
			id: true,
			item: { select: { name: true } },
			user: {
				select: { username: true, latitude: true, longitude: true, name: true },
			},
			task: {
				select: {
					updatedAt: true,
					id: true,
					rescuerId: true,
					status: true,
					rescuer: {
						select: { name: true },
					},
				},
			},
			quantity: true,
			createdAt: true,
		},
	})

	return json({ vehicles, offers, requests, base })
}

export type FilterState = {
	showOffers: boolean
	showRequests: boolean
	showOffersTasks: boolean
	showRequestsTasks: boolean
	showVehicles: boolean
	showBase: boolean
}

type FilterAction =
	| { type: 'TOGGLE_OFFERS' }
	| { type: 'TOGGLE_REQUESTS' }
	| { type: 'TOGGLE_OFFERS_TASKS' }
	| { type: 'TOGGLE_REQUESTS_TASKS' }
	| { type: 'TOGGLE_VEHICLES' }
	| { type: 'TOGGLE_BASE' }

const initialFiltersState: FilterState = {
	showOffers: true,
	showRequests: true,
	showOffersTasks: true,
	showRequestsTasks: true,
	showVehicles: true,
	showBase: true,
}
function filtersReducer(state: FilterState, action: FilterAction): FilterState {
	switch (action.type) {
		case 'TOGGLE_OFFERS':
			return { ...state, showOffers: !state.showOffers }
		case 'TOGGLE_REQUESTS':
			return { ...state, showRequests: !state.showRequests }
		case 'TOGGLE_OFFERS_TASKS':
			return { ...state, showOffersTasks: !state.showOffersTasks }
		case 'TOGGLE_REQUESTS_TASKS':
			return { ...state, showRequestsTasks: !state.showRequestsTasks }
		case 'TOGGLE_VEHICLES':
			return { ...state, showVehicles: !state.showVehicles }
		case 'TOGGLE_BASE':
			return { ...state, showBase: !state.showBase }
		default:
			return state
	}
}
export default function MapRoute() {
	const [filters, dispatch] = useReducer(filtersReducer, initialFiltersState)

	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<h1 className="text-h3">Map</h1>
			<div className="flex flex-wrap gap-2">
				<Toggle
					size="sm"
					variant={'outline'}
					onPressedChange={() => dispatch({ type: 'TOGGLE_OFFERS' })}
				>
					{filters.showOffers ? 'Hide Offers' : 'Show Offers'}
				</Toggle>
				<Toggle
					variant="outline"
					size="sm"
					onPressedChange={() => dispatch({ type: 'TOGGLE_REQUESTS' })}
				>
					{filters.showRequests ? 'Hide Requests' : 'Show Requests'}
				</Toggle>
				<Toggle
					variant="outline"
					size="sm"
					onPressedChange={() => dispatch({ type: 'TOGGLE_OFFERS_TASKS' })}
				>
					{filters.showOffersTasks ? 'Hide Offers Tasks' : 'Show Offers Tasks'}
				</Toggle>
				<Toggle
					variant="outline"
					size="sm"
					onPressedChange={() => dispatch({ type: 'TOGGLE_REQUESTS_TASKS' })}
				>
					{filters.showRequestsTasks
						? 'Hide Requests Tasks'
						: 'Show Requests Tasks'}
				</Toggle>
				<Toggle
					variant="outline"
					size="sm"
					onPressedChange={() => dispatch({ type: 'TOGGLE_VEHICLES' })}
				>
					{filters.showVehicles ? 'Hide Vehicles' : 'Show Vehicles'}
				</Toggle>
				<Toggle
					variant="outline"
					size="sm"
					onPressedChange={() => dispatch({ type: 'TOGGLE_BASE' })}
				>
					{filters.showBase ? 'Hide Base' : 'Show Base'}
				</Toggle>
			</div>
			<div className="light h-[600px]">
				<ClientOnly fallback={<p>Loading map...</p>}>
					{() => (
						<Suspense fallback={<div>Loading map...</div>}>
							{/* <LazyMap
								vehiclePositions={vehiclePositions}
								offerPositions={offerPositions}
								requestPositions={requestPositions}
								base={base}
							/> */}
							<LazyMap filters={filters} />
						</Suspense>
					)}
				</ClientOnly>
			</div>
		</div>
	)
}
