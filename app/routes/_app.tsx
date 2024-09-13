import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, NavLink, Outlet, useLoaderData } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import { getUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await getUserId(request)

	let isRescuer = false
	let username = null

	if (userId) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { roles: true, vehicle: true, username: true },
		})
		isRescuer =
			Boolean(user?.roles.some((role) => role.name === 'rescuer')) &&
			!Boolean(user?.vehicle)
		username = user?.username
	}

	return json({ isRescuer, username })
}

export default function AppLayout() {
	const { isRescuer, username } = useLoaderData<typeof loader>()
	return (
		<div className="space-y-4">
			{isRescuer && username ? (
				<RescuerOnlyWarning username={username} />
			) : null}

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

function RescuerOnlyWarning({ username }: { username: string }) {
	return (
		<div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-2 rounded-md bg-destructive/30 p-4">
			<p className="text-body-sm">
				As a rescuer, you need to create a car to use this app.
			</p>
			{
				<Button variant={'outline'}>
					<Link to={`/users/${username}/vehicle`}>Create vehicle</Link>
				</Button>
			}
		</div>
	)
}
