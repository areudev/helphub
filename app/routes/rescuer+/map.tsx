import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { lazy, Suspense, useReducer } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { Toggle } from '#app/components/ui/toggle.tsx'
import { FilterToggle } from '#app/routes/admin+/_manage+/maps.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithRole(request, 'rescuer')

	const formData = await request.formData()
	const table = formData.get('table')

	if (typeof table !== 'string') {
		return json({ error: 'Invalid table' }, { status: 400 })
	}

	if (table === 'vehicle') {
		const latitude = formData.get('latitude')
		const longitude = formData.get('longitude')

		if (typeof latitude !== 'string' || typeof longitude !== 'string') {
			return json({ error: 'Invalid latitude or longitude' }, { status: 400 })
		}

		await prisma.user.update({
			where: { id: userId },
			data: {
				latitude: parseFloat(latitude),
				longitude: parseFloat(longitude),
			},
		})
		return json({ success: true })
	}

	return json({ success: false, error: 'Invalid table' }, { status: 400 })
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserWithRole(request, 'rescuer')

	const vehicles = await prisma.vehicle.findMany({
		select: {
			currentLoad: true,
			name: true,
			user: {
				select: {
					id: true,
					username: true,
					latitude: true,
					longitude: true,
					tasks: {
						where: { status: 'in_progress' },
						select: {
							id: true,
							status: true,
							offer: {
								select: {
									user: { select: { latitude: true, longitude: true } },
								},
							},
							request: {
								select: {
									user: { select: { latitude: true, longitude: true } },
								},
							},
						},
					},
				},
			},
		},
	})

	const activeTasks = await prisma.task.count({
		where: {
			rescuerId: userId,
			status: { in: ['pending', 'in_progress'] },
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

	return json({ vehicles, userId, offers, requests, activeTasks })
}
export type FilterState = {
	showOffers: boolean
	showRequests: boolean
	showOtherTasks: boolean
	showOtherVehicles: boolean
	showBase: boolean
}

type FilterAction =
	| { type: 'TOGGLE_OFFERS' }
	| { type: 'TOGGLE_REQUESTS' }
	| { type: 'TOGGLE_OTHER_TASKS' }
	| { type: 'TOGGLE_OTHER_VEHICLES' }
	| { type: 'TOGGLE_BASE' }

const initialFiltersState: FilterState = {
	showOffers: true,
	showRequests: true,
	showOtherTasks: true,
	showOtherVehicles: true,
	showBase: true,
}

function filtersReducer(state: FilterState, action: FilterAction): FilterState {
	switch (action.type) {
		case 'TOGGLE_OFFERS':
			return { ...state, showOffers: !state.showOffers }
		case 'TOGGLE_REQUESTS':
			return { ...state, showRequests: !state.showRequests }
		case 'TOGGLE_OTHER_TASKS':
			return { ...state, showOtherTasks: !state.showOtherTasks }
		case 'TOGGLE_OTHER_VEHICLES':
			return { ...state, showOtherVehicles: !state.showOtherVehicles }
		case 'TOGGLE_BASE':
			return { ...state, showBase: !state.showBase }
		default:
			return state
	}
}

const LazyMap = lazy(() => import('#app/components/rescuer-map.tsx'))
export default function RescuerMap() {
	const [filters, dispatch] = useReducer(filtersReducer, initialFiltersState)

	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<h1 className="text-h3">Rescuer Map</h1>
			<div className="flex flex-wrap gap-2">
				<Toggle
					size="sm"
					variant={'outline'}
					pressed={filters.showOffers}
					onPressedChange={() => dispatch({ type: 'TOGGLE_OFFERS' })}
				>
					<FilterToggle bool={filters.showOffers} label="Offers" />
				</Toggle>
				<Toggle
					size="sm"
					variant={'outline'}
					pressed={filters.showRequests}
					onPressedChange={() => dispatch({ type: 'TOGGLE_REQUESTS' })}
				>
					<FilterToggle bool={filters.showRequests} label="Requests" />
				</Toggle>
				<Toggle
					size="sm"
					variant={'outline'}
					pressed={filters.showOtherTasks}
					onPressedChange={() => dispatch({ type: 'TOGGLE_OTHER_TASKS' })}
				>
					<FilterToggle bool={filters.showOtherTasks} label="Other Tasks" />
				</Toggle>
				<Toggle
					size="sm"
					variant={'outline'}
					pressed={filters.showOtherVehicles}
					onPressedChange={() => dispatch({ type: 'TOGGLE_OTHER_VEHICLES' })}
				>
					<FilterToggle
						bool={filters.showOtherVehicles}
						label="Other Vehicles"
					/>
				</Toggle>
				<Toggle
					size="sm"
					variant={'outline'}
					pressed={filters.showBase}
					onPressedChange={() => dispatch({ type: 'TOGGLE_BASE' })}
				>
					<FilterToggle bool={filters.showBase} label="Base" />
				</Toggle>
			</div>
			<div className="light h-[600px]">
				<ClientOnly fallback={<p>Loading map...</p>}>
					{() => (
						<Suspense fallback={<div>Loading map...</div>}>
							<LazyMap filters={filters} />
						</Suspense>
					)}
				</ClientOnly>
			</div>
		</div>
	)
}
