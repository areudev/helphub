import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Outlet, useLoaderData, Link, NavLink } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import {
	Drawer,
	// DrawerClose,
	DrawerContent,
	DrawerTrigger,
} from '#app/components/ui/drawer.js'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'
import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ params }: LoaderFunctionArgs) {
	const username = params.username
	const owner = await prisma.user.findFirst({
		where: { username },
		select: {
			id: true,
			name: true,
			username: true,
			tasks: {
				select: {
					id: true,
					status: true,
					request: {
						select: {
							item: { select: { name: true } },
						},
					},
					offer: {
						select: {
							item: {
								select: { name: true },
							},
							announcement: {
								select: { content: true },
							},
						},
					},
				},
			},
		},
	})
	invariantResponse(owner, 'Owner not found', { status: 404 })

	return json({ owner })
}

export default function TasksRoute() {
	const user = useOptionalUser()
	const { owner } = useLoaderData<typeof loader>()
	const tasks = owner.tasks
	const isOwner = user?.id === owner.id
	return (
		<div>
			<Drawer>
				<div className="flex justify-center md:hidden">
					<DrawerTrigger asChild>
						<Button className="">
							{isOwner ? 'Click to view your tasks' : 'Click to view tasks'}
						</Button>
					</DrawerTrigger>
				</div>
				<div className="flex">
					<aside className="hidden md:block">
						<TaskList tasks={tasks} owner={owner} isOwner={isOwner} />
					</aside>
					<div className="md:hidden">
						<DrawerContent>
							<TaskList tasks={tasks} owner={owner} isOwner={isOwner} />
						</DrawerContent>
					</div>
					<main className="flex-grow p-4">
						<Outlet />
					</main>
				</div>
			</Drawer>
		</div>
	)
}

function TaskList({
	tasks,
	owner,
	isOwner,
}: {
	tasks: Array<{
		id: string
		status: string
		request: { item: { name: string } } | null
		offer: { item: { name: string }; announcement: { content: string } } | null
	}>
	owner: {
		username: string
		name: string | null
	}
	isOwner: boolean
}) {
	const ownerDisplayName = owner.name ?? owner.username

	return (
		<div className="p-4">
			<h2 className="mb-4 text-xl font-bold">
				{isOwner ? 'Your' : `${ownerDisplayName}'s`} Tasks
			</h2>
			{isOwner && (
				<Button asChild className="mb-4 w-full">
					<Link to="/rescuer/requests">Take a task</Link>
				</Button>
			)}
			{tasks.length === 0 ? (
				<p className="text-muted-foreground">No tasks yet</p>
			) : (
				<ul className="space-y-2">
					{tasks.map((task) => (
						<li key={task.id} className="rounded-md border p-2 hover:bg-accent">
							<NavLink
								to={`/users/${owner.username}/tasks/${task.id}`}
								className={({ isActive }) =>
									cn(
										'block rounded p-2',
										isActive ? 'underline underline-offset-2' : '',
									)
								}
							>
								<h3 className="font-semibold">
									{task.status === 'completed'
										? '✅ '
										: task.status === 'in_progress'
											? '🛻 '
											: '🔄 '}
									{task.request
										? `${task.request.item.name} Request`
										: `${task.offer?.item.name} Offer`}
								</h3>
							</NavLink>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
