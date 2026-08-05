import { jwtVerify, createRemoteJWKSet } from "jose";

const GOOGLE_JWKS = createRemoteJWKSet(
    new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

async function verifyFirebaseToken(request, projectId) {
    const authHeader = request.headers.get("Authorization") || "";
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) throw new Error("missing_token");

    await jwtVerify(match[1], GOOGLE_JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId
    });
}

let cachedToken = null;
let tokenExpiry = 0;

async function getSpotifyToken(clientId, clientSecret) {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(`${clientId}:${clientSecret}`)
        },
        body: "grant_type=client_credentials"
    });
    if (!res.ok) throw new Error(`Échec de l'authentification Spotify : ${res.status}`);
    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 5000;
    return cachedToken;
}

function jsonResponse(body, status = 200) {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://remi-f930.github.io",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (status === 204 || status === 205 || status === 304) {
        return new Response(null, { status, headers });
    }

    return new Response(JSON.stringify(body), { status, headers });
}

async function appelerSpotify(url, token) {
    const spotifyRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (spotifyRes.status === 429) {
        const retryAfterHeader = spotifyRes.headers.get("Retry-After");
        return jsonResponse(
            {
                error: "rate_limited",
                retryAfter: retryAfterHeader ? parseInt(retryAfterHeader) : null,
                message: retryAfterHeader
                    ? `Trop de requêtes, réessaie dans ${retryAfterHeader}s`
                    : "Trop de requêtes, réessaie plus tard (délai inconnu)"
            },
            429
        );
    }
    if (!spotifyRes.ok) {
        const errorData = await spotifyRes.json().catch(() => ({}));
        return jsonResponse({ error: errorData?.error?.message || "Erreur Spotify" }, spotifyRes.status);
    }
    const data = await spotifyRes.json();
    return jsonResponse(data);
}

export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            return jsonResponse({}, 204);
        }

        // === Le fix : on rejette tout appel sans token Firebase valide ===
        try {
            await verifyFirebaseToken(request, env.FIREBASE_PROJECT_ID);
        } catch {
            return jsonResponse({ error: "unauthorized" }, 401);
        }

        const url = new URL(request.url);
        try {
            const token = await getSpotifyToken(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);

            const albumMatch = url.pathname.match(/^\/album\/([a-zA-Z0-9]+)\/tracks$/);
            if (albumMatch) {
                return await appelerSpotify(
                    `https://api.spotify.com/v1/albums/${albumMatch[1]}/tracks?limit=50`,
                    token
                );
            }

            const query = url.searchParams.get("q");
            const offset = url.searchParams.get("offset") || "0";
            if (!query) return jsonResponse({ error: "Paramètre 'q' manquant" }, 400);
            if (query.length > 100) return jsonResponse({ error: "Requête trop longue" }, 400);

            return await appelerSpotify(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=10&offset=${offset}`,
                token
            );
        } catch (err) {
            console.error(err);
            return jsonResponse({ error: "Erreur interne du proxy" }, 500);
        }
    }
};