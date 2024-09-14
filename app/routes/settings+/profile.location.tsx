import { type SEOHandle } from '@nasa-gcn/remix-seo'
import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { lazy, Suspense, useState } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { useGeolocation } from '#app/hooks/use-geolocation.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { patrasCenter } from '#app/utils/locations.ts'
import { type BreadcrumbHandle } from './profile.tsx'

export const handle: BreadcrumbHandle & SEOHandle = {
	breadcrumb: <Icon name="sewing-pin">Set location</Icon>,
	getSitemapEntries: () => null,
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { latitude: true, longitude: true, username: true },
	})
	return json({ userId, user })
}
export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)

	const formData = await request.formData()
	const latitude = formData.get('latitude')
	const longitude = formData.get('longitude')

	if (typeof latitude !== 'string' || typeof longitude !== 'string') {
		return json({ error: 'Invalid latitude or longitude' }, { status: 400 })
	}

	await prisma.user.update({
		where: { id: userId },
		data: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
	})

	return json({ success: true })
}

const LazyMap = lazy(() => import('#app/components/edit-map.tsx'))
export default function EditLocation() {
	const { user } = useLoaderData<typeof loader>()
	const { latitude, longitude, error, loading } = useGeolocation()
	const hasLocation = user?.latitude && user?.longitude
	const fetcher = useFetcher()

	const [pin, setPin] = useState<{
		latitude: number
		longitude: number
	}>(() => {
		if (user?.latitude && user?.longitude)
			return { latitude: user.latitude, longitude: user.longitude }
		return patrasCenter
	})
	console.log(pin)

	return (
		<div className="space-y-2">
			<h2 className="text-h4">{hasLocation ? 'Edit' : 'Set'} location</h2>
			{!hasLocation ? (
				<p className="text-body-md text-destructive">
					You not have set your location.
				</p>
			) : (
				<p className="text-body-md text-green-500">
					Your location is set you can edit it
				</p>
			)}
			<div>
				<p>
					You can set your location by clicking the use current location button
					if you enabled location access in your browser.
				</p>
				<p>
					You can also set your location by clicking on the map pin that
					defaults to Patras center
				</p>
				<p>
					After you set your location you can save it by clicking the save
					location button.
				</p>
			</div>

			<div className="light h-[500px]">
				<ClientOnly fallback={<p>Loading map...</p>}>
					{() => (
						<Suspense fallback={<div>Loading map...</div>}>
							<LazyMap initialPin={pin} setPin={setPin} />
						</Suspense>
					)}
				</ClientOnly>
			</div>
			<div className="flex gap-2 pt-2">
				<fetcher.Form method="post">
					<input type="hidden" name="latitude" value={pin.latitude} />
					<input type="hidden" name="longitude" value={pin.longitude} />
					<Button type="submit">Save Location</Button>
				</fetcher.Form>
				{!error && !loading ? (
					<Button
						variant="outline"
						onClick={() => {
							if (latitude && longitude) {
								setPin({ latitude, longitude })
							}
						}}
					>
						Use Current Location
					</Button>
				) : loading ? (
					<Button variant={'outline'} disabled>
						Loading current location...
					</Button>
				) : null}
			</div>
		</div>
	)
}
