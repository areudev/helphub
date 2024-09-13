import {
	FormProvider,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	json,
	redirect,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { VehicleStatus } from '#app/utils/status.ts'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const userId = await requireUserWithRole(request, 'rescuer')
	const vehicle = await prisma.vehicle.findUnique({
		where: { userId },
		select: {
			name: true,
			capacity: true,
			currentLoad: true,
			status: true,
			latitude: true,
			longitude: true,
			id: true,
		},
	})

	invariantResponse(vehicle, 'Vehicle not found', { status: 404 })

	return json({ vehicle })
}
const VehicleSchema = z.object({
	name: z.string().min(1),
	status: VehicleStatus.optional(),
	capacity: z.number().int().positive(),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
})

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserWithRole(request, 'rescuer')
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: VehicleSchema.superRefine(async (data, ctx) => {
			// both lang and lat are optional, but if one is provided, the other must be too
			if (
				(data.latitude && !data.longitude) ||
				(!data.latitude && data.longitude)
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Both latitude and longitude must be provided',
					path: ['latitude'],
				})
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	const { latitude, longitude, capacity, name } = submission.value

	await prisma.vehicle.update({
		where: { userId },
		select: { id: true },
		data: { latitude, longitude, capacity, name },
	})

	return redirect(`/users/${userId}/vehicle`)
}
export default function VehicleEditPage() {
	const loaderData = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const [form, fields] = useForm({
		id: 'new-vehicle',
		constraint: getZodConstraint(VehicleSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: VehicleSchema })
		},
		defaultValue: {
			name: loaderData.vehicle.name,
			capacity: loaderData.vehicle.capacity,
			status: loaderData.vehicle.status,
			latitude: loaderData.vehicle.latitude,
			longitude: loaderData.vehicle.longitude,
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})

	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<div className="mx-auto max-w-2xl rounded-lg border bg-card p-5 shadow-md">
				<h2 className="mb-8 text-body-lg font-semibold">Add your vehicle</h2>
				<FormProvider context={form.context}>
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
						<Field
							labelProps={{ children: 'Latitude' }}
							inputProps={{
								...getInputProps(fields.latitude, { type: 'number' }),
							}}
							errors={fields.latitude.errors}
						/>
						<Field
							labelProps={{ children: 'Longitude' }}
							inputProps={{
								...getInputProps(fields.longitude, { type: 'number' }),
							}}
							errors={fields.longitude.errors}
						/>
						<Button type="submit">Edit</Button>
					</Form>
				</FormProvider>
			</div>
		</div>
	)
}
