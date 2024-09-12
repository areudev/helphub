import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Outlet, useLoaderData, Link, NavLink } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerTrigger,
} from '#app/components/ui/drawer.js'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'
import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ params }: LoaderFunctionArgs) {
	const username = params.username
	const owner = await prisma.user.findFirst({
		where: { username },
		select: {
			id: true,
			name: true,
			username: true,
			requests: {
				select: {
					id: true,
					quantity: true,
					item: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	})
	invariantResponse(owner, 'Owner not found', { status: 404 })

	return json({ owner })
}

export default function OffersRoute() {
	const user = useOptionalUser()
	const { owner } = useLoaderData<typeof loader>()
	const offers = owner.requests
	const isOwner = user?.id === owner.id
	const ownerDisplayName = owner.name ?? owner.username
	return (
		<div>
			<Drawer>
				<div className="flex justify-center md:hidden">
					<DrawerTrigger asChild>
						<Button>
							{isOwner
								? 'Click to view your requests'
								: 'Click to view requests'}
						</Button>
					</DrawerTrigger>
				</div>
				<div className="flex">
					<aside className="hidden md:block">
						<div className="p-4">
							<h2 className="mb-4 text-xl font-bold">
								{isOwner ? 'Your' : `${ownerDisplayName}'s`} Requests
							</h2>
							{isOwner ? (
								<Button asChild className="mb-4 w-full">
									<Link to="/supplies">Make a request 💸</Link>
								</Button>
							) : null}
							{offers.length === 0 ? (
								<p className="text-muted-foreground">No requests yet 🥺</p>
							) : (
								<ul className="space-y-2">
									{offers.map((offer) => (
										<li
											key={offer.id}
											className="rounded-md border p-2 hover:bg-accent"
										>
											<NavLink
												to={`/users/${owner.username}/requests/${offer.id}`}
												className={({ isActive }) =>
													cn(
														'block rounded p-2',
														isActive ? 'underline underline-offset-2' : '',
													)
												}
											>
												<h3 className="font-semibold">{offer.item.name}</h3>
												<p className="text-sm text-muted-foreground">
													Quantity: {offer.quantity}
												</p>
											</NavLink>
										</li>
									))}
								</ul>
							)}
						</div>
					</aside>
					<div className="md:hidden">
						<DrawerContent>
							<div className="p-4">
								<h2 className="mb-4 text-xl font-bold">
									{isOwner ? 'Your' : `${ownerDisplayName}'s`} Requests
								</h2>
								{isOwner ? (
									<Button asChild className="mb-4 w-full">
										<DrawerClose>
											<Link to="/supplies">Make a request 💸</Link>
										</DrawerClose>
									</Button>
								) : null}
								{offers.length === 0 ? (
									<p className="text-muted-foreground">No requests yet 🥺</p>
								) : (
									<ul className="space-y-2">
										{offers.map((offer) => (
											<li key={offer.id} className="rounded-md border p-2">
												<NavLink
													to={`/users/${owner.username}/requests/${offer.id}`}
													className={({ isActive }) =>
														cn(
															'block rounded p-2',
															isActive ? 'underline underline-offset-2' : '',
														)
													}
												>
													<h3 className="font-semibold">{offer.item.name}</h3>
													<p className="text-sm text-muted-foreground">
														Quantity: {offer.quantity}
													</p>
												</NavLink>
											</li>
										))}
									</ul>
								)}
							</div>
						</DrawerContent>
					</div>
					<main className="flex-grow p-4">
						<Outlet />
					</main>
				</div>
			</Drawer>
		</div>
	)
}
