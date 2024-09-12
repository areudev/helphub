import { type LoaderFunctionArgs, json } from '@remix-run/node'

export async function loader({}: LoaderFunctionArgs) {
	return json({})
}

export default function TasksIndex() {
	return (
		<div>
			<div className="hidden md:block">
				<h2>Select one of the tasks to view details</h2>
			</div>
		</div>
	)
}
