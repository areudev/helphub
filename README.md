# HelpHub

University course project: Web-based disaster relief platform. Simulates
streamlined emergency response, resource allocation, and volunteer coordination.
Includes mock updates, interactive maps, and mobile-friendly interface.
Demonstrates practical application of web development skills in crisis
management scenarios.

## Development

### Install Depedencies:

`npm install`

### Initial setup:

`npm run setup`

### Run the app:

`npm run start:mocks`

### Development server:

`npm run dev`

This starts your app in development mode, rebuilding assets on file changes.

The database seed script creates a new user with some data you can use to get
started:

Username: kody Password: kodylovesyou

For logging with the other generated users just use their username as username
and password

## Database Schema

![database schema](./database.png)

## Application Route Structure

```
/ (root)
│
├── *
├── about
├── announcements
│   ├── index
│   └── new
├── privacy
├── supplies
│   ├── index
│   ├── new-category
│   │   └── index
│   └── new
├── support
├── tos
├── auth
│   └── :provider
│       └── callback
├── forgot-password
├── login
├── logout
├── onboarding
│   └── :provider
├── reset-password
├── signup
├── verify
├── robots.txt
├── sitemap.xml
├── admin
│   ├── announcements
│   ├── maps
│   ├── offers
│   ├── requests
│   ├── tasks
│   ├── users
│   ├── warehouse
│   ├── cache
│   │   ├── lru
│   │   │   └── :cacheKey
│   │   └── sqlite
│   │       └── :cacheKey
├── me
├── rescuer
│   ├── map
│   ├── offers
│   └── requests
├── resources
│   ├── download-user-data
│   ├── healthcheck
│   ├── theme-switch
│   └── user-images
│       └── :imageId
├── settings
│   └── profile
│       ├── change-email
│       ├── connections
│       ├── index
│       ├── location
│       ├── password
│       │   └── create
│       ├── photo
│       └── two-factor
│           ├── disable
│           ├── index
│           └── verify
└── users
    ├── index
    └── :username
        ├── index
        ├── offers
        │   ├── index
        │   ├── :offerId
        │   └── new
        ├── requests
        │   ├── index
        │   ├── :requestId
        │   └── new
        ├── tasks
        │   ├── index
        │   ├── :taskId
        │   └── :taskId/edit
        └── vehicle
            ├── index
            ├── edit
            └── new
```

## Tech Stack

- Frontend

  - React and Remix: The app uses React as the primary frontend library, evident
    from the use of React components and hooks throughout the codebase.
  - Tailwind CSS: Used for styling the application, as seen in the tailwind.css
    file and the use of Tailwind classes in components.

- Backend

  - Node.js and Express: The app uses Node.js and Express as the backend
    framework, evident from the use of Express routes and middleware in the
    server.js file.

- Database

  - SQLite: Used as the database, as seen in the data.db file.

- Authentication

  - Custom authentication system using sessions and passwords, with support for
    roles and permissions.

## App Screenshots

These are some screenshots of the app. To see more, run the app locally.

#### Landing

![landing](./md_images/landing.png)

#### Login

![login](./md_images/Login.jpeg)

#### Signup

![signup](./md_images/Sign-Up.jpeg)

#### OTP

![otp](./md_images/otp.jpeg)

#### On Boarding

![onboarding](./md_images/onboarding.jpeg)

#### Set or Add Location

![add-location](./md_images/add-location.jpeg)

#### Profile

![profile](./md_images/profile.jpeg)

#### Profile Settings

![profile](./md_images/profile-settings.jpeg)

#### Requests

![requests](./md_images/requests.jpeg)

#### Offers

![offers](./md_images/offers.jpeg)

#### Requests

![tasks](./md_images/tasks.jpeg)

#### Rescuer Map

![rescuer-map](./md_images/rescuer-map.jpeg)

#### Dashboard Maps

![dashboard-maps](./md_images/dashboard-maps.jpeg)

#### Dashboard

![dashboard](./md_images/dashboard.jpeg)

#### Supplies

![supplies](./md_images/supplies.jpeg)

#### Announcements

![announcements](./md_images/announcements.jpeg)

#### Search Users

![search](./md_images/searchusers.jpeg)

## Thanks

Run the app locally to see more! You rock 🪨
