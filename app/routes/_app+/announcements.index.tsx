import { json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from '#app/components/ui/card.tsx'
import { Progress } from '#app/components/ui/progress.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'

export async function loader() {
	const announcements = await prisma.announcement.findMany({
		include: {
			items: {
				include: {
					item: {
						include: {
							inventory: true,
						},
					},
				},
			},
		},
	})
	return json({ announcements })
}
export default function AnnouncementsRoute() {
	const user = useOptionalUser()
	const { announcements } = useLoaderData<typeof loader>()
	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<div className="flex flex-col items-center justify-between gap-4">
				<h1 className="text-h3 font-bold">Announcements</h1>
				{user?.roles.find((role) => role.name === 'admin') && (
					<Button asChild>
						<Link to="/announcements/new">Add Announcement</Link>
					</Button>
				)}
			</div>
			<div className="space-y-4">
				{announcements.length === 0 ? (
					<p>No announcements found</p>
				) : (
					announcements.map((announcement) => (
						<Card key={announcement.id}>
							<CardHeader>
								<CardTitle>{announcement.content}</CardTitle>
								<p className="text-sm text-muted-foreground">
									{new Date(announcement.createdAt).toLocaleDateString(
										undefined,
										{
											day: 'numeric',
											month: 'long',
											year: 'numeric',
											hour: 'numeric',
											minute: 'numeric',
										},
									)}
								</p>
							</CardHeader>
							<CardContent>
								<h3 className="mb-2 font-semibold">Requested Items:</h3>
								<ul className="space-y-4">
									{announcement.items.map((item) => {
										// const itemstock = item.item.inventory?.quantity ?? 0
										return (
											<li key={item.id}>
												<div className="flex items-center justify-between">
													<span>{item.item.name}</span>
													<Badge variant="secondary">
														{item.count} / {item.quantity}
													</Badge>
												</div>
												<Progress
													value={(item.count / item.quantity) * 100}
													className="mt-2"
												/>
												<div className="mt-2 flex justify-end">
													{user ? (
														<Button asChild variant="outline">
															<Link
																to={`/users/${user.username}/offers/new?itemId=${item.item.id}&announcementId=${announcement.id}`}
															>
																Offer {item.item.name}
															</Link>
														</Button>
													) : (
														<Button asChild variant="outline">
															<Link to={`/login?redirectTo=/announcements`}>
																Login to Offer
															</Link>
														</Button>
													)}
												</div>
											</li>
										)
									})}
								</ul>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	)
}
