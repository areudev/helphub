import {
	FormProvider,
	getFieldsetProps,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { SelectField } from '#app/components/select-field.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

const AnnouncementItemFieldSetSchema = z.object({
	itemId: z.string({ required_error: 'Category is required' }).min(1),
	quantity: z
		.number({ required_error: 'Quantity is required' })
		.min(1, 'Quantity must be at least 1'),
})

// type AnnouncementItemFieldSet = z.infer<typeof AnnouncementItemFieldSetSchema>
const AnnouncementSchema = z.object({
	content: z.string().min(1, 'Content is required'),
	items: z
		.array(AnnouncementItemFieldSetSchema)
		.min(1, 'At least one item is required'),
})

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')

	const items = await prisma.item.findMany({
		select: { id: true, name: true },
	})
	return json({ items })
}

export async function action({ request }: ActionFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		schema: AnnouncementSchema.superRefine(async (data, ctx) => {
			const items = await prisma.item.findMany({
				where: {
					id: {
						in: data.items.map((item) => item.itemId),
					},
				},
			})
			if (items.length !== data.items.length) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'One or more items not found',
				})
			}
		}),
		async: true,
	})

	console.log(submission.payload)
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	const { content, items } = submission.value

	await prisma.announcement.create({
		data: {
			content,
			items: {
				create: items.map((item) => ({
					item: { connect: { id: item.itemId } },
					quantity: item.quantity,
				})),
			},
		},
	})

	return json({ result: submission.reply() }, { status: 200 })
}

export default function NewAnnouncementRoute() {
	const { items: itemsData } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const [form, fields] = useForm({
		id: 'new-announcement-form',
		constraint: getZodConstraint(AnnouncementSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: AnnouncementSchema })
		},
		defaultValue: {
			items: [{}],
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})
	const { content, items } = fields
	const itemsList = items.getFieldList()
	return (
		<div className="mx-auto max-w-2xl rounded-lg border bg-card p-5 shadow-md">
			<h1 className="mb-8 text-h4 font-bold">Create New Announcement</h1>
			<FormProvider context={form.context}>
				<Form method="post" {...getFormProps(form)}>
					<div className="space-y-6">
						<Field
							labelProps={{ children: 'Announcement Content' }}
							inputProps={{
								...getInputProps(content, { type: 'text' }),
								placeholder: 'Enter announcement content',
							}}
							errors={content.errors}
						/>
						<div>
							<Label>Requested Items</Label>
							{itemsList.map((item, index) => {
								const itemFields = item.getFieldset()

								const { key: ___, ...quantityProps } = getInputProps(
									itemFields.quantity,
									{
										type: 'number',
									},
								)
								return (
									<li
										key={item.key}
										className="flex flex-col items-center gap-x-2 sm:flex-row"
									>
										<fieldset
											{...getFieldsetProps(fields.items)}
											className="flex-1"
										>
											<Label htmlFor={itemFields.itemId.id}>Item</Label>
											<SelectField
												className="min-w-48"
												name={itemFields.itemId.name}
												label="Select Item"
												options={itemsData.map((item) => ({
													value: item.id,
													label: item.name,
												}))}
											/>
										</fieldset>
										<Field
											labelProps={{ children: 'Quantity' }}
											className="max-w-34"
											errors={itemFields.quantity.errors}
											inputProps={{
												...quantityProps,
											}}
										/>
										<Button
											variant="destructive"
											size="icon"
											className="-mt-2"
											{...form.remove.getButtonProps({
												name: fields.items.name,
												index,
											})}
										>
											<Icon name="trash" />
										</Button>
									</li>
								)
							})}

							<ErrorList errors={fields.items.errors} />
							<Button
								variant={'secondary'}
								{...form.insert.getButtonProps({ name: items.name })}
								className="flex items-center gap-x-2"
							>
								<Icon name="plus" />
								<span>Add more Items</span>
							</Button>
						</div>

						<ErrorList id={form.errorId} errors={form.errors} />

						<Button type="submit">Create Announcement</Button>
					</div>
				</Form>
			</FormProvider>
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

// type SelectFieldProps = {
// 	name: FieldName<string>
// 	label: string
// 	options: Array<{ value: string; label: string }>
// }

// export function CustomSelect({ name, label, options }: SelectFieldProps) {
// 	const [meta] = useField(name)
// 	const control = useInputControl(meta)

// 	return (
// 		<div>
// 			<Select
// 				name={meta.name}
// 				value={control.value}
// 				onValueChange={(value) => {
// 					control.change(value)
// 				}}
// 				onOpenChange={(open) => {
// 					if (!open) {
// 						control.blur()
// 					}
// 				}}
// 			>
// 				<SelectTrigger className="">
// 					<SelectValue placeholder={label} />
// 				</SelectTrigger>
// 				<SelectContent>
// 					{options.map((option) => (
// 						<SelectItem key={option.value} value={option.value} className="">
// 							{option.label}
// 						</SelectItem>
// 					))}
// 				</SelectContent>
// 			</Select>
// 			<div className="min-h-[32px] px-4 pb-3 pt-1">
// 				<ErrorList errors={meta.errors} />
// 			</div>
// 		</div>
// 	)
// }
