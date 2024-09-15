import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
	redirect,
} from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
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
	requestId: z.string(),
})

export async function action({ request }: ActionFunctionArgs) {
	const rescuerId = await requireUserWithRole(request, 'rescuer')
	const user = await prisma.user.findUnique({
		where: { id: rescuerId },
		select: { username: true },
	})
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: AddToTasksSchema })

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	const { requestId } = submission.value

	const task = await prisma.task.create({
		data: {
			requestId,
			rescuerId,
			status: 'pending',
		},
		select: { id: true },
	})

	return redirect(`/users/${user?.username}/tasks/${task.id}`)
}

export async function loader({ request }: LoaderFunctionArgs) {
	const rescuerId = await requireUserWithRole(request, 'rescuer')

	const requests = await prisma.request.findMany({
		include: {
			user: {
				select: { username: true },
			},
			item: { select: { name: true } },
			task: { select: { id: true, rescuer: { select: { username: true } } } },
		},
	})

	const activeTasks = await prisma.task.count({
		where: {
			rescuerId,
			status: { in: ['pending', 'in_progress'] },
		},
	})

	return json({ requests, activeTasks })
}

export default function AdminRequestsRoute() {
	const { requests, activeTasks } = useLoaderData<typeof loader>()
	const [searchTerm, setSearchTerm] = useState('')

	const filteredRequests = requests.filter(
		(request) =>
			request.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.item.name.toLowerCase().includes(searchTerm.toLowerCase()),
	)

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-6 text-3xl font-bold">Requests Management</h1>

			<div className="mb-4">
				<Input
					type="text"
					placeholder="Search requests..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
			</div>

			<div className="overflow-x-auto">
				<Table>
					<TableCaption>A list of all requests.</TableCaption>
					<TableHeader className="text-center">
						<TableRow>
							<TableHead className="text-center">User</TableHead>
							<TableHead className="text-center">Item</TableHead>
							<TableHead className="text-center">Quantity</TableHead>
							<TableHead className="text-center">Number of People</TableHead>
							<TableHead className="text-center">Notes</TableHead>
							<TableHead className="text-center">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredRequests.map((request) => (
							<RequestRow
								activeTasks={activeTasks}
								request={request}
								key={request.id}
							/>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}

function RequestRow({
	request,
	activeTasks,
}: {
	activeTasks: number
	request: {
		id: string
		quantity: number
		numberOfPeople: number
		notes: string | null
		user: { username: string }
		item: { name: string }
		task: {
			id: string
			rescuer: { username: string }
		} | null
	}
}) {
	return (
		<TableRow className="text-center" key={request.id}>
			<TableCell>{request.user.username}</TableCell>
			<TableCell>{request.item.name}</TableCell>
			<TableCell>{request.quantity}</TableCell>
			<TableCell>{request.numberOfPeople}</TableCell>
			<TableCell>{request.notes}</TableCell>
			<TableCell className="flex justify-center gap-2">
				{request.task ? (
					<Button size="sm">
						<Link
							to={`/users/${request.task.rescuer.username}/tasks/${request.task.id}`}
						>
							View Task
						</Link>
					</Button>
				) : (
					<AddRequestToTasksForm
						requestId={request.id}
						activeTasks={activeTasks}
					/>
				)}
			</TableCell>
		</TableRow>
	)
}

export function AddRequestToTasksForm({
	requestId,
	activeTasks,
}: {
	requestId: string
	activeTasks: number
}) {
	const [form, fields] = useForm({
		id: `add-to-tasks-${requestId}`,
		constraint: getZodConstraint(AddToTasksSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: AddToTasksSchema })
		},
	})
	return (
		<Form method="POST" action="/rescuer/requests" {...getFormProps(form)}>
			<input type="hidden" name={fields.requestId.name} value={requestId} />
			<Button disabled={activeTasks >= 4} type="submit" size="sm">
				{activeTasks >= 4 ? 'Max Tasks Reached' : 'Add to Tasks'}
			</Button>
			<ErrorList errors={form.errors} />
		</Form>
	)
}
