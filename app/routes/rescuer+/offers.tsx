import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, Link, redirect, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
} from '#app/components/ui/table.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

const AddToTasksSchema = z.object({
	offerId: z.string(),
})

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithRole(request, 'rescuer')
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { username: true },
	})
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: AddToTasksSchema })

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	const { offerId } = submission.value

	const task = await prisma.task.create({
		data: {
			rescuerId: userId,
			offerId: offerId,
			status: 'pending',
		},
		select: { id: true },
	})

	await prisma.offer.update({
		where: { id: offerId },
		data: {
			status: 'approved',
		},
	})

	return redirect(`/users/${user?.username}/tasks/${task.id}`)
}
export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'rescuer')

	const offers = await prisma.offer.findMany({
		select: {
			id: true,
			status: true,
			quantity: true,
			item: { select: { name: true } },
			user: {
				select: { username: true },
			},
			announcement: { select: { content: true } },
			task: { select: { id: true, rescuer: { select: { username: true } } } },
		},
	})

	return json({ offers })
}

function OfferRow({
	offer,
}: {
	offer: {
		id: string
		status: string
		quantity: number
		item: { name: string }
		user: { username: string }
		announcement: { content: string }
		task: { id: string; rescuer: { username: string } } | null
	}
}) {
	return (
		<TableRow className="text-center" key={offer.id}>
			<TableCell className="font-medium">{offer.item.name}</TableCell>
			<TableCell className="text-center">{offer.user.username}</TableCell>
			<TableCell className="text-center">{offer.quantity}</TableCell>
			<TableCell className="text-center">{offer.status}</TableCell>
			<TableCell className="text-center">
				{offer.announcement.content}
			</TableCell>
			<TableCell className="flex justify-center gap-2">
				{offer.task ? (
					<Button size="sm">
						<Link
							to={`/users/${offer.task.rescuer.username}/tasks/${offer.task.id}`}
						>
							View Task
						</Link>
					</Button>
				) : (
					<AddToTasksForm offerId={offer.id} />
				)}
			</TableCell>
		</TableRow>
	)
}
function AddToTasksForm({ offerId }: { offerId: string }) {
	const [form, fields] = useForm({
		id: `add-to-tasks-${offerId}`,
		constraint: getZodConstraint(AddToTasksSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: AddToTasksSchema })
		},
	})
	return (
		<Form method="POST" {...getFormProps(form)}>
			<input type="hidden" name={fields.offerId.name} value={offerId} />
			<Button type="submit" size="sm">
				Add to Tasks
			</Button>
			<ErrorList errors={form.errors} />
		</Form>
	)
}

export default function AdminOffersRoute() {
	const { offers } = useLoaderData<typeof loader>()
	const [searchTerm, setSearchTerm] = useState('')

	const filteredOffers = offers.filter(
		(offer) =>
			offer.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			offer.user.username.toLowerCase().includes(searchTerm.toLowerCase()),
	)

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-6 text-3xl font-bold">Offers Management</h1>

			<div className="mb-4">
				<Input
					type="text"
					placeholder="Search offers..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
			</div>

			<div className="overflow-x-auto">
				<Table>
					<TableCaption>A list of all offers.</TableCaption>
					<TableHeader className="text-center">
						<TableRow>
							<TableHead className="text-center">Item Name</TableHead>
							<TableHead className="text-center">User</TableHead>
							<TableHead className="text-center">Quantity</TableHead>
							<TableHead className="text-center">Status</TableHead>
							<TableHead className="text-center">Announcement</TableHead>
							<TableHead className="text-center">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredOffers.map((offer) => (
							<OfferRow offer={offer} key={offer.id} />
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
