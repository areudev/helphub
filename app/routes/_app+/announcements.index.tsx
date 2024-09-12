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
										const itemstock = item.item.inventory?.quantity ?? 0
										return (
											<li key={item.id}>
												<div className="flex items-center justify-between">
													<span>{item.item.name}</span>
													<Badge variant="secondary">
														{item.item.inventory?.quantity} / {item.quantity}
													</Badge>
												</div>
												<Progress
													value={(itemstock / item.quantity) * 100}
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

// const dummyAnnouncements = [
// 	{
// 		id: '1',
// 		content: 'Urgent need for supplies in sector 3',
// 		createdAt: '2023-06-15T10:00:00Z',
// 		items: [
// 			{ id: 'item1', name: 'Bottled Water', quantity: 1000, offered: 250 },
// 			{ id: 'item2', name: 'Canned Food', quantity: 500, offered: 100 },
// 		],
// 	},
// 	{
// 		id: '2',
// 		content: 'Medical supplies needed at Central Hospital',
// 		createdAt: '2023-06-14T14:30:00Z',
// 		items: [
// 			{ id: 'item3', name: 'Bandages', quantity: 5000, offered: 2000 },
// 			{ id: 'item4', name: 'Antibiotics', quantity: 1000, offered: 300 },
// 			{ id: 'item5', name: 'Surgical Masks', quantity: 10000, offered: 5000 },
// 		],
// 	},
// 	{
// 		id: '3',
// 		content: 'Shelter supplies for displaced families',
// 		createdAt: '2023-06-13T09:15:00Z',
// 		items: [
// 			{ id: 'item6', name: 'Blankets', quantity: 500, offered: 150 },
// 			{ id: 'item7', name: 'Sleeping Bags', quantity: 300, offered: 75 },
// 			{ id: 'item8', name: 'Tents', quantity: 100, offered: 20 },
// 		],
// 	},
// 	{
// 		id: '4',
// 		content: 'Emergency food distribution in downtown area',
// 		createdAt: '2023-06-12T11:45:00Z',
// 		items: [
// 			{ id: 'item9', name: 'Rice (5kg bags)', quantity: 1000, offered: 400 },
// 			{
// 				id: 'item10',
// 				name: 'Cooking Oil (1L bottles)',
// 				quantity: 500,
// 				offered: 150,
// 			},
// 			{
// 				id: 'item11',
// 				name: 'Salt (1kg packets)',
// 				quantity: 200,
// 				offered: 100,
// 			},
// 		],
// 	},
// 	{
// 		id: '5',
// 		content: 'Hygiene kits needed for evacuation centers',
// 		createdAt: '2023-06-11T16:20:00Z',
// 		items: [
// 			{ id: 'item12', name: 'Soap Bars', quantity: 5000, offered: 2000 },
// 			{ id: 'item13', name: 'Toothbrushes', quantity: 2000, offered: 800 },
// 			{ id: 'item14', name: 'Toothpaste', quantity: 2000, offered: 700 },
// 			{ id: 'item15', name: 'Hand Sanitizers', quantity: 1000, offered: 300 },
// 		],
// 	},
// ]
