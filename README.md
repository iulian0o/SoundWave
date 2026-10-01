# SoundWave

A full-stack streaming music application (Spotify clone), with real time connections built with **React + Typescript** on the frontend and **Express + MongoDB** on the backend, using **Clerk** for authentification and **Websockets** for real time message connections, **Redis** for caching playback state and volume state, **CI** pipeline for features testing before merging and **Docker** for creating images that instantiates a container such that it solves "it runs on my computer" problem.

## How's like to use SoundWave?

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
- rate limiter using `redis` for song sharing

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

---
*This README reflects progress only, setup and usage instructions will be added once the app is closer to complete.*
