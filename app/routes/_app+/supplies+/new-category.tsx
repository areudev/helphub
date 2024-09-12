import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, json, redirect } from '@remix-run/node'
import { Outlet, Link, useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'

export const newCategorySchema = z.object({
	name: z.string({ required_error: 'Name is required' }).trim().min(1).max(255),
})

export async function loader() {
	return json({})
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: newCategorySchema.superRefine(async (data, ctx) => {
			const categoryId = await prisma.category.findUnique({
				select: { id: true },
				where: { name: data.name },
			})

			if (categoryId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Category already exists',
					path: ['name'],
				})
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		console.log('submission.reply()', submission.reply())
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { name } = submission.value

	try {
		await prisma.category.create({
			select: { id: true },
			data: {
				name,
			},
		})
	} catch (error) {
		console.error('Failed to create item:', error)
		return redirect('/supplies/new')
	}
	return json({ result: submission.reply() })
}

export default function NewCategoryRoute() {
	const fetcher = useFetcher<typeof action>({ key: 'new-category' })
	const [form, fields] = useForm({
		id: 'new-category',
		constraint: getZodConstraint(newCategorySchema),
		lastResult: fetcher.data?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: newCategorySchema })
		},

		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})

	return (
		<div className="mx-auto max-w-xl">
			<div className="rounded-lg border bg-card p-6 shadow-md">
				<h2 className="mb-6 text-center text-xl font-bold">Add New Category</h2>
				<fetcher.Form
					method="POST"
					action="/supplies/new-category"
					{...getFormProps(form)}
					className="flex flex-col gap-4"
				>
					<Field
						labelProps={{ children: 'New category' }}
						className="space-y-1"
						inputProps={{
							...getInputProps(fields.name, { type: 'text' }),
						}}
						errors={fields.name.errors}
					/>
					<div className="flex gap-2 self-end">
						<Button variant="secondary" asChild>
							<Link to="/supplies/new">Back to item form</Link>
						</Button>
						<Button type="submit">Create</Button>
					</div>
				</fetcher.Form>
			</div>
			<Outlet />
		</div>
	)
}
