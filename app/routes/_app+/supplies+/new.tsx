import {
	FormProvider,
	getFieldsetProps,
	getFormProps,
	getInputProps,
	useForm,
	type FieldMetadata,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
	redirect,
} from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { SelectField } from '#app/components/select-field.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'

const DetailFieldsetSchema = z
	.object({
		detailName: z
			.string()
			.min(1, 'Detail Name is required if Detail Value is provided')
			.max(255)
			.optional(),
		detailValue: z
			.string()
			.min(1, 'Detail Value is required if Detail Name is provided')
			.max(255)
			.optional(),
	})
	.refine(
		(data) =>
			(data.detailName && data.detailValue) ||
			(!data.detailName && !data.detailValue),
		{
			message: 'Both Detail Name and Detail Value must be provided together',
		},
	)

export type DetailFieldset = z.infer<typeof DetailFieldsetSchema>

const NewItemSchema = z.object({
	name: z.string({ required_error: 'Name is required' }).trim().min(1).max(255),
	category: z.string({ required_error: 'Category is required' }).min(1),
	quantity: z.number({ required_error: 'Quantity is required' }).min(1),
	details: z.array(DetailFieldsetSchema).max(5).optional(),
})

function isValidDetail(
	detail: Partial<DetailFieldset>,
): detail is Required<DetailFieldset> {
	return (
		typeof detail.detailName === 'string' &&
		detail.detailName.trim() !== '' &&
		typeof detail.detailValue === 'string' &&
		detail.detailValue.trim() !== ''
	)
}

export async function action({ request }: ActionFunctionArgs) {
	await requireUserId(request)
	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		schema: () =>
			NewItemSchema.superRefine(async ({ category }, ctx) => {
				// if (intent !== null) return { ...data }

				const categoryId = await prisma.category.findUnique({
					where: {
						id: category,
					},
					select: {
						id: true,
					},
				})
				if (!categoryId) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Category not found',
					})
				}
			}).transform(({ details = [], ...data }) => ({
				...data,
				details: details.filter(isValidDetail),
			})),
		async: true,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { name, category, details, quantity } = submission.value

	try {
		await prisma.item.create({
			data: {
				name,
				categoryId: category,

				details: {
					create: details,
				},
				inventory: {
					create: {
						quantity,
					},
				},
			},
		})

		return redirect(`/supplies`)
	} catch (error) {
		console.error('Failed to create item:', error)
		return json(
			{
				result: submission.reply({
					formErrors: ['Failed to create item. Please try again.'],
				}),
			},
			{ status: 500 },
		)
	}
}
export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	const categories = await prisma.category.findMany({
		select: {
			id: true,
			name: true,
		},
	})
	return json({ categories })
}
export default function AddItemRoute() {
	const actionData = useActionData<typeof action>()
	const { categories } = useLoaderData<typeof loader>()

	const [form, fields] = useForm({
		id: 'new-item',
		constraint: getZodConstraint(NewItemSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: NewItemSchema })
		},
		defaultValue: {
			details: [{}],
			quantity: 1,
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})

	const detailsList = fields.details.getFieldList()

	return (
		<div className="mx-auto max-w-xl rounded-lg border bg-card p-6 shadow-md">
			<h2 className="mb-6 text-center text-2xl font-bold">Add New Item</h2>
			<FormProvider context={form.context}>
				<Form
					method="POST"
					className="mx-auto flex flex-col gap-y-6"
					{...getFormProps(form)}
				>
					<div>
						<Label htmlFor={fields.category.id}>Category</Label>
						<SelectField
							name={fields.category.name}
							label="Choose Category"
							options={categories.map((category) => ({
								value: category.id,
								label: category.name,
							}))}
						/>

						<Button size={'sm'} variant="secondary" asChild>
							<Link to="/supplies/new-category">
								Add New Category Or Modify Existing
							</Link>
						</Button>
					</div>
					<Field
						labelProps={{ children: 'Quantity' }}
						inputProps={{
							...getInputProps(fields.quantity, { type: 'number' }),
							min: 1,
						}}
						errors={fields.quantity.errors}
					/>
					<Field
						labelProps={{ children: 'Item Name' }}
						inputProps={{
							...getInputProps(fields.name, { type: 'text' }),
						}}
						errors={fields.name.errors}
					/>
					<div>
						<h3 className="mb-2 text-lg font-semibold">Item Details</h3>
						<ul className="space-y-4">
							{detailsList.map((detail, index) => (
								<li
									key={detail.key}
									className="relative border-b-2 border-muted-foreground"
								>
									<button
										className="absolute right-0 top-0 text-foreground-destructive"
										{...form.remove.getButtonProps({
											name: fields.details.name,
											index,
										})}
									>
										<span aria-hidden>
											<Icon name="trash" />
										</span>{' '}
										<span className="sr-only">Remove detail {index + 1}</span>
									</button>
									<DetailChooser meta={detail} />
								</li>
							))}
							<ErrorList
								id={fields.details.errorId}
								errors={fields.details.errors}
							/>
						</ul>
					</div>
					<Button
						{...form.insert.getButtonProps({ name: fields.details.name })}
						variant="secondary"
					>
						<Icon name="plus" className="mr-2" />
						Add More Details
					</Button>
					<Button type="submit">Add Item</Button>
					<ErrorList id={form.errorId} errors={form.errors} />
				</Form>
			</FormProvider>
		</div>
	)
}

function DetailChooser({ meta }: { meta: FieldMetadata<DetailFieldset> }) {
	const fields = meta.getFieldset()
	const { key: _, ...detailNameProps } = getInputProps(fields.detailName, {
		type: 'text',
	})
	const { key: __, ...detailValueProps } = getInputProps(fields.detailValue, {
		type: 'text',
	})
	return (
		<fieldset {...getFieldsetProps(meta)}>
			<div className="flex gap-3">
				<div className="flex-1">
					<Label htmlFor={fields.detailName.id}>Detail Name</Label>
					<Input {...detailNameProps} />
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList
							id={fields.detailName.errorId}
							errors={fields.detailName.errors}
						/>
					</div>
				</div>
				<div className="flex-1">
					<Label htmlFor={fields.detailValue.id}>Detail Value</Label>
					<Input {...detailValueProps} />
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList
							id={fields.detailValue.errorId}
							errors={fields.detailValue.errors}
						/>
					</div>
				</div>
			</div>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				<ErrorList id={meta.errorId} errors={meta.errors} />
			</div>
		</fieldset>
	)
}
