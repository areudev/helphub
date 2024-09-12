import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { useState } from 'react'
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

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const tasks = await prisma.task.findMany({
		select: {
			id: true,
			status: true,
			rescuer: {
				select: { username: true },
			},
			request: {
				select: {
					item: { select: { name: true } },
				},
			},
			offer: {
				select: {
					item: { select: { name: true } },
				},
			},
		},
	})
	return json({ tasks })
}

export default function AdminTasksRoute() {
	const { tasks } = useLoaderData<typeof loader>()
	const [searchTerm, setSearchTerm] = useState('')

	const filteredTasks = tasks.filter(
		(task) =>
			task.request?.item.name
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			task.offer?.item.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
					<TableCaption>A list of all tasks.</TableCaption>
					<TableHeader className="text-center">
						<TableRow>
							<TableHead className="text-center">Resquer</TableHead>
							<TableHead className="text-center">Task Type</TableHead>
							<TableHead className="text-center">Item</TableHead>
							<TableHead className="text-center">Status</TableHead>
							<TableHead className="text-center">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredTasks.map((task) => (
							<TaskRow task={task} key={task.id} />
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}

function TaskRow({
	task,
}: {
	task: {
		id: string
		status: string
		rescuer: { username: string }
		request: { item: { name: string } } | null
		offer: { item: { name: string } } | null
	}
}) {
	const taskType = task.request ? 'Request' : 'Offer'
	const item = task.request ? task.request.item.name : task.offer?.item.name
	return (
		<TableRow className="text-center" key={task.id}>
			<TableCell className="font-medium">{task.rescuer?.username}</TableCell>
			<TableCell className="text-center">{taskType}</TableCell>
			<TableCell className="text-center">{item}</TableCell>
			<TableCell className="text-center">{task.status}</TableCell>
			<TableCell className="flex justify-center gap-2">Wip</TableCell>
		</TableRow>
	)
}
