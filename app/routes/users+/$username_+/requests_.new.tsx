import {
	getFormProps,
	getInputProps,
	getTextareaProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	redirect,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'

const RequestSchema = z.object({
	itemId: z.string(),
	quantity: z
		.number({ required_error: 'Quantity is required' })
		.int()
		.positive(),
	numberOfPeople: z
		.number({ required_error: 'Number of people is required' })
		.int()
		.positive(),
	notes: z.string().max(10000).optional(),
})
export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const itemId = url.searchParams.get('itemId')

	if (!itemId) {
		return redirect('/supplies')
	}

	const item = await prisma.item.findUnique({
		where: {
			id: itemId,
		},
		select: { id: true, name: true },
	})
	if (!item) {
		return redirect('/supplies')
	}
	return json({ item })
}
export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		schema: RequestSchema.superRefine(async (data, ctx) => {
			const item = await prisma.item.findUnique({
				where: { id: data.itemId },
				select: { id: true },
			})
			if (!item) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Item not found',
				})
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}
	const { itemId, quantity, numberOfPeople, notes } = submission.value
	const requestItem = await prisma.request.create({
		data: {
			userId,
			itemId,
			quantity,
			numberOfPeople,
			notes,
			status: 'pending',
		},
		select: { id: true, user: { select: { username: true } } },
	})
	return redirect(
		`/users/${requestItem.user.username}/requests/${requestItem.id}`,
	)
}

export default function RequestNew() {
	const { item } = useLoaderData<typeof loader>()
	const [form, fields] = useForm({
		id: 'request-form',
		constraint: getZodConstraint(RequestSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: RequestSchema })
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})
	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<div className="mx-auto max-w-2xl rounded-lg border bg-card p-5 shadow-md">
				<h2 className="mb-8 text-body-lg font-bold">
					You are requesting{' '}
					<span className="text-foreground">{item.name}</span>
				</h2>
				<Form method="POST" {...getFormProps(form)}>
					<input type="hidden" name="itemId" value={item.id} />
					<div className="space-y-6">
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
						<TextareaField
							labelProps={{ children: 'Notes' }}
							textareaProps={{
								...getTextareaProps(fields.notes),
							}}
							errors={fields.notes.errors}
						/>
					</div>
					<Button type="submit">Submit</Button>
					<ErrorList id={form.errorId} errors={form.errors} />
				</Form>
			</div>
		</div>
	)
}
