import {
	FormProvider,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '#app/components/ui/popover.tsx'
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
} from '#app/components/ui/table.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

const AnnouncementSchema = z.object({
	id: z.string(),
	content: z.string().min(1, 'Content is required'),
})

const DeleteAnnouncementSchema = z.object({
	announcementId: z.string(),
})

const deleteActionIntent = 'delete'
const editActionIntent = 'edit'

async function deleteAction({
	formData,
}: {
	request: Request
	formData: FormData
}) {
	const submission = parseWithZod(formData, {
		schema: DeleteAnnouncementSchema,
	})
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}
	const { announcementId } = submission.value
	await prisma.announcement.delete({ where: { id: announcementId } })
	return json({ result: submission.reply() })
}

async function editAction({ formData }: { formData: FormData }) {
	const submission = parseWithZod(formData, { schema: AnnouncementSchema })
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}
	const { id, content } = submission.value

	await prisma.announcement.update({
		where: { id },
		data: { content },
	})

	return json({ result: submission.reply() })
}

export const action = async ({ request }: ActionFunctionArgs) => {
	await requireUserWithRole(request, 'admin')
	const formData = await request.formData()
	const intent = formData.get('intent')
	switch (intent) {
		case deleteActionIntent: {
			return deleteAction({ request, formData })
		}
		case editActionIntent: {
			return editAction({ formData })
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 })
		}
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')

	const announcements = await prisma.announcement.findMany({
		include: {
			items: {
				include: {
					item: true,
				},
			},
		},
	})

	return json({ announcements })
}

function AnnouncementRow({
	announcement,
}: {
	announcement: {
		id: string
		content: string
		items: {
			item: {
				name: string
			}
			quantity: number
		}[]
	}
}) {
	return (
		<TableRow className="text-center" key={announcement.id}>
			<TableCell className="font-medium">{announcement.content}</TableCell>
			<TableCell className="text-center">
				{announcement.items.map((item) => (
					<div key={item.item.name}>
						{item.item.name}: {item.quantity}
					</div>
				))}
			</TableCell>
			<TableCell className="flex justify-center gap-2">
				<Popover>
					<PopoverTrigger asChild>
						<Button size="sm" variant={'secondary'}>
							Edit
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80">
						<h4 className="text-body-md">Edit Announcement</h4>
						<EditForm announcement={announcement} />
					</PopoverContent>
				</Popover>

				<DeleteForm announcementId={announcement.id} />
			</TableCell>
		</TableRow>
	)
}

function EditForm({
	announcement,
}: {
	announcement: {
		id: string
		content: string
	}
}) {
	const fetcher = useFetcher<typeof editAction>({
		key: `edit-${announcement.id}`,
	})
	const [form, fields] = useForm({
		id: `edit-${announcement.id}`,
		constraint: getZodConstraint(AnnouncementSchema),
		lastResult: fetcher.data?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: AnnouncementSchema })
		},
		defaultValue: {
			content: announcement.content,
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})
	return (
		<FormProvider context={form.context}>
			<fetcher.Form method="POST" {...getFormProps(form)}>
				<input type="hidden" name="id" value={announcement.id} />
				<Field
					labelProps={{ children: 'Announcement Content' }}
					inputProps={{ ...getInputProps(fields.content, { type: 'text' }) }}
					errors={fields.content.errors}
				/>
				<Button size="sm" name="intent" value={editActionIntent} type="submit">
					Save
				</Button>
				<ErrorList errors={form.errors} />
			</fetcher.Form>
		</FormProvider>
	)
}

function DeleteForm({ announcementId }: { announcementId: string }) {
	const fetcher = useFetcher<typeof deleteAction>({
		key: `delete-${announcementId}`,
	})
	return (
		<fetcher.Form method="POST">
			<input type="hidden" name="announcementId" value={announcementId} />
			<Button
				style={{
					opacity:
						fetcher.formData?.get('announcementId') === announcementId
							? 0.5
							: 1,
				}}
				type="submit"
				name="intent"
				value={deleteActionIntent}
				size="sm"
				variant="destructive"
			>
				Delete
			</Button>
		</fetcher.Form>
	)
}

export default function AdminAnnouncementsRoute() {
	const { announcements } = useLoaderData<typeof loader>()
	const [searchTerm, setSearchTerm] = useState('')

	const filteredAnnouncements = announcements.filter((announcement) =>
		announcement.content.toLowerCase().includes(searchTerm.toLowerCase()),
	)

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-6 text-3xl font-bold">Announcements Management</h1>

			<div className="mb-4 flex flex-col gap-4 sm:flex-row">
				<Input
					type="text"
					placeholder="Search announcements..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
				<Button asChild>
					<Link to="/announcements/new">Create Announcement</Link>
				</Button>
			</div>

			<div className="overflow-x-auto">
				<Table>
					<TableCaption>A list of all announcements.</TableCaption>
					<TableHeader className="text-center">
						<TableRow>
							<TableHead className="text-center">Content</TableHead>
							<TableHead className="text-center">Requested Items</TableHead>
							<TableHead className="text-center">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredAnnouncements.map((announcement) => (
							<AnnouncementRow
								announcement={announcement}
								key={announcement.id}
							/>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				403: ({ error }) => (
					<p>You are not allowed to do that: {error?.data.message}</p>
				),
			}}
		/>
	)
}
