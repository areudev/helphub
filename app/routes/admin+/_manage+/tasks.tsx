import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	const tasks = await prisma.task.findMany()
	return json({ tasks })
}

export default function ManageTasks() {
	const { tasks } = useLoaderData<typeof loader>()
	return (
		<div>
			<pre>{JSON.stringify(tasks, null, 2)}</pre>
		</div>
	)
}
