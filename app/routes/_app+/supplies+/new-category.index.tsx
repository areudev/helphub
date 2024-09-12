import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Close } from '@radix-ui/react-popover'
import { type ActionFunctionArgs, json } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '#app/components/ui/popover.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { useIsClient } from '#app/utils/misc.tsx'

const CategorySchema = z.object({
	id: z.string(),
	name: z.string(),
})

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const intent = formData.get('intent')
	console.log('intent', intent)
	// if (intent === 'update-1') {
	// 	return json({})
	// }
	const submission = parseWithZod(formData, { schema: CategorySchema })

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	const { id, name } = submission.value

	await prisma.category.update({
		where: { id },
		data: { name },
	})

	return json({ result: submission.reply() })
}

export async function loader() {
	const categories = await prisma.category.findMany({
		select: { id: true, name: true },
	})
	return json({ categories })
}

type CategoryItemProps = {
	category: { id: string; name: string }
}

function CategoryItem({ category }: CategoryItemProps) {
	const isClient = useIsClient()
	const fetcher = useFetcher<typeof action>({
		key: `category-form-${category.id}`,
	})
	const [form, fields] = useForm({
		id: `category-form-${category.id}`,
		lastResult: fetcher.data?.result,
		constraint: getZodConstraint(CategorySchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: CategorySchema })
		},
	})

	const { key: _, ...inputProps } = getInputProps(fields.name, {
		type: 'text',
	})

	return (
		<li className="flex items-center justify-between border-b pb-2">
			<span className="text-lg">{category.name}</span>
			{isClient && (
				<Popover>
					<PopoverTrigger asChild>
						<Button size="sm" variant="outline">
							Edit
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80">
						<fetcher.Form method="POST" {...getFormProps(form)}>
							<input type="hidden" name="id" value={category.id} />
							<Field
								labelProps={{ children: 'Category Name' }}
								inputProps={{
									...inputProps,
									defaultValue: category.name,
								}}
							/>
							{/* <Popover */}

							<Close asChild>
								<Button
									name="intent"
									value={`update-${category.id}`}
									size="sm"
									type="submit"
								>
									Save
								</Button>
							</Close>
						</fetcher.Form>
					</PopoverContent>
				</Popover>
			)}
		</li>
	)
}

export default function NewCategoryIndex() {
	const { categories } = useLoaderData<typeof loader>()

	return (
		<div className="mt-6 rounded-md border bg-card p-3 shadow-md">
			<h3 className="mb-2 text-center text-xl font-semibold">
				Existing categories
			</h3>

			<ul className="space-y-2">
				{categories.map((category) => (
					<CategoryItem key={category.id} category={category} />
				))}
			</ul>
		</div>
	)
}
