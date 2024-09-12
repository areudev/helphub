export default function AboutRoute() {
	return (
		<div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold sm:text-4xl">About Help Hub</h1>

			<section className="space-y-4">
				<h2 className="text-2xl font-semibold sm:text-3xl">Our Mission</h2>
				<p className="text-lg leading-relaxed">
					In the aftermath of a natural disaster, every second counts.
					DisasterAid Hub streamlines the process of requesting and providing
					aid, ensuring that those affected receive the help they need as
					quickly as possible. Our platform facilitates communication and
					coordination between citizens, rescuers, and the central aid base,
					making relief efforts more efficient and effective.
				</p>
			</section>

			<section className="space-y-4">
				<h2 className="text-2xl font-semibold sm:text-3xl">Key Features</h2>
				<ul className="list-disc space-y-2 pl-6 text-lg">
					<li>Easy aid request creation for citizens</li>
					<li>Donation offers for surplus items</li>
					<li>Real-time map view for situational awareness</li>
					<li>Task management for rescuers</li>
					<li>Announcements from the central aid base</li>
					<li>Inventory management at the base warehouse</li>
				</ul>
			</section>

			<section className="space-y-4">
				<h2 className="text-2xl font-semibold sm:text-3xl">How It Works</h2>
				<ol className="list-decimal space-y-2 pl-6 text-lg">
					<li>
						Citizens create an account and submit aid requests or donation
						offers
					</li>
					<li>Rescuers view requests and offers on the map and accept tasks</li>
					<li>Rescuers pick up and deliver items, updating task status</li>
					<li>
						The base manages inventory and makes announcements for needed items
					</li>
				</ol>
			</section>

			<section className="space-y-4">
				<h2 className="text-2xl font-semibold sm:text-3xl">Contact Us</h2>
				<p className="text-lg">
					If you have any questions or would like to contribute to DisasterAid
					Hub, please reach out to us:
				</p>
				<ul className="space-y-2 text-lg">
					<li>
						Email:{' '}
						<a href="mailto:info@disasteraidhub.org" className="underline">
							info@disasteraidhub.org
						</a>
					</li>
					<li>
						Phone:{' '}
						<a href="tel:+11234567890" className="underline">
							(123) 456-7890
						</a>
					</li>
					<li>Address: 123 Relief Road, Anytown, USA</li>
				</ul>
			</section>

			<footer className="border-t pt-8 text-center text-sm">
				<p>&copy; 2024 DisasterAid Hub. All rights reserved.</p>
			</footer>
		</div>
	)
}
