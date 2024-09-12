import { json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { CategoryFilter } from '#app/components/faceted-categories.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '#app/components/ui/card.tsx'
import { Input } from '#app/components/ui/input.tsx'

import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'
import { useOptionalUser } from '#app/utils/user.js'

export async function loader() {
	const categories = await prisma.category.findMany({
		select: {
			id: true,
			name: true,

			items: {
				select: {
					name: true,
					id: true,
					details: {
						select: {
							detailName: true,
							detailValue: true,
						},
					},
					inventory: {
						select: { quantity: true },
					},
				},
			},
		},
	})

	return json({ categories })
}

export default function SuppliesRoute() {
	const user = useOptionalUser()
	const isAdmin = user?.roles.some((role) => role.name === 'admin')
	const username = user?.username

	const { categories } = useLoaderData<typeof loader>()
	const [search, setSearch] = useState('')
	const [selectedCategories, setSelectedCategories] = useState<string[]>([])

	const filteredCategories =
		selectedCategories.length > 0
			? categories.filter((category) =>
					selectedCategories.includes(category.id),
				)
			: categories.filter((category) =>
					category.items.some((item) =>
						item.name.toLowerCase().includes(search.toLowerCase()),
					),
				)

	return (
		<div className="mx-auto space-y-8 px-4 py-8">
			<h1 className="mb-8 text-center text-4xl font-bold">
				Emergency Supplies
			</h1>

			<div className="mx-auto flex max-w-xl items-center justify-center gap-4">
				<SearchAndFilter
					className="flex-1"
					search={search}
					setSearch={setSearch}
					categories={categories}
					selectedCategories={selectedCategories}
					setSelectedCategories={setSelectedCategories}
				/>
			</div>
			{isAdmin && (
				<div className="flex justify-center">
					<Button asChild>
						<Link to="/supplies/new">New Item</Link>
					</Button>
				</div>
			)}
			<div className="flex flex-col gap-4">
				{filteredCategories.map((category) => (
					<div key={category.id} className="space-y-4">
						<h2 className="text-center text-xl font-semibold text-muted-foreground underline lg:text-2xl">
							{category.name}
						</h2>
						<div className="flex flex-wrap justify-center gap-4">
							{category.items.length === 0 ? (
								<p>No items in this category</p>
							) : (
								category.items
									.filter((item) =>
										item.name.toLowerCase().includes(search.toLowerCase()),
									)
									.map((item) => (
										<ItemCard
											key={item.id}
											item={item}
											quantity={item.inventory?.quantity}
											username={username}
										/>
									))
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
function SearchAndFilter({
	search,
	setSearch,
	categories,
	selectedCategories,
	setSelectedCategories,
	className,
}: {
	className?: string
	search: string
	setSearch: (search: string) => void
	categories: {
		id: string
		name: string
	}[]
	selectedCategories: string[]
	setSelectedCategories: (categories: string[]) => void
}) {
	return (
		<div className={cn('flex gap-4', className)}>
			<Input
				placeholder="Search"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				className="max-w-lg"
			/>
			<CategoryFilter
				categories={categories}
				selectedCategories={selectedCategories}
				setSelectedCategories={setSelectedCategories}
			/>
		</div>
	)
}

function ItemCard({
	item,
	quantity = 0,
	username,
}: {
	item: {
		id: string
		name: string
		details: {
			detailName: string
			detailValue: string
		}[]
	}
	quantity: number | undefined
	username: string | undefined
}) {
	return (
		<Card className="w-[380px]">
			<CardHeader className="text-xl font-medium">{item.name}</CardHeader>
			<CardContent className="flex flex-col gap-2">
				<p className="text-lg font-medium">
					{quantity > 0 ? `Stock: ${quantity}` : 'Out of stock'}
				</p>

				<ul className="flex flex-col gap-2 text-muted-foreground">
					{item.details.map((detail, index) => (
						<li key={index} className="flex justify-between">
							<span className="">{detail.detailName}:</span>
							<span>{detail.detailValue}</span>
						</li>
					))}
				</ul>
			</CardContent>
			{username != undefined ? (
				<CardFooter className="flex flex-col gap-2 md:flex-row">
					<Button className="w-full" asChild>
						<Link to={`/users/${username}/requests/new?itemId=${item.id}`}>
							Request
						</Link>
					</Button>
				</CardFooter>
			) : (
				<CardFooter className="flex flex-col gap-2 md:flex-row">
					<Button className="w-full" asChild>
						<Link to={`/login?redirectTo=/supplies`}>Login to request</Link>
					</Button>
				</CardFooter>
			)}
		</Card>
	)
}

// import { Link, useNavigation } from '@remix-run/react'
// import { Button } from '#app/components/ui/button.tsx'
// export default function SuppliesRoute() {
// 	const navigation = useNavigation()
// 	const isLoading = navigation.state !== 'idle'
// 	if (isLoading) return <div>Loading...</div>
// 	return (
// 		<div>
// 			<Button asChild>
// 				<Link to="/supplies/sups">Supplies</Link>
// 			</Button>
// 		</div>
// 	)
// }
