import {
	FormProvider,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { SelectField } from '#app/components/select-field.js'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '#app/components/ui/popover.tsx'
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
import { RequestStatus } from '#app/utils/status.ts'

const RequestSchema = z.object({
	id: z.string(),
	status: RequestStatus,
	quantity: z.number().int().positive(),
	numberOfPeople: z.number().int().positive(),
})

const DeleteRequestSchema = z.object({
	requestId: z.string(),
})

const deleteActionIntent = 'delete'
const editActionIntent = 'edit'

async function deleteAction({
	formData,
}: {
	request: Request
	formData: FormData
}) {
	const submission = parseWithZod(formData, { schema: DeleteRequestSchema })
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}
	const { requestId } = submission.value
	await prisma.request.delete({ where: { id: requestId } })
	return json({ result: submission.reply() })
}

async function editAction({ formData }: { formData: FormData }) {
	const submission = parseWithZod(formData, { schema: RequestSchema })
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}
	const { id, status, quantity, numberOfPeople } = submission.value

	await prisma.request.update({
		where: { id },
		data: { status, quantity, numberOfPeople },
	})

	return json({ result: submission.reply() })
}

export const action = async ({ request }: ActionFunctionArgs) => {
	await requireUserWithRole(request, 'admin')
	const formData = await request.formData()
	const intent = formData.get('intent')
	switch (intent) {
		case deleteActionIntent: {
			return deleteAction({ request, formData })
		}
		case editActionIntent: {
			return editAction({ formData })
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 })
		}
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')

	const requests = await prisma.request.findMany({
		include: {
			user: {
				select: {
					username: true,
				},
			},
			item: {
				select: {
					name: true,
				},
			},
		},
	})

	return json({ requests })
}

function RequestRow({
	request,
}: {
	request: {
		id: string
		status: string
		quantity: number
		numberOfPeople: number
		notes: string | null
		user: { username: string }
		item: { name: string }
	}
}) {
	return (
		<TableRow className="text-center" key={request.id}>
			<TableCell>{request.user.username}</TableCell>
			<TableCell>{request.item.name}</TableCell>
			<TableCell>{request.quantity}</TableCell>
			<TableCell>{request.numberOfPeople}</TableCell>
			<TableCell>{request.status}</TableCell>
			<TableCell className="">{request.notes}</TableCell>
			<TableCell className="flex justify-center gap-2">
				<Popover>
					<PopoverTrigger asChild>
						<Button size="sm" variant={'secondary'}>
							Edit
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80">
						<h4 className="text-body-md">Edit Request</h4>
						<EditForm request={request} />
					</PopoverContent>
				</Popover>

				<DeleteForm requestId={request.id} />
			</TableCell>
		</TableRow>
	)
}

function EditForm({
	request,
}: {
	request: {
		id: string
		status: string
		quantity: number
		numberOfPeople: number
		notes: string | null
	}
}) {
	const fetcher = useFetcher<typeof editAction>({
		key: `edit-${request.id}`,
	})
	const [form, fields] = useForm({
		id: `edit-${request.id}`,
		constraint: getZodConstraint(RequestSchema),
		lastResult: fetcher.data?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: RequestSchema })
		},
		defaultValue: {
			status: request.status,
			quantity: request.quantity,
			numberOfPeople: request.numberOfPeople,
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})
	return (
		<FormProvider context={form.context}>
			<fetcher.Form method="POST" {...getFormProps(form)}>
				<input type="hidden" name="id" value={request.id} />
				<SelectField
					label="Status"
					name="status"
					options={[
						{ value: 'pending', label: 'Pending' },
						{ value: 'approved', label: 'Approved' },
						{ value: 'received', label: 'Received' },
					]}
				/>
				<ErrorList errors={fields.status.errors} />
				<Field
					labelProps={{ children: 'Quantity' }}
					inputProps={{
						...getInputProps(fields.quantity, { type: 'number' }),
					}}
					errors={fields.quantity.errors}
				/>
				<Field
					labelProps={{ children: 'Number of People' }}
					inputProps={{
						...getInputProps(fields.numberOfPeople, { type: 'number' }),
					}}
					errors={fields.numberOfPeople.errors}
				/>
				<Button size="sm" name="intent" value={editActionIntent} type="submit">
					Save
				</Button>
				<ErrorList errors={form.errors} />
			</fetcher.Form>
		</FormProvider>
	)
}

function DeleteForm({ requestId }: { requestId: string }) {
	const fetcher = useFetcher<typeof deleteAction>({
		key: `delete-${requestId}`,
	})
	return (
		<fetcher.Form method="POST">
			<input type="hidden" name="requestId" value={requestId} />
			<Button
				style={{
					opacity: fetcher.formData?.get('requestId') === requestId ? 0.5 : 1,
				}}
				type="submit"
				name="intent"
				value={deleteActionIntent}
				size="sm"
				variant="destructive"
			>
				Delete
			</Button>
		</fetcher.Form>
	)
}

export default function AdminRequestsRoute() {
	const { requests } = useLoaderData<typeof loader>()
	const [searchTerm, setSearchTerm] = useState('')

	const filteredRequests = requests.filter(
		(request) =>
			request.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.status.toLowerCase().includes(searchTerm.toLowerCase()),
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
							<TableHead className="text-center">Status</TableHead>
							<TableHead className="text-center">Notes</TableHead>
							<TableHead className="text-center">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredRequests.map((request) => (
							<RequestRow request={request} key={request.id} />
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
