# SoundWave

A full-stack streaming music application (Spotify clone), with real time connections built with **React + Typescript** on the frontend and **Express + MongoDB** on the backend, using **Clerk** for authentification and **Websockets** for real time message connections, **Redis** for caching playback state and volume state, **CI** pipeline for features testing before merging and **Docker** for creating images that instantiates a container such that it solves "it runs on my computer" problem.

## How's like to use SoundWave?

**1**. The familiar UI (Spotify look-alike) makes it eassier for a user to use this application. Responsive layout, cards, dialog and tabs and fast response from the functionability.


https://github.com/user-attachments/assets/f4dc4a6a-8355-4418-8b8f-7e30cd136961


**2**. Each user will have his own inputs memorised into cache memory. The playback state, volume state and queue will stay in the same place, each user left.


https://github.com/user-attachments/assets/605172ba-4d37-42dc-80f2-aaa9e05962a8


**3**. Real time message connection between users, makes the experience feel more connected to other people's taste, mood or thoughts. The message page has real time message response and real time sharing songs, palyable directly from the card.


https://github.com/user-attachments/assets/1b9d7501-0149-4d88-9f17-b8c360bad097


Rate limiter doe not allow sharing abuse. The user has to wait for the token to refresh.


https://github.com/user-attachments/assets/09caf436-50c4-48b0-b0b0-945c74e8b8a8


**4**. Better experience with the content needed, using the Search bar component to find your song or album of choice. 
**Functionall keys: Arrow Up, Arrow Down, Enter, Escape**.


https://github.com/user-attachments/assets/c82d352f-5f78-4a18-9fbe-30b103dbdc2e


**5**. CRUD operations: receive, create, update, patch or delete content. Admin has the possibility to upload an album or to add a song to the album, to update the nqame or the year of the song or to delete content. A regular user can send a request to become admin, justifying the reason, and the super admin can accept or deny the request.


https://github.com/user-attachments/assets/dfe60eef-298c-4eac-b1fa-578e3133c132


**6**. Unrelated path, access the 404 page that helps you to redirect back to the home page. Unauthorized access to the admin path is forbidden.


https://github.com/user-attachments/assets/2d0e8bd5-4f1c-4e05-bcb3-e7f764bdc59d


## Tech Stack

**Frontend**
- React 19 + TypeScript, bundled with Vite
- Tailwind CSS v4 + shadcn/ui for components
- Zustand for state management (auth, player, music, chat)
- Clerk (`@clerk/react`) for authentication (Google sign-in)
- Axios for API requests
- React Router for navigation
- react-resizable-panels for the resizable layout
- socket.io-client for fetching the request from database to display the message

**Backend**
- Express 5
- MongoDB with Mongoose
- Clerk (`@clerk/express`) for auth middleware and route protection
- Cloudinary for media storage (album covers, audio files)
- express-fileupload for handling uploads
- Socket.io, included for real-time features
- Redis, caches the playback state and volume state
- Cron, deletes temporary files saved from cloudinary, in 1h

## Progress So Far

### Backend
- Project setup with Express and environment configuration
- MongoDB connection with Mongoose models for `User`, `Song`, `Album`, and `Message`
- Signup logic tied to Clerk authentication
- Protected route middleware to guard authenticated endpoints
- Admin routes & controllers
- Album routes & controllers
- Song routes & controllers
- User routes & controllers
- Message routes & controller + song sharing
- A stats route has also been started
- Real time messaging using websockets (`socket.io` & `socket.io-client`)
- Caching volume and playback state using `redis`
- Rate limiter using `redis` for song sharing
- Admin request controllers

### Frontend
- Auth Provider wired up with Clerk, plus a Google sign-in button
- Auth callback page to sync the logged-in user with the backend
- Main layout with a resizable panel structure and left sidebar navigation
- Album page displaying an album's songs
- Home page with a featured section and song/album grids (with loading skeletons)
- Friends Activity component in the sidebar
- Full playback system:
  - Zustand stores for the music library and the player (`useMusicStore`, `usePlayerStore`)
  - Song playback and queue handling
  - Reusable Play Button component
  - Playback Controls component (play/pause, track navigation etc.) *updated with redis, no more localstorage*
  - Song stays at the time length the user left it
  - The time refresh to 0 when the song is changed and it's played again (fix)
- Admin Dashboard UI:
  - No need to refresh the page while creating a new album or song (fix)
- CI Automation Tests for production:
  - backend: { `db.test.js`: check database connection, 
              `admin.controller.test.js`: check the admin permisions and controlls, 
              `auth.middleware.test.js`: check the bridge between authorization and authentication,
              `socket.test.js`: checks the user online status, creating and deleteing a message }
  - frontend: {`AuthProvider.test.tsx`: check the page render when the auth fails or passes,
               `useAuthStore.test.ts`: check if admin is true or false and render the message set,
               `useChatStore.test.tsx`: check if messages are permitted to be sent or not
               `useMusciStore.test.tsx`: check if the status is correct after deteleing adding or fetching songs or albums }
- Playback State:
    - Storing the state of volume or playback state for each user Id using redis
- Chat UI:
    - real time connections and messages
    - display active users and chat history
    - display current time message (24h cycle - EU France)
    - Show current songs played by friends in real time
- ShareSongDialog:
    - real time song sharing via chat page
    - the content is playable from the dialog
    - rate limiter per song with a token and a cooldown for not overloading the sending content
- Queue Panel and Options:
    - cached queue memory for each user id
    - user can choose when to start the song in queue
    - dialog options on each song
- Search Bar:
    - list of matching items pops out of maximum 6 rows
    - display albums of song out of the album
    - mouse click, scrolls, arrows up and down, enter and escape keys works
    - album page redirects you to the album page
    - song redirects to the album page and starts playing in the playback state
- Request Admin Role:
    - user sends a request to super admin to become admin
    - super admin accepts or rejects
    - real time request and answer
    - field to justify the admin role
- 404 page:
    - every unrelated path guides user to this page so they go back to home page

---
*I do not own the content of the artists. This application it is not used in a commercial way, and the credits are shown in the name of the songs or artists*
