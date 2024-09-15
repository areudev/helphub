import { faker } from '@faker-js/faker'
import { promiseHash } from 'remix-utils/promise'
import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'
import {
	cleanupDb,
	createPassword,
	createUser,
	getUserImages,
	img,
} from '#tests/db-utils.ts'
import { insertGitHubUser } from '#tests/mocks/github.ts'
import dummyData from './dummy.json'

const dummyPositions = [
	{ latitude: 38.246639, longitude: 21.734573 },
	{ latitude: 38.27973314738955, longitude: 21.76889308222365 },
	{ latitude: 38.30827797135121, longitude: 21.807143999339814 },
	{ latitude: 38.20870136926265, longitude: 21.767370300348965 },
	{ latitude: 38.18577825500854, longitude: 21.700383421056245 },
	{ latitude: 38.1708438469576, longitude: 21.456267194043285 },
	{ latitude: 38.14066837382343, longitude: 21.555111748474655 },
	{ latitude: 38.10500834226745, longitude: 21.469817848568383 },
	{ latitude: 38.053167419998864, longitude: 21.381434744395275 },
	{ latitude: 38.04201844526803, longitude: 21.44969778773879 },
	{ latitude: 38.10708738646101, longitude: 21.784023610957185 },
	{ latitude: 38.19156326787096, longitude: 21.804957707743004 },
	{ latitude: 38.16364804395653, longitude: 21.728546449944645 },
	{ latitude: 38.04385242421566, longitude: 21.695519592963727 },
	{ latitude: 38.12047969949003, longitude: 21.931236961346837 },
	{ latitude: 38.0572184796295, longitude: 21.75111428266655 },
	{ latitude: 38.07589562278406, longitude: 21.798747841082463 },
	{ latitude: 38.28100027635493, longitude: 21.769112715730387 },
	{ latitude: 38.32906341952424, longitude: 21.875268341747745 },
	{ latitude: 38.10001342424383, longitude: 21.69444438302358 },
	{ latitude: 38.165689175271204, longitude: 21.40856538588409 },
	{ latitude: 37.97863076399102, longitude: 21.319388822999468 },
	{ latitude: 37.95301050305902, longitude: 21.93009442982505 },
]
const kodyPosition = dummyPositions[0]
const rescuerPositions = dummyPositions.slice(1, 6)
const userPositions = dummyPositions.slice(6)

