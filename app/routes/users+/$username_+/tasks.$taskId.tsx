import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { formatDistanceToNow } from 'date-fns'
import { z } from 'zod'
import { ErrorList } from '#app/components/forms.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { Button } from '#app/components/ui/button.js'
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
	const task = await prisma.task.findUnique({
		where: { id: params.taskId },
		select: {
			id: true,
			rescuerId: true,
			offerId: true,
			requestId: true,
			description: true,
			status: true,
			updatedAt: true,
			rescuer: { select: { username: true } },
		},
	})

	invariantResponse(task, 'Not found', { status: 404 })

	const date = new Date(task.updatedAt)
	const timeAgo = formatDistanceToNow(date)
	// the task can have either a request or an offer
	//
	if (task.requestId) {
		const request = await prisma.request.findUnique({
			where: { id: task.requestId },
			select: {
				id: true,
				userId: true,
				user: { select: { username: true } },
				item: { select: { id: true, name: true } },
			},
		})
		return json({
			task,
			taskType: 'request',
			request,
			timeAgo,
		} as const)
	}

	invariantResponse(task.offerId, 'Not found', { status: 404 })
	const offer = await prisma.offer.findUnique({
		where: { id: task.offerId },
		select: {
			id: true,
			userId: true,
			user: { select: { username: true } },
			item: { select: { id: true, name: true } },
		},
	})
	return json({
		task,
		taskType: 'offer',
		offer,
		timeAgo,
	} as const)
}

const DeleteFormSchema = z.object({
	taskId: z.string(),
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

	const { taskId } = submission.value

	const task = await prisma.task.findFirst({
		select: {
			id: true,
			requestId: true,
			offerId: true,
			rescuer: { select: { username: true, id: true } },
		},
		where: { id: taskId },
	})

	invariantResponse(task, 'Not found', { status: 404 })

	const isOwner = task.rescuer.id === userId

	if (!isOwner) {
		throw json({ error: 'Unauthorized' }, { status: 403 })
	}

	await prisma.task.delete({ where: { id: task.id } })

	return redirectWithToast(`/users/${task.rescuer.username}/tasks`, {
		type: 'success',
		title: 'Success',
		description: 'Your request has been deleted.',
	})
}

export default function TaskRoute() {
	const data = useLoaderData<typeof loader>()
	const { task, taskType, timeAgo } = data
	const user = useOptionalUser()
	const canDelete = user?.id === task.rescuerId

	const todo = taskType === 'request' ? data.request : data.offer

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<Card className="overflow-hidden">
				<CardHeader className="bg-primary">
					<CardTitle className="text-body-md text-primary-foreground">
						Task Details
					</CardTitle>
					<CardDescription className="text-body-lg font-semibold text-primary-foreground">
						{taskType.toUpperCase()} for {todo?.item.name}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 p-6">
					<div className="flex items-center justify-between">
						<span className="text-lg font-semibold">Status:</span>
						<Badge className="text-body-sm">{task.status}</Badge>
					</div>

					<div className="flex items-center justify-between text-sm text-muted-foreground">
						<span>Last updated:</span>
						<span>{timeAgo} ago</span>
					</div>
				</CardContent>

				<CardFooter className="flex flex-col gap-2 bg-card p-6 sm:flex-row">
					<Button asChild>
						<Link to={`/users/${todo?.user.username}/${taskType}s/${todo?.id}`}>
							View the user {taskType}
						</Link>
					</Button>
					{canDelete ? <DeleteRequest id={data.task.id} /> : null}
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
			<input type="hidden" name="taskId" value={id} />
			<StatusButton
				type="submit"
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
