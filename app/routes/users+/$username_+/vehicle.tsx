import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
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
				<div className="space-y-2">
					<h2 className="text-center text-body-md">
						You can add your vehicle to your profile to make it easier for
						others to find you.
					</h2>
					<div className="flex justify-center">
						<Button asChild>
							<Link to="new">Add vehicle</Link>
						</Button>
					</div>
				</div>
			) : (
				<div>
					<h2>This is your vehicle.</h2>
					<Button asChild>
						<Link to="edit">Edit vehicle</Link>
					</Button>
				</div>
			)}
		</div>
	)
}
