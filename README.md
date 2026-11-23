# ScienceKit server

The ScienceKit API and real-time collaboration server runs on Node.js 26 LTS (24+ remains supported), Express 5, Mongoose 9 and Socket.IO 4. Existing MongoDB collection names and the client's moment, concept, story and page response shapes are retained. Jade templates have moved to Pug, and database operations use promises.

The full application is containerized in [sciencekit](https://github.com/ah-cog/sciencekit). Start it with `npm run configure && npm start` from that checkout. Compose supplies MongoDB, the API, the browser client, health checks, and persistent media/database volumes. The API is exposed on http://localhost:3000 and the client on http://localhost:8080. Native apps use this same API.

For host development, start MongoDB and install dependencies:

```sh
npm ci
cp .env.example .env
npm start
```

`MONGODB_URI` selects the database; `PORT` defaults to 3000, `HOST` to 127.0.0.1. `SESSION_SECRET` makes browser sessions survive restarts. `CLIENT_DIR` points to the mobile repository's `www` directory if it is not an adjacent checkout. `CLIENT_URL` optionally redirects the API root to an independently served browser client. Video uploads require `ffmpeg` (included in the container); `FFMPEG_PATH` overrides its executable path.

Create an account at `/signup`, or seed a local account explicitly:

```sh
SEED_USERNAME=researcher SEED_PASSWORD='choose-a-local-password' npm run seed
```

`POST /api/session` accepts JSON `{ "username": "…", "password": "…" }` and returns an `access_token`. Send `Authorization: Bearer <token>` on API calls. `DELETE /api/session` revokes the token. Password hashes never appear in API responses. The historical authorization-code endpoints remain available for the registered local client; codes are single use.

Key endpoints: `/api/timeline`, `/api/entry/:id`, `/api/story`, `/api/page`, `/api/text`, `/api/question`, `/api/observation`, `/api/sequence`, `/api/collaboration`, `/api/identity`, `/api/reflection`, `/api/sketch`, `/api/photo`, and `/api/video`. Photos use multipart field `myphoto`; videos use `file`. Socket.IO clients answer `oauthrequesttoken` with `oauthtoken`; updates are published only to authenticated sockets.

```sh
npm test
```

The integration suite requires MongoDB on 127.0.0.1:27017. It creates a unique temporary database, validates authentication failures, empty timelines, entries and concepts, story ordering, media uploads, token revocation, and authenticated real-time delivery, then drops only that test database. Set `TEST_MONGODB_URI` to use a separate test server; its database is deleted after the run.
