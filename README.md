# ![Album Collection logo](./img/icon.png) Album Collection

Track your record collection — search for albums on Spotify and add the ones you own (or want) to your personal collection, sorted by CD or Vinyl.

**[Try it live →](https://remi-f930.github.io/Album_collection/)**

```https 
https://remi-f930.github.io/Album_collection/
```

![Album Collection screenshot](./screenshot.png)

## Features

- 🔍 Search any album available on Spotify
- 💿 Add albums to your collection as CD or Vinyl
- 🎧 Browse full tracklists with durations
- 🔐 Secure login with email verification

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
2. Set up a [Firebase project](https://console.firebase.google.com) and update `js/firebase_config.js` with your config
3. change the Spotify proxy configuration (see `spotify-proxy/src/index.js`) like the `"Access-Control-Allow-Origin" : `
4. Deploy the Spotify proxy Worker with your own Spotify API credentials
```bash
   cd spotify-proxy
   npm install
   wrangler deploy
```
5. Serve the project locally (e.g. VS Code Live Server)
```bash
   npx live-server
```
