import { Link } from '@remix-run/react'
import { Button } from '#app/components/ui/button.js'

export default function VehiclePage() {
	return (
		<div>
			<h1>Your vehicle</h1>
			<p>
				You can add your vehicle to your profile to make it easier for others to
				find you.
			</p>
			<div>
				<Button asChild>
					<Link to="new">Add vehicle</Link>
				</Button>
				<Button asChild>
					<Link to="edit">Edit vehicle</Link>
				</Button>
			</div>
		</div>
	)
}
