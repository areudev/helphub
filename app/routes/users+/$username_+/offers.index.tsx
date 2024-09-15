import { type LoaderFunctionArgs, json } from '@remix-run/node'

export async function loader({}: LoaderFunctionArgs) {
	return json({})
}

export default function OffersIndex() {
	return (
		<div>
			<div className="hidden md:block">
				<h2>Select one of the offers to view details</h2>
			</div>
		</div>
	)
}
