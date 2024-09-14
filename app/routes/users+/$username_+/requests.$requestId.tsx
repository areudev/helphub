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
import { getOfferOrRequestStatus } from '#app/utils/status.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ params }: LoaderFunctionArgs) {
	const requestItem = await prisma.request.findUnique({
		where: { id: params.requestId },
		select: {
			id: true,
			itemId: true,
			item: { select: { name: true } },
			quantity: true,
			userId: true,
			notes: true,
			numberOfPeople: true,
			updatedAt: true,
			task: { select: { status: true } },
		},
	})

	invariantResponse(requestItem, 'Not found', { status: 404 })

	const date = new Date(requestItem.updatedAt)
	const timeAgo = formatDistanceToNow(date)

	return json({
		requestItem,
		timeAgo,
	})
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-request'),
	requestId: z.string(),
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

	const { requestId } = submission.value

	const requestItem = await prisma.request.findFirst({
		select: {
			id: true,
			userId: true,
			user: { select: { username: true } },
			item: { select: { id: true } },
		},
		where: { id: requestId },
	})

	invariantResponse(requestItem, 'Not found', { status: 404 })

	const isOwner = requestItem.userId === userId

	if (!isOwner) {
		throw json({ error: 'Unauthorized' }, { status: 403 })
	}

	await prisma.request.delete({ where: { id: requestItem.id } })

	return redirectWithToast(`/users/${requestItem.user.username}/requests`, {
		type: 'success',
		title: 'Success',
		description: 'Your request has been deleted.',
	})
}

export default function OfferRoute() {
	const data = useLoaderData<typeof loader>()
	const user = useOptionalUser()
	const canDelete = user?.id === data.requestItem.userId

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<Card className="overflow-hidden">
				<CardHeader className="bg-primary">
					<CardTitle className="text-body-md text-primary-foreground">
						Request Details
					</CardTitle>
					<CardDescription className="text-body-lg font-semibold text-primary-foreground">
						{data.requestItem.item.name}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 p-6">
					<div className="flex items-center justify-between">
						<span className="text-lg font-semibold">Quantity:</span>
						<Badge variant="secondary" className="text-body-sm">
							{data.requestItem.quantity}
						</Badge>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-lg font-semibold">Status:</span>
						<Badge className="text-body-sm">
							{/* "pending", "approved", "received" */}
							{getOfferOrRequestStatus(data.requestItem.task?.status)}
						</Badge>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-lg font-semibold">Number of People:</span>
						<Badge className="text-body-sm">
							{data.requestItem.numberOfPeople}
						</Badge>
					</div>

					{data.requestItem.notes && (
						<div className="rounded-lg bg-muted p-4">
							<h4 className="mb-2 font-semibold">Notes:</h4>
							<p className="text-muted-foreground">{data.requestItem.notes}</p>
						</div>
					)}
					<div className="flex items-center justify-between text-sm text-muted-foreground">
						<span>Last updated:</span>
						<span>{data.timeAgo} ago</span>
					</div>
				</CardContent>
				<CardFooter className="bg-card p-6">
					{canDelete ? <DeleteRequest id={data.requestItem.id} /> : null}
				</CardFooter>
			</Card>
		</div>
	)
}

function DeleteRequest({ id }: { id: string }) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [form] = useForm({
		id: 'delete-request',
		lastResult: actionData?.result,
	})

	return (
		<Form method="POST" {...getFormProps(form)}>
			<input type="hidden" name="requestId" value={id} />
			<StatusButton
				type="submit"
				name="intent"
				value="delete-request"
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
