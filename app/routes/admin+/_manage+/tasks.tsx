import { LoaderFunctionArgs, json } from '@remix-run/node'

export async function loader({ request }: LoaderFunctionArgs) {
	return json({})
}

export default function ManageTasks() {
	return <div>Manage Tasks</div>
}
