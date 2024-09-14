import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
} from '@remix-run/node'
import { Form, redirect, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const userId = await requireUserWithRole(request, 'rescuer')
	const vehicle = await prisma.vehicle.findUnique({
		where: { userId },
		select: { id: true },
	})

	if (vehicle) {
		return redirectWithToast(`/users/${userId}/vehicle/edit`, {
			title: 'Vehicle already exists',
			description: 'You already have a vehicle',
		})
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
		select: { id: true },
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
				<Form method="POST" {...getFormProps(form)}>
					<Field
						labelProps={{ children: 'Name' }}
						inputProps={{
							...getInputProps(fields.name, { type: 'text' }),
						}}
						errors={fields.name.errors}
					/>
					<Field
						labelProps={{ children: 'Capacity' }}
						inputProps={{
							...getInputProps(fields.capacity, { type: 'number' }),
						}}
						errors={fields.capacity.errors}
					/>
					<Button type="submit">Create </Button>
				</Form>
			</div>
		</div>
	)
}