async function seed() {
	console.log('🌱 Seeding...')
	console.time(`🌱 Database has been seeded`)

	console.time('🧹 Cleaned up the database...')
	await cleanupDb(prisma)
	console.timeEnd('🧹 Cleaned up the database...')

	const warehousePosition: [number, number] = [
		38.24200983952633, 21.736916818180042,
	]
	console.time('🏢 Created base...')
	await prisma.base.create({
		data: {
			latitude: warehousePosition[0],
			longitude: warehousePosition[1],
		},
	})
	console.timeEnd('🏢 Created base...')

	console.time('🔑 Created permissions...')
	const entities = ['user']
	const actions = ['create', 'read', 'update', 'delete']
	const accesses = ['own', 'any'] as const

	let permissionsToCreate = []
	for (const entity of entities) {
		for (const action of actions) {
			for (const access of accesses) {
				permissionsToCreate.push({ entity, action, access })
			}
		}
	}
	await prisma.permission.createMany({ data: permissionsToCreate })
	console.timeEnd('🔑 Created permissions...')

	console.time('👑 Created roles...')
	await prisma.role.create({
		data: {
			name: 'admin',
			permissions: {
				connect: await prisma.permission.findMany({
					select: { id: true },
					where: { access: 'any' },
				}),
			},
		},
	})
	await prisma.role.create({
		data: {
			name: 'user',
			permissions: {
				connect: await prisma.permission.findMany({
					select: { id: true },
					where: { access: 'own' },
				}),
			},
		},
	})
	await prisma.role.create({
		data: {
			name: 'rescuer',
			permissions: {
				connect: await prisma.permission.findMany({
					select: { id: true },
					where: { access: 'own' },
				}),
			},
		},
	})
	console.timeEnd('👑 Created roles...')

	console.time('📦 Created categories, items, and announcements...')
	for (const category of dummyData.categories) {
		await prisma.category.create({
			data: {
				id: category.id,
				name: category.name,
				items: {
					create: dummyData.items
						.filter((item) => item.categoryId === category.id)
						.map((item) => ({
							id: item.id,
							name: item.name,
							inventory: {
								create: { quantity: faker.number.int({ min: 30, max: 60 }) },
							},
							details: {
								create: item.details.map((detail) => ({
									detailName: detail.detail_name,
									detailValue: detail.detail_value,
								})),
							},
						})),
				},
			},
		})
	}
	for (const announcement of dummyData.announcements) {
		await prisma.announcement.create({
			data: {
				id: announcement.id,
				content: announcement.content,
				items: {
					create: announcement.items.map((item) => ({
						item: { connect: { id: item.itemId } },
						quantity: item.quantity,
					})),
				},
			},
		})
	}
	console.timeEnd('📦 Created categories, items, and announcements...')

	const totalUsers = 16
	const totalRescuers = 3
	console.time(
		`👤 Created ${totalUsers} users and ${totalRescuers} rescuers...`,
	)

	const userImages = await getUserImages()

	for (let index = 0; index < totalUsers; index++) {
		const userData = createUser()
		const offerOrRequest = faker.number.int({ min: 0, max: 1 })

		// Randomly select an announcement
		const randomAnnouncement = faker.helpers.arrayElement(
			dummyData.announcements,
		)

		// Randomly select an item from the announcement's items
		const randomAnnouncementItem = faker.helpers.arrayElement(
			randomAnnouncement.items,
		)

		await prisma.user
			.create({
				select: { id: true },
				data: {
					...userData,
					latitude: userPositions[index]?.latitude,
					longitude: userPositions[index]?.longitude,
					password: { create: createPassword(userData.username) },
					image: { create: userImages[index % userImages.length] },
					roles: { connect: { name: 'user' } },
					...(offerOrRequest === 0
						? {
								offers: {
									create: {
										quantity: faker.number.int({
											min: 1,
											max: randomAnnouncementItem.quantity,
										}),
										announcement: {
											connect: { id: randomAnnouncement.id },
										},
										item: {
											connect: { id: randomAnnouncementItem.itemId },
										},
									},
								},
							}
						: {
								requests: {
									create: {
										itemId: faker.helpers.arrayElement(dummyData.items).id,
										quantity: faker.number.int({ min: 1, max: 6 }),
										numberOfPeople: faker.number.int({ min: 1, max: 5 }),
										notes: faker.lorem.paragraph(),
									},
								},
							}),
				},
			})
			.catch((e) => {
				console.error('Error creating a user:', e)
				return null
			})
	}

	for (let index = 0; index < totalRescuers; index++) {
		const rescuerData = createUser()
		const request = await prisma.request.findFirstOrThrow({
			select: { id: true },
			where: { task: { is: null } },
		})

		const offer = await prisma.offer.findFirstOrThrow({
			select: { id: true },
			where: { task: { is: null } },
		})

		await prisma.user
			.create({
				select: { id: true },
				data: {
					...rescuerData,
					latitude: rescuerPositions[index]?.latitude,
					longitude: rescuerPositions[index]?.longitude,
					vehicle: {
						create: {
							name: faker.vehicle.model(),
							capacity: faker.number.int({ min: 1, max: 10 }),
							status: 'available',
						},
					},
					password: { create: createPassword(rescuerData.username) },
					image: { create: userImages[index % userImages.length] },
					roles: { connect: [{ name: 'rescuer' }, { name: 'user' }] },
					tasks: {
						createMany: {
							data: [
								{ requestId: request.id, status: 'pending' },
								{ offerId: offer.id, status: 'pending' },
							],
						},
					},
				},
			})
			.catch((e) => {
				console.error('Error creating a rescuer:', e)
				return null
			})
	}
	console.timeEnd(
		`👤 Created ${totalUsers} users and ${totalRescuers} rescuers...`,
	)

	console.time(`🐨 Created admin user "kody"`)

	const kodyImages = await promiseHash({
		kodyUser: img({ filepath: './tests/fixtures/images/user/kody.png' }),
	})

	const githubUser = await insertGitHubUser(MOCK_CODE_GITHUB)

	await prisma.user.create({
		select: { id: true },
		data: {
			email: 'kody@kcd.dev',
			username: 'kody',
			name: 'Kody',
			latitude: kodyPosition?.latitude,
			longitude: kodyPosition?.longitude,
			vehicle: {
				create: {
					name: 'Mothership',
					capacity: 420,
					status: 'available',
				},
			},
			image: { create: kodyImages.kodyUser },
			password: { create: createPassword('kodylovesyou') },
			connections: {
				create: { providerName: 'github', providerId: githubUser.profile.id },
			},
			roles: {
				connect: [{ name: 'admin' }, { name: 'rescuer' }, { name: 'user' }],
			},
		},
	})
	console.timeEnd(`🐨 Created admin user "kody"`)

	console.timeEnd(`🌱 Database has been seeded`)
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

// we're ok to import from the test directory in this file
/*
eslint
	no-restricted-imports: "off",
*/
