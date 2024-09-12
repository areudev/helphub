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
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
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

const ItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	categoryId: z.string(),
	quantity: z.number(),
})

const DeleteItemSchema = z.object({
	itemId: z.string(),
})

const deleteActionIntent = 'delete'
const editActionIntent = 'edit'

async function deleteAction({
	formData,
}: {
	request: Request
	formData: FormData
}) {
	const submission = parseWithZod(formData, { schema: DeleteItemSchema })
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}
	const { itemId } = submission.value
	console.log('to delete', itemId)
	await prisma.item.delete({ where: { id: itemId } })
	console.log('deleted')
	return json({ result: submission.reply() })
}

async function editAction({ formData }: { formData: FormData }) {
	const submission = parseWithZod(formData, { schema: ItemSchema })
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}
	const { id, name, categoryId, quantity } = submission.value

	await prisma.item.update({
		where: { id },
		data: {
			name,
			categoryId,
			inventory: {
				update: {
					quantity,
				},
			},
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
			return editAction({ formData })
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 })
		}
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')

	const items = await prisma.item.findMany({
		include: {
			inventory: true,
			category: true,
		},
	})

	const categories = await prisma.category.findMany()

	return json({ items, categories })
}
function ItemRow({
	item,
	categories,
}: {
	item: {
		id: string
		name: string
		category: {
			id: string
			name: string
		}
		inventory: {
			quantity: number
		} | null
	}
	categories: {
		id: string
		name: string
	}[]
}) {
	return (
		<TableRow className="text-center" key={item.id}>
			<TableCell className="font-medium">{item.name}</TableCell>
			<TableCell className="text-center">{item.category.name}</TableCell>
			<TableCell className="text-center">
				{item.inventory?.quantity || 0}
			</TableCell>
			<TableCell className="flex justify-center gap-2">
				<Popover>
					<PopoverTrigger asChild>
						<Button size="sm" variant={'secondary'}>
							Edit
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80">
						<h4 className="text-body-md">Edit {item.name}</h4>
						<EditForm item={item} categories={categories} />
					</PopoverContent>
				</Popover>

				<DeleteForm itemId={item.id} />
			</TableCell>
		</TableRow>
	)
}

function EditForm({
	item,
	categories,
}: {
	item: {
		id: string
		name: string
		category: {
			id: string
			name: string
		}
		inventory: {
			quantity: number
		} | null
	}
	categories: {
		id: string
		name: string
	}[]
}) {
	const fetcher = useFetcher<typeof editAction>({ key: `edit-${item.id}` })
	const [form, fields] = useForm({
		id: `edit-${item.id}`,
		constraint: getZodConstraint(ItemSchema),
		lastResult: fetcher.data?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ItemSchema })
		},
		defaultValue: {
			name: item.name,
			categoryId: item.category.id,
			quantity: item.inventory?.quantity || 0,
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})
	return (
		<FormProvider context={form.context}>
			<fetcher.Form method="POST" {...getFormProps(form)}>
				<input type="hidden" name="id" value={item.id} />
				<Field
					labelProps={{ children: 'Item Name' }}
					inputProps={{ ...getInputProps(fields.name, { type: 'text' }) }}
					errors={fields.name.errors}
				/>
				<Label htmlFor={fields.categoryId.id}>Category</Label>
				<SelectField
					label="Category"
					name="categoryId"
					options={categories.map((category) => ({
						value: category.id,
						label: category.name,
					}))}
				/>
				<ErrorList errors={fields.categoryId.errors} />
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

function DeleteForm({ itemId }: { itemId: string }) {
	const fetcher = useFetcher<typeof deleteAction>({ key: `delete-${itemId}` })
	return (
		<fetcher.Form method="POST">
			<input type="hidden" name="itemId" value={itemId} />
			<Button
				style={{
					opacity: fetcher.formData?.get('itemId') === itemId ? 0.5 : 1,
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
export default function AdminWarehouseRoute() {
	const { items, categories } = useLoaderData<typeof loader>()
	const [searchTerm, setSearchTerm] = useState('')

	const filteredItems = items.filter((item) =>
		item.name.toLowerCase().includes(searchTerm.toLowerCase()),
	)

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-6 text-3xl font-bold">Warehouse Management</h1>

			<div className="mb-4 flex flex-col gap-4 sm:flex-row">
				<Input
					type="text"
					placeholder="Search items..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
				<Button asChild>
					<Link to="/supplies/new">Create Item</Link>
				</Button>
				<Button asChild>
					<Link to="/supplies/new-category">Create or Edit Category</Link>
				</Button>
			</div>

			<div className="overflow-x-auto">
				<Table>
					<TableCaption>A list of all items in the warehouse.</TableCaption>
					<TableHeader className="text-center">
						<TableRow>
							<TableHead className="text-center">Item Name</TableHead>
							<TableHead className="text-center">Category</TableHead>
							<TableHead className="text-center">Quantity</TableHead>
							<TableHead className="text-center">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredItems.map((item) => (
							<ItemRow item={item} key={item.id} categories={categories} />
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
