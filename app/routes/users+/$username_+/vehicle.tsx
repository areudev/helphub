import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const userId = await requireUserWithRole(request, 'rescuer')
	const vehicle = await prisma.vehicle.findUnique({
		where: { userId },
		select: {
			name: true,
			capacity: true,
			currentLoad: true,
			status: true,
			latitude: true,
			longitude: true,
			id: true,
		},
	})

	return json({ vehicle })
}

export default function VehiclePage() {
	const { vehicle } = useLoaderData<typeof loader>()

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			{!vehicle ? (
				<Card>
					<CardContent className="flex flex-col items-center space-y-4 py-8">
						<Icon name="rocket" className="h-16 w-16 text-muted-foreground" />
						<h2 className="text-center text-xl font-semibold">
							You haven't added a vehicle yet
						</h2>
						<p className="text-center text-muted-foreground">
							Add your vehicle to your profile to make it easier for others to
							find you.
						</p>
						<Button asChild>
							<Link to="new">Add vehicle</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span>{vehicle.name}</span>
							<Badge
								variant={vehicle.status === 'active' ? 'default' : 'secondary'}
							>
								{vehicle.status}
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="flex items-center space-x-2">
								<Icon
									name={'arrow-left'}
									className="h-5 w-5 text-muted-foreground"
								/>
								<span className="text-sm font-medium">Capacity</span>
								<span className="text-sm text-muted-foreground">
									{vehicle.capacity} kg
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<Icon
									name={'arrow-left'}
									className="h-5 w-5 text-muted-foreground"
								/>
								<span className="text-sm font-medium">Current Load</span>
								<span className="text-sm text-muted-foreground">
									{vehicle.currentLoad} kg
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<Icon
									name={'arrow-left'}
									className="h-5 w-5 text-muted-foreground"
								/>
								<span className="text-sm font-medium">Location</span>
								<span className="text-sm text-muted-foreground">
									{vehicle.latitude && vehicle.longitude
										? `${vehicle.latitude.toFixed(4)}, ${vehicle.longitude.toFixed(4)}`
										: 'Not set'}
								</span>
							</div>
						</div>
						<div className="flex justify-end">
							<Button asChild>
								<Link to="edit">Edit vehicle</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
