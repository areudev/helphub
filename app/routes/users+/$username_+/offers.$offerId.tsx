import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { formatDistanceToNow } from 'date-fns'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ params }: LoaderFunctionArgs) {
	const offer = await prisma.offer.findUnique({
		where: { id: params.offerId },
		select: {
			id: true,
			announcementId: true,
			itemId: true,
			item: { select: { name: true } },
			announcement: { select: { content: true } },
			quantity: true,
			userId: true,
			status: true,
			notes: true,
			updatedAt: true,
		},
	})

	invariantResponse(offer, 'Not found', { status: 404 })

	const date = new Date(offer.updatedAt)
	const timeAgo = formatDistanceToNow(date)

	return json({
		offer,
		timeAgo,
	})
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-offer'),
	offerId: z.string(),
})

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteFormSchema,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { offerId } = submission.value

	const offer = await prisma.offer.findFirst({
		select: {
			id: true,
			userId: true,
			user: { select: { username: true } },
			announcement: { select: { id: true } },
			item: { select: { id: true } },
		},
		where: { id: offerId },
	})

	invariantResponse(offer, 'Not found', { status: 404 })

	const isOwner = offer.userId === userId
	console.log('isOwner', isOwner)

	if (!isOwner) {
		throw json({ error: 'Unauthorized' }, { status: 403 })
	}

	await prisma.offer.delete({ where: { id: offer.id } })

	return redirectWithToast(`/users/${offer.user.username}/offers`, {
		type: 'success',
		title: 'Success',
		description: 'Your offer has been deleted.',
	})
}

export default function OfferRoute() {
	const data = useLoaderData<typeof loader>()
	const user = useOptionalUser()
	const canDelete = user?.id === data.offer.userId

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<Card className="overflow-hidden">
				<CardHeader className="bg-primary">
					<CardTitle className="text-body-md text-primary-foreground">
						Offer Details
					</CardTitle>
					<CardDescription className="text-body-lg font-semibold text-primary-foreground">
						{data.offer.item.name}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 p-6">
					<div className="flex items-center justify-between">
						<span className="text-lg font-semibold">Quantity:</span>
						<Badge variant="secondary" className="text-body-sm">
							{data.offer.quantity}
						</Badge>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-lg font-semibold">Status:</span>
						<Badge
							className="text-body-sm"
							variant={
								data.offer.status !== 'declined' ? 'secondary' : 'destructive'
							}
						>
							{/* "pending", "approved", "received" */}
							{data.offer.status}
						</Badge>
					</div>
					<div className="rounded-lg bg-muted p-4">
						<h4 className="mb-2 font-semibold">Announcement:</h4>
						<p className="text-muted-foreground">
							{data.offer.announcement.content}
						</p>
					</div>
					{data.offer.notes && (
						<div className="rounded-lg bg-muted p-4">
							<h4 className="mb-2 font-semibold">Notes:</h4>
							<p className="text-muted-foreground">{data.offer.notes}</p>
						</div>
					)}
					<div className="flex items-center justify-between text-sm text-muted-foreground">
						<span>Last updated:</span>
						<span>{data.timeAgo} ago</span>
					</div>
				</CardContent>
				<CardFooter className="bg-card p-6">
					{canDelete ? <DeleteOffer id={data.offer.id} /> : null}
				</CardFooter>
			</Card>
		</div>
	)
}

function DeleteOffer({ id }: { id: string }) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [form] = useForm({
		id: 'delete-offer',
		lastResult: actionData?.result,
	})

	return (
		<Form method="POST" {...getFormProps(form)}>
			<input type="hidden" name="offerId" value={id} />
			<StatusButton
				type="submit"
				name="intent"
				value="delete-offer"
				variant="destructive"
				status={isPending ? 'pending' : (form.status ?? 'idle')}
				disabled={isPending}
			>
				<div className="flex items-center justify-center gap-2">
					<span>Delete</span>
					<Icon name="trash" size="sm" />
				</div>
			</StatusButton>
			<ErrorList errors={form.errors} id={form.errorId} />
		</Form>
	)
}
