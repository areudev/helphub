import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { NavLink, Outlet, useLoaderData } from '@remix-run/react'
import { getUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'
import { Button } from '#app/components/ui/button.tsx'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await getUserId(request)

	let isRescuer = false

	if (userId) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { roles: true, vehicle: true },
		})
		isRescuer =
			Boolean(user?.roles.some((role) => role.name === 'rescuer')) ||
			Boolean(user?.vehicle)
	}

	return json({ isRescuer })
}

export default function AppLayout() {
	const { isRescuer } = useLoaderData<typeof loader>()
	return (
		<div className="space-y-4">
			{isRescuer && <RescuerOnlyWarning />}

			<div className="flex justify-center">
				<div
					className={cn(
						'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
						'',
					)}
				>
					<NavLink
						className={({ isActive }) =>
							cn(
								'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
								isActive && 'bg-background text-foreground shadow',
							)
						}
						to="/"
					>
						Home
					</NavLink>

					<NavLink
						className={({ isActive }) =>
							cn(
								'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
								isActive && 'bg-background text-foreground shadow',
							)
						}
						to="/supplies"
					>
						Supplies
					</NavLink>
					<NavLink
						className={({ isActive }) =>
							cn(
								'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
								isActive && 'bg-background text-foreground shadow',
							)
						}
						to="/announcements"
					>
						Announcements
					</NavLink>
				</div>
			</div>

			<Outlet />
		</div>
	)
}

function RescuerOnlyWarning() {
	return (
		<div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-2 rounded-md bg-destructive/30 p-4">
			<p className="text-body-sm">
				As a rescuer, you need to create a car to use this app.
			</p>
			<Button variant={'outline'}>Create car</Button>
		</div>
	)
}
