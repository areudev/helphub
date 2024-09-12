import {
	getFormProps,
	getInputProps,
	getTextareaProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'

const OfferSchema = z.object({
	itemId: z.string(),
	announcementId: z.string(),
	quantity: z
		.number({
			required_error: 'Quantity is required',
		})
		.int()
		.positive(),
	notes: z.string().max(10000).optional(),
})

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		schema: OfferSchema.superRefine(async (data, ctx) => {
			const item = await prisma.item.findUnique({
				where: { id: data.itemId },
				select: { id: true, inventory: true },
			})
			if (!item) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Item not found',
				})
			}

			const announcement = await prisma.announcement.findUnique({
				where: { id: data.announcementId },
				select: { id: true, content: true },
			})
			if (!announcement) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Announcement not found',
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

	const { itemId, announcementId, quantity, notes } = submission.value

	const offer = await prisma.offer.create({
		data: {
			itemId,
			announcementId,
			quantity,
			userId,
			notes,
		},
		select: { id: true, user: { select: { username: true } } },
	})

	return redirect(`/users/${offer.user.username}/offers/${offer.id}`)
}

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	const itemId = url.searchParams.get('itemId')
	const announcementId = url.searchParams.get('announcementId')

	if (!itemId || !announcementId) {
		return redirect('/announcements')
	}

	const item = await prisma.item.findUnique({
		where: { id: itemId },
		select: { id: true, name: true },
	})

	const announcement = await prisma.announcement.findUnique({
		where: { id: announcementId },
		select: { id: true, content: true },
	})

	if (!item || !announcement) {
		return redirect('/announcements')
	}

	return json({ item, announcement })
}

export default function NewOfferRoute() {
	const { item, announcement } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const [form, fields] = useForm({
		id: 'offer-form',
		constraint: getZodConstraint(OfferSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: OfferSchema })
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})

	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<div>
				<p className="text-body-md text-muted-foreground">
					Thank you for your generous consideration to donate{' '}
					<span className="text-foreground">{item.name}</span> in support of:
				</p>
				<h2 className="text-body-lg font-bold">{announcement.content}</h2>
				{/* <p className="text-body-md text-muted-foreground">
					Your kindness makes a real difference! 🌟 Please fill out the form
					below to make your offer. We'll review it promptly and get back to you
					soon. Together, we can make a positive impact! 💖
				</p> */}
			</div>

			<div className="mx-auto max-w-2xl rounded-lg border bg-card p-5 shadow-md">
				<h1 className="mb-8 text-h4 font-bold">Make your Offer</h1>
				<Form method="POST" {...getFormProps(form)}>
					<input type="hidden" name="itemId" value={item.id} />
					<input type="hidden" name="announcementId" value={announcement.id} />
					<div className="space-y-6">
						<Field
							labelProps={{ children: 'Quantity' }}
							inputProps={{
								...getInputProps(fields.quantity, { type: 'number' }),
							}}
							errors={fields.quantity.errors}
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
