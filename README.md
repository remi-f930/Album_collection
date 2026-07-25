# ![Album Collection logo](./img/icon.png) Album Collection

Track your record collection — search for albums on Spotify and add the ones you own (or want) to your personal collection, sorted by CD or Vinyl.

**[Try it live →](https://remi-f930.github.io/Album_collection/)**

```https 
https://remi-f930.github.io/Album_collection/
```

## Features

- 🔍 Search any album available on Spotify
- 💿 Add albums to your collection as CD or Vinyl
- 🎧 Browse full tracklists with durations
- 🔐 Secure login with email verification
- 🖥️📱 Supports every devices though this project was mainly made for smartphone and PC

## Tech Stack

- **Frontend**: JavaScript, HTML, CSS
- **Auth & Database**: Firebase Authentication, Firestore
- **API Proxy**: Cloudflare Workers (Wrangler)
- **Music Data**: Spotify Web API

## Running locally

>[!CAUTION]
>### This project relies on a Firebase project and a Spotify proxy Worker with private credentials. Running it fully locally requires setting up your own Firebase project, Spotify app, and Cloudflare Worker as well as possessing a premium Spotify account - see the source code for the required configuration points

1. Clone the repo
```bash
   git clone https://github.com/remi-f930/Album_collection.git
```
2. Set up a [Firebase project](https://console.firebase.google.com):

   - Enable Authentication (Email/Password) and Firestore
   - Copy your config into `js/firebase_config.js`
   - Add these Firestore rules:
```
   rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{userId}/{type}/{albumId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
```
3. Create a [Spotify app](https://developer.spotify.com/dashboard) to get a Client ID and Secret

4. Deploy your own Spotify proxy Worker

```bash
   cd spotify-proxy
   npm install
   wrangler secret put SPOTIFY_CLIENT_ID
   wrangler secret put SPOTIFY_CLIENT_SECRET
   wrangler deploy
```

5. Update `spotify_access.js` and `data_access.js` with your deployed Worker URL

6. In `spotify-proxy/src/index.js`, set `Access-Control-Allow-Origin` to match wherever you'll host/test the app (e.g. `http://127.0.0.1:8080` for local testing)

7. Serve the project locally
```bash
   npx live-server
```
