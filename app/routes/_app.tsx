import { NavLink, Outlet } from '@remix-run/react'
import { cn } from '#app/utils/misc.js'

export default function AppLayout() {
	return (
		<div>
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
