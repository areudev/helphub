import {
	ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
} from '@remix-run/node'
import {
	Form,
	Link,
	redirect,
	useActionData,
	useLoaderData,
} from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { z } from 'zod'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useForm } from '@conform-to/react'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const userId = await requireUserWithRole(request, 'rescuer')
	const vehicle = await prisma.vehicle.findUnique({
		where: { userId },
		select: { id: true },
	})

	if (vehicle) {
		redirect(`/users/${userId}/vehicle/edit`)
	}
	// return json({ userId })
	return json({})
}

const VehicleSchema = z.object({
	name: z.string().min(1),
	capacity: z.number().int().positive(),
})

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithRole(request, 'rescuer')
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: VehicleSchema.superRefine(async (data, ctx) => {
			const vehicle = await prisma.vehicle.findFirst({
				where: { userId },
				select: { id: true },
			})

			if (vehicle) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'You already have a vehicle',
				})
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}
	const { capacity, name } = submission.value
	await prisma.vehicle.create({
		data: { userId, capacity, name, status: 'inactive' },
	})
	return redirect(`/users/${userId}/vehicle`)
}

export default function VehicleNewPage() {
	const actionData = useActionData<typeof action>()
	const [form, fields] = useForm({
		id: 'new-vehicle',
		constraint: getZodConstraint(VehicleSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: VehicleSchema })
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})

	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<div className="mx-auto max-w-2xl rounded-lg border bg-card p-5 shadow-md">
				<h2 className="mb-8 text-body-lg font-semibold">Add your vehicle</h2>
				<Form method="POST"></Form>
			</div>
		</div>
	)
}
