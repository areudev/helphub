import { Outlet } from '@remix-run/react'

export default function SuppliesLayout() {
	// const navigation = useNavigation()
	// const isLoading = navigation.state !== 'idle'
	return (
		<div className="container py-4">
			{/* {isLoading ? <LoaderCircle /> : <Outlet />} */}
			<Outlet />
		</div>
	)
}
