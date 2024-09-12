import { type LoaderFunctionArgs, json } from '@remix-run/node'

export async function loader({}: LoaderFunctionArgs) {
	return json({})
}

export default function RequestsIndex() {
	return (
		<div>
			<div className="hidden md:block">
				<h2>Select one of the requests to view details</h2>
			</div>
		</div>
	)
}
