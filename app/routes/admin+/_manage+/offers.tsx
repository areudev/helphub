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
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { SelectField } from '#app/components/select-field.js'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.js'
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
import { OfferStatus } from '#app/utils/status.ts'

const OfferSchema = z.object({
	id: z.string(),
	status: OfferStatus,
	quantity: z.number(),
})

const DeleteOfferSchema = z.object({
	offerId: z.string(),
})

const deleteActionIntent = 'delete'
const editActionIntent = 'edit'

async function deleteAction({
	formData,
}: {
	request: Request
	formData: FormData
}) {
	const submission = parseWithZod(formData, { schema: DeleteOfferSchema })
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}
	const { offerId } = submission.value
	await prisma.offer.delete({ where: { id: offerId } })
	return json({ result: submission.reply() })
}

async function editAction({
	formData,
}: {
	request: Request
	formData: FormData
}) {
	const submission = parseWithZod(formData, { schema: OfferSchema })
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}
	const { id, status, quantity } = submission.value

	await prisma.offer.update({
		where: { id },
		data: {
			status,
			quantity,
		},
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
			return editAction({ request, formData })
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 })
		}
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')

	const offers = await prisma.offer.findMany({
		include: {
			item: true,
			user: true,
			announcement: true,
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
		item: {
			name: string
		}
		user: {
			username: string
		}
		announcement: {
			content: string
		}
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
				<Popover>
					<PopoverTrigger asChild>
						<Button size="sm" variant={'secondary'}>
							Edit
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80">
						<h4 className="text-body-md">Edit Offer</h4>
						<EditForm offer={offer} />
					</PopoverContent>
				</Popover>

				<DeleteForm offerId={offer.id} />
			</TableCell>
		</TableRow>
	)
}

function EditForm({
	offer,
}: {
	offer: {
		id: string
		status: string
		quantity: number
	}
}) {
	const fetcher = useFetcher<typeof editAction>({ key: `edit-${offer.id}` })
	const [form, fields] = useForm({
		id: `edit-${offer.id}`,
		constraint: getZodConstraint(OfferSchema),
		lastResult: fetcher.data?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: OfferSchema })
		},
		defaultValue: {
			status: offer.status,
			quantity: offer.quantity,
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})
	return (
		<FormProvider context={form.context}>
			<fetcher.Form method="POST" {...getFormProps(form)}>
				<input type="hidden" name="id" value={offer.id} />
				<Label htmlFor={fields.status.id}>Status</Label>
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
					inputProps={{ ...getInputProps(fields.quantity, { type: 'number' }) }}
					errors={fields.quantity.errors}
				/>
				<Button size="sm" name="intent" value={editActionIntent} type="submit">
					Save
				</Button>
				<ErrorList errors={form.errors} />
			</fetcher.Form>
		</FormProvider>
	)
}

function DeleteForm({ offerId }: { offerId: string }) {
	const fetcher = useFetcher<typeof deleteAction>({ key: `delete-${offerId}` })
	return (
		<fetcher.Form method="POST">
			<input type="hidden" name="offerId" value={offerId} />
			<Button
				style={{
					opacity: fetcher.formData?.get('offerId') === offerId ? 0.5 : 1,
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

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				403: ({ error }) => (
					<p>You are not allowed to do that: {error?.data.message}</p>
				),
			}}
		/>
	)
}
