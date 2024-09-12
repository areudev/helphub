import { FormProvider, getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Checkbox } from '#app/components/ui/checkbox.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
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

const UserSchema = z.object({
	id: z.string(),
	roles: z.array(z.string()),
})

const editActionIntent = 'edit'

async function editAction({ formData }: { formData: FormData }) {
	const submission = parseWithZod(formData, { schema: UserSchema })
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}
	const { id, roles } = submission.value

	await prisma.user.update({
		where: { id },
		data: {
			roles: {
				set: roles.map((roleId) => ({ id: roleId })),
			},
		},
	})

	return json({ result: submission.reply() })
}

export const action = async ({ request }: ActionFunctionArgs) => {
	await requireUserWithRole(request, 'admin')
	const formData = await request.formData()
	const intent = formData.get('intent')
	switch (intent) {
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

	const users = await prisma.user.findMany({
		include: {
			roles: true,
		},
	})

	const roles = await prisma.role.findMany()

	return json({ users, roles })
}

function UserRow({
	user,
	roles,
}: {
	user: {
		id: string
		username: string
		email: string
		roles: { id: string; name: string }[]
	}
	roles: {
		id: string
		name: string
	}[]
}) {
	return (
		<TableRow key={user.id}>
			<TableCell>{user.username}</TableCell>
			<TableCell>{user.email}</TableCell>
			<TableCell>{user.roles.map((role) => role.name).join(', ')}</TableCell>
			<TableCell>
				<Popover>
					<PopoverTrigger asChild>
						<Button size="sm" variant="secondary">
							Edit Roles
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80">
						<h4 className="text-body-md">Edit Roles for {user.username}</h4>
						<EditForm user={user} roles={roles} />
					</PopoverContent>
				</Popover>
			</TableCell>
		</TableRow>
	)
}

function EditForm({
	user,
	roles,
}: {
	user: {
		id: string
		roles: { id: string; name: string }[]
	}
	roles: {
		id: string
		name: string
	}[]
}) {
	const fetcher = useFetcher<typeof editAction>({ key: `edit-${user.id}` })
	const [form, fields] = useForm({
		id: `edit-${user.id}`,
		constraint: getZodConstraint(UserSchema),
		lastResult: fetcher.data?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: UserSchema })
		},
		defaultValue: {
			roles: user.roles.map((role) => role.id),
		},
		shouldRevalidate: 'onInput',
	})

	return (
		<FormProvider context={form.context}>
			<fetcher.Form method="POST" {...getFormProps(form)}>
				<input type="hidden" name="id" value={user.id} />
				{roles.map((role) => (
					<div key={role.id}>
						<Label>
							<Checkbox
								id={role.id}
								name={fields.roles.name}
								value={role.id}
								defaultChecked={user.roles.some((r) => r.id === role.id)}
								className="mr-2"
							/>
							{role.name}
						</Label>
					</div>
				))}
				<Button size="sm" name="intent" value={editActionIntent} type="submit">
					Save
				</Button>
				<ErrorList errors={form.errors} />
			</fetcher.Form>
		</FormProvider>
	)
}

export default function AdminUsersRoute() {
	const { users, roles } = useLoaderData<typeof loader>()
	const [searchTerm, setSearchTerm] = useState('')

	const filteredUsers = users.filter(
		(user) =>
			user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase()),
	)

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-6 text-3xl font-bold">User Management</h1>

			<div className="mb-4">
				<Input
					type="text"
					placeholder="Search users..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-md"
				/>
			</div>

			<div className="overflow-x-auto">
				<Table>
					<TableCaption>A list of all users.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Username</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Roles</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredUsers.map((user) => (
							<UserRow user={user} key={user.id} roles={roles} />
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
