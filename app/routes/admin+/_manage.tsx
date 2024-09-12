import { NavLink, Outlet } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { cn } from '#app/utils/misc.tsx'

export default function Manage() {
	return (
		<>
			<div className="flex justify-center">
				<div
					className={cn(
						'inline-flex h-9 flex-wrap items-center justify-center rounded-lg bg-transparent p-1 text-muted-foreground sm:bg-muted',
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
						to="/admin/warehouse"
					>
						Warehouse
					</NavLink>

					<NavLink
						className={({ isActive }) =>
							cn(
								'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
								isActive && 'bg-background text-foreground shadow',
							)
						}
						to="/admin/offers"
					>
						Offers
					</NavLink>
					<NavLink
						className={({ isActive }) =>
							cn(
								'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
								isActive && 'bg-background text-foreground shadow',
							)
						}
						to="/admin/requests"
					>
						Requests
					</NavLink>
					<NavLink
						className={({ isActive }) =>
							cn(
								'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
								isActive && 'bg-background text-foreground shadow',
							)
						}
						to="/admin/users"
					>
						Users
					</NavLink>
					<NavLink
						className={({ isActive }) =>
							cn(
								'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
								isActive && 'bg-background text-foreground shadow',
							)
						}
						to="/admin/announcements"
					>
						Announcements
					</NavLink>
					<NavLink
						className={({ isActive }) =>
							cn(
								'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
								isActive && 'bg-background text-foreground shadow',
							)
						}
						to="/admin/tasks"
					>
						Tasks
					</NavLink>
				</div>
			</div>
			<Outlet />
		</>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				403: ({ error }) => (
					<p>You are not allowed to do that: {error?.data.message}</p>
				),
			}}
		/>
	)
}
