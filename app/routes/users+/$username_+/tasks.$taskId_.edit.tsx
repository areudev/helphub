import {
	FormProvider,
	getFormProps,
	getTextareaProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
	type ActionFunctionArgs,
	json,
	redirect,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, TextareaField } from '#app/components/forms.tsx'
import { SelectField } from '#app/components/select-field.tsx'
import { Button } from '#app/components/ui/button.js'
import { Label } from '#app/components/ui/label.js'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { TaskStatus } from '#app/utils/status.ts'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
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
			rescuer: {
				select: { username: true, id: true, latitude: true, longitude: true },
			},

			request: {
				select: { user: { select: { latitude: true, longitude: true } } },
			},
			offer: {
				select: { user: { select: { latitude: true, longitude: true } } },
			},
		},
	})

	invariantResponse(task, 'Not found', { status: 404 })

	if (task.rescuerId !== userId) {
		throw redirect(`/`)
	}

	const taskUser = task.offerId ? task.offer?.user : task.request?.user

	const distance =
		taskUser &&
		task.rescuer.latitude &&
		task.rescuer.longitude &&
		taskUser.latitude &&
		taskUser.longitude
			? calculateDistance(
					task.rescuer.latitude,
					task.rescuer.longitude,
					taskUser.latitude,
					taskUser.longitude,
				)
			: Infinity

	const canComplete = distance < 500
	return json({ task, canComplete })
}

const TaskEditSchema = z.object({
	taskId: z.string(),
	description: z.string().optional(),
	status: TaskStatus,
})

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: TaskEditSchema.superRefine(async (data, ctx) => {
			if (!data.taskId) return

			const task = await prisma.task.findUnique({
				select: { id: true },
				where: { id: data.taskId, rescuerId: userId },
			})

			if (!task) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Task not found',
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

	const { taskId, description, status } = submission.value

	const task = await prisma.task.findUnique({
		where: { id: taskId },
		select: {
			id: true,
			status: true,
			offerId: true,
			requestId: true,
			offer: { select: { itemId: true, quantity: true } },
			request: { select: { itemId: true, quantity: true } },
		},
	})

	invariantResponse(task, 'Task not found', { status: 404 })

	if (task.status !== 'completed' && status === 'completed') {
		if (task.offerId) {
			await prisma.inventory.update({
				where: { itemId: task.offer?.itemId },
				data: { quantity: { increment: task.offer?.quantity } },
			})
		} else if (task.requestId) {
			await prisma.inventory.update({
				where: { itemId: task.request!.itemId },
				data: { quantity: { decrement: task.request!.quantity } },
			})
		}
	}

	const updatedTask = await prisma.task.update({
		where: { id: taskId },
		data: { description, status },
		select: { id: true, rescuer: { select: { username: true } } },
	})

	return redirect(
		`/users/${updatedTask.rescuer.username}/tasks/${updatedTask.id}`,
	)
}

export default function TaskEdit() {
	const { task, canComplete } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const [form, fields] = useForm({
		id: 'task-edit-form',
		lastResult: actionData?.result,
		constraint: getZodConstraint(TaskEditSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: TaskEditSchema })
		},
		defaultValue: {
			status: task.status,
			taskId: task.id,
			description: task.description,
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})
	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<div className="mx-auto max-w-2xl rounded-lg border bg-card p-5 shadow-md">
				<h2 className="mb-8 text-body-md font-bold">
					Edit task with id <span className="text-foreground">{task.id}</span>
				</h2>
				<FormProvider context={form.context}>
					<Form method="POST" {...getFormProps(form)}>
						<input type="hidden" name="taskId" value={task.id} />
						<Label htmlFor={fields.status.id}>Status</Label>
						<SelectField
							name={fields.status.name}
							label="Status"
							options={['pending', 'in_progress', 'completed'].map(
								(status) => ({
									value: status,
									label: status,
									disabled: status === 'completed' && !canComplete,
								}),
							)}
						/>
						<ErrorList errors={fields.status.errors} />

						<TextareaField
							labelProps={{ children: 'Description' }}
							textareaProps={{
								...getTextareaProps(fields.description),
							}}
							errors={fields.description.errors}
						/>
						<div className="flex gap-2">
							<Button type="submit">Submit</Button>
							<Button type="button" variant="secondary" asChild>
								<Link to={`/users/${task.rescuer.username}/tasks/${task.id}`}>
									Cancel
								</Link>
							</Button>
						</div>
						<ErrorList errors={form.errors} />
					</Form>
				</FormProvider>
			</div>
		</div>
	)
}

function toRadians(degrees: number): number {
	return degrees * (Math.PI / 180)
}

export function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371 // Earth's radius in km
	const dLat = toRadians(lat2 - lat1)
	const dLon = toRadians(lon2 - lon1)
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) *
			Math.cos(toRadians(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	const distance = R * c
	return distance * 1000 // Convert to meters
}
