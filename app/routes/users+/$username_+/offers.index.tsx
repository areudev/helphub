import { type LoaderFunctionArgs, json } from '@remix-run/node'

export async function loader({}: LoaderFunctionArgs) {
	return json({})
}

export default function OffersIndex() {
	return (
		<div>
			<div className="hidden md:block">
				<h2>Select one of the offers to view details</h2>
			</div>
		</div>
	)
}

//function OffersIndexRoute() {
// 	const { offers } = useLoaderData<typeof loader>()
// 	return (
// 		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
// 			<h1 className="mb-8 text-center text-4xl font-bold">Your Offers</h1>
// 			<Button asChild>
// 				<Link to="/announcements">
// 					See the announcements and make an offer 💸
// 				</Link>
// 			</Button>
// 			{offers.length === 0 ? (
// 				<p className="text-center text-lg text-muted-foreground">
// 					No offers yet 🥺
// 				</p>
// 			) : (
// 				<ul className="space-y-4">
// 					{offers.map((offer) => (
// 						<li
// 							key={offer.id}
// 							className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm"
// 						>
// 							<div>
// 								<h3 className="text-lg font-semibold text-foreground">
// 									{offer.item.name}
// 								</h3>
// 								<p className="text-sm text-muted-foreground">
// 									Quantity: {offer.quantity}
// 								</p>
// 								<p className="text-sm text-muted-foreground">
// 									For: {offer.announcement.content}
// 								</p>
// 							</div>
// 							<Button asChild variant="outline">
// 								<Link to={`/users/${offer.user.username}/offers/${offer.id}`}>
// 									View Offer
// 								</Link>
// 							</Button>
// 						</li>
// 					))}
// 				</ul>
// 			)}
// 		</div>
// 	)
// }
