import { type MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { Button } from '../../components/ui/button.tsx'

export const meta: MetaFunction = () => [{ title: 'Help Hub' }]

export default function Index() {
	return (
		<main className="grid h-full place-items-center">
			<div className="grid place-items-center px-4 py-16 xl:grid-cols-2 xl:gap-24">
				<div className="flex max-w-lg flex-col items-center text-center xl:order-2 xl:items-start xl:text-left">
					<a
						href="https://www.epicweb.dev/stack"
						className="animate-slide-top [animation-fill-mode:backwards] xl:animate-slide-left xl:[animation-delay:0.5s] xl:[animation-fill-mode:backwards]"
					>
						<svg
							className="size-20 text-foreground xl:-mt-4"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 65 65"
						>
							<path
								fill="currentColor"
								d="M39.445 25.555 37 17.163 65 0 47.821 28l-8.376-2.445Zm-13.89 0L28 17.163 0 0l17.179 28 8.376-2.445Zm13.89 13.89L37 47.837 65 65 47.821 37l-8.376 2.445Zm-13.89 0L28 47.837 0 65l17.179-28 8.376 2.445Z"
							></path>
						</svg>
					</a>
					<h1
						data-heading
						className="mt-8 animate-slide-top text-4xl font-medium text-foreground [animation-delay:0.3s] [animation-fill-mode:backwards] md:text-5xl xl:mt-4 xl:animate-slide-left xl:text-6xl xl:[animation-delay:0.8s] xl:[animation-fill-mode:backwards]"
					>
						Help<span className="font-bold text-orange-400">Hub</span>
					</h1>
					<h2 className="mt-6 animate-slide-top text-2xl font-semibold text-muted-foreground [animation-delay:0.8s] [animation-fill-mode:backwards] xl:mt-8 xl:animate-slide-left xl:text-2xl xl:leading-10 xl:[animation-delay:1s] xl:[animation-fill-mode:backwards]">
						Connecting Communities in Times of Crisis
					</h2>
					<p
						data-paragraph
						className="mt-2 animate-slide-top text-xl/7 text-muted-foreground [animation-delay:0.8s] [animation-fill-mode:backwards] xl:mt-2 xl:animate-slide-left xl:text-xl/6 xl:leading-10 xl:[animation-delay:1s] xl:[animation-fill-mode:backwards]"
					>
						Help Hub is a collaborative platform that enables efficient aid
						request and delivery during natural disasters. We connect citizens
						in need with rescuers and volunteers who can provide assistance.
					</p>
					<div className="flex animate-slide-top gap-4 text-xl/7 text-muted-foreground [animation-delay:1s] [animation-fill-mode:backwards] xl:mt-2 xl:animate-slide-left xl:text-xl/6 xl:leading-10 xl:[animation-delay:1.2s] xl:[animation-fill-mode:backwards]">
						<Button className="mt-6" asChild>
							<Link to="/supplies">Get Started</Link>
						</Button>
						<Button variant="secondary" className="mt-6" asChild>
							<Link to="/about">About</Link>
						</Button>
					</div>
				</div>
				<div className="mt-8 xl:order-1 xl:mt-0">
					<h2 className="animate-fade-in text-2xl font-semibold [animation-delay:1s] [animation-fill-mode:backwards]">
						Key Features
					</h2>
					<ul className="mt-4 animate-fade-in space-y-2 [animation-delay:1.2s] [animation-fill-mode:backwards]">
						<li className="">🆘 Easy aid request creation for citizens</li>
						<li className="">🎁 Donation offers for surplus items</li>
						<li className="">
							🗺️ Real-time map view for situational awareness
						</li>
						<li className="">📝 Task management for rescuers</li>
						<li className="">📢 Announcements from the central aid base</li>
						<li className="">📦 Inventory management at the base warehouse</li>
					</ul>
				</div>
			</div>
		</main>
	)
}
