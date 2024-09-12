import { Outlet } from '@remix-run/react'

export default function AnnouncementsLayout() {
	return (
		<div className="container py-4">
			<Outlet />
		</div>
	)
}
