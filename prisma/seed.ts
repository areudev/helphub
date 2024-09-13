import { faker } from '@faker-js/faker'
import { promiseHash } from 'remix-utils/promise'
import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'
import {
	cleanupDb,
	createPassword,
	createUser,
	getNoteImages,
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
	const entities = ['user', 'note']
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
								create: { quantity: faker.number.int({ min: 1, max: 10 }) },
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

	const totalUsers = 10
	const totalRescuers = 3
	console.time(
		`👤 Created ${totalUsers} users and ${totalRescuers} rescuers...`,
	)

	const noteImages = await getNoteImages()
	const userImages = await getUserImages()

	for (let index = 0; index < totalUsers; index++) {
		const userData = createUser()
		const offerOrRequest = faker.number.int({ min: 0, max: 1 })
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
										quantity: faker.number.int({ min: 1, max: 10 }),
										announcement: {
											connect: {
												id: faker.helpers.arrayElement(dummyData.announcements)
													.id,
											},
										},
										item: {
											connect: {
												id: faker.helpers.arrayElement(dummyData.items).id,
											},
										},
									},
								},
							}
						: {
								requests: {
									create: {
										itemId: faker.helpers.arrayElement(dummyData.items).id,
										quantity: faker.number.int({ min: 1, max: 10 }),
										numberOfPeople: faker.number.int({ min: 1, max: 5 }),
										notes: faker.lorem.paragraph(),
									},
								},
							}),

					// offers: {
					// 	create: Array.from({
					// 		length: faker.number.int({ min: 2, max: 5 }),
					// 	}).map(() => {
					// 		const announcement = faker.helpers.arrayElement(
					// 			dummyData.announcements,
					// 		)
					// 		const announcementItem = faker.helpers.arrayElement(
					// 			announcement.items,
					// 		)
					// 		return {
					// 			quantity: faker.number.int({
					// 				min: 1,
					// 				max: 10,
					// 			}),
					// 			announcement: {
					// 				connect: { id: announcement.id },
					// 			},
					// 			item: {
					// 				connect: { id: announcementItem.itemId },
					// 			},
					// 		}
					// 	}),
					// },
					// requests: {
					// 	create: Array.from({
					// 		length: faker.number.int({ min: 2, max: 5 }),
					// 	}).map(() => {
					// 		const item = faker.helpers.arrayElement(dummyData.items)
					// 		const quantity = faker.number.int({ min: 1, max: 10 })
					// 		const numberOfPeople = faker.number.int({ min: 1, max: 5 })
					// 		const note = faker.lorem.paragraph()
					// 		return {
					// 			itemId: item.id,
					// 			quantity,
					// 			numberOfPeople,
					// 			notes: note,
					// 		}
					// 	}),
					// },
					notes: {
						create: Array.from({
							length: faker.number.int({ min: 1, max: 3 }),
						}).map(() => ({
							title: faker.lorem.sentence(),
							content: faker.lorem.paragraphs(),
							images: {
								create: Array.from({
									length: faker.number.int({ min: 1, max: 3 }),
								}).map(() => {
									const imgNumber = faker.number.int({ min: 0, max: 9 })
									const img = noteImages[imgNumber]
									if (!img) {
										throw new Error(`Could not find image #${imgNumber}`)
									}
									return img
								}),
							},
						})),
					},
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
		cuteKoala: img({
			altText: 'an adorable koala cartoon illustration',
			filepath: './tests/fixtures/images/kody-notes/cute-koala.png',
		}),
		koalaEating: img({
			altText: 'a cartoon illustration of a koala in a tree eating',
			filepath: './tests/fixtures/images/kody-notes/koala-eating.png',
		}),
		koalaCuddle: img({
			altText: 'a cartoon illustration of koalas cuddling',
			filepath: './tests/fixtures/images/kody-notes/koala-cuddle.png',
		}),
		mountain: img({
			altText: 'a beautiful mountain covered in snow',
			filepath: './tests/fixtures/images/kody-notes/mountain.png',
		}),
		koalaCoder: img({
			altText: 'a koala coding at the computer',
			filepath: './tests/fixtures/images/kody-notes/koala-coder.png',
		}),
		koalaMentor: img({
			altText:
				'a koala in a friendly and helpful posture. The Koala is standing next to and teaching a woman who is coding on a computer and shows positive signs of learning and understanding what is being explained.',
			filepath: './tests/fixtures/images/kody-notes/koala-mentor.png',
		}),
		koalaSoccer: img({
			altText: 'a cute cartoon koala kicking a soccer ball on a soccer field ',
			filepath: './tests/fixtures/images/kody-notes/koala-soccer.png',
		}),
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
			notes: {
				create: [
					{
						id: 'd27a197e',
						title: 'Basic Koala Facts',
						content:
							'Koalas are found in the eucalyptus forests of eastern Australia. They have grey fur with a cream-coloured chest, and strong, clawed feet, perfect for living in the branches of trees!',
						images: { create: [kodyImages.cuteKoala, kodyImages.koalaEating] },
					},
					{
						id: '414f0c09',
						title: 'Koalas like to cuddle',
						content:
							'Cuddly critters, koalas measure about 60cm to 85cm long, and weigh about 14kg.',
						images: {
							create: [kodyImages.koalaCuddle],
						},
					},
					{
						id: '260366b1',
						title: 'Not bears',
						content:
							"Although you may have heard people call them koala 'bears', these awesome animals aren't bears at all – they are in fact marsupials. A group of mammals, most marsupials have pouches where their newborns develop.",
					},
					{
						id: 'bb79cf45',
						title: 'Snowboarding Adventure',
						content:
							"Today was an epic day on the slopes! Shredded fresh powder with my friends, caught some sick air, and even attempted a backflip. Can't wait for the next snowy adventure!",
						images: {
							create: [kodyImages.mountain],
						},
					},
					{
						id: '9f4308be',
						title: 'Onewheel Tricks',
						content:
							"Mastered a new trick on my Onewheel today called '180 Spin'. It's exhilarating to carve through the streets while pulling off these rad moves. Time to level up and learn more!",
					},
					{
						id: '306021fb',
						title: 'Coding Dilemma',
						content:
							"Stuck on a bug in my latest coding project. Need to figure out why my function isn't returning the expected output. Time to dig deep, debug, and conquer this challenge!",
						images: {
							create: [kodyImages.koalaCoder],
						},
					},
					{
						id: '16d4912a',
						title: 'Coding Mentorship',
						content:
							"Had a fantastic coding mentoring session today with Sarah. Helped her understand the concept of recursion, and she made great progress. It's incredibly fulfilling to help others improve their coding skills.",
						images: {
							create: [kodyImages.koalaMentor],
						},
					},
					{
						id: '3199199e',
						title: 'Koala Fun Facts',
						content:
							"Did you know that koalas sleep for up to 20 hours a day? It's because their diet of eucalyptus leaves doesn't provide much energy. But when I'm awake, I enjoy munching on leaves, chilling in trees, and being the cuddliest koala around!",
					},
					{
						id: '2030ffd3',
						title: 'Skiing Adventure',
						content:
							'Spent the day hitting the slopes on my skis. The fresh powder made for some incredible runs and breathtaking views. Skiing down the mountain at top speed is an adrenaline rush like no other!',
						images: {
							create: [kodyImages.mountain],
						},
					},
					{
						id: 'f375a804',
						title: 'Code Jam Success',
						content:
							'Participated in a coding competition today and secured the first place! The adrenaline, the challenging problems, and the satisfaction of finding optimal solutions—it was an amazing experience. Feeling proud and motivated to keep pushing my coding skills further!',
						images: {
							create: [kodyImages.koalaCoder],
						},
					},
					{
						id: '562c541b',
						title: 'Koala Conservation Efforts',
						content:
							"Joined a local conservation group to protect koalas and their habitats. Together, we're planting more eucalyptus trees, raising awareness about their endangered status, and working towards a sustainable future for these adorable creatures. Every small step counts!",
					},
					// extra long note to test scrolling
					{
						id: 'f67ca40b',
						title: 'Game day',
						content:
							"Just got back from the most amazing game. I've been playing soccer for a long time, but I've not once scored a goal. Well, today all that changed! I finally scored my first ever goal.\n\nI'm in an indoor league, and my team's not the best, but we're pretty good and I have fun, that's all that really matters. Anyway, I found myself at the other end of the field with the ball. It was just me and the goalie. I normally just kick the ball and hope it goes in, but the ball was already rolling toward the goal. The goalie was about to get the ball, so I had to charge. I managed to get possession of the ball just before the goalie got it. I brought it around the goalie and had a perfect shot. I screamed so loud in excitement. After all these years playing, I finally scored a goal!\n\nI know it's not a lot for most folks, but it meant a lot to me. We did end up winning the game by one. It makes me feel great that I had a part to play in that.\n\nIn this team, I'm the captain. I'm constantly cheering my team on. Even after getting injured, I continued to come and watch from the side-lines. I enjoy yelling (encouragingly) at my team mates and helping them be the best they can. I'm definitely not the best player by a long stretch. But I really enjoy the game. It's a great way to get exercise and have good social interactions once a week.\n\nThat said, it can be hard to keep people coming and paying dues and stuff. If people don't show up it can be really hard to find subs. I have a list of people I can text, but sometimes I can't find anyone.\n\nBut yeah, today was awesome. I felt like more than just a player that gets in the way of the opposition, but an actual asset to the team. Really great feeling.\n\nAnyway, I'm rambling at this point and really this is just so we can have a note that's pretty long to test things out. I think it's long enough now... Cheers!",
						images: {
							create: [kodyImages.koalaSoccer],
						},
					},
				],
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
