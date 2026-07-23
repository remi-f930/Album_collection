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

    if (!res.ok) {
        throw new Error(`Échec de l'authentification Spotify : ${res.status}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 5000;
    return cachedToken;
}

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}

export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            return jsonResponse({}, 204);
        }

        const url = new URL(request.url);

        try {
            const token = await getSpotifyToken(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);

            // Nouvelle route : /album/{id}/tracks
            const albumMatch = url.pathname.match(/^\/album\/([a-zA-Z0-9]+)\/tracks$/);
            if (albumMatch) {
                const albumId = albumMatch[1];
                const spotifyRes = await fetch(
                    `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (!spotifyRes.ok) {
                    const errorData = await spotifyRes.json().catch(() => ({}));
                    return jsonResponse({ error: errorData?.error?.message || "Erreur Spotify" }, spotifyRes.status);
                }

                const data = await spotifyRes.json();
                return jsonResponse(data);
            }

            // Route existante : recherche d'albums
            const query = url.searchParams.get("q");
            const offset = url.searchParams.get("offset") || "0";

            if (!query) {
                return jsonResponse({ error: "Paramètre 'q' manquant" }, 400);
            }

            const spotifyRes = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=10&offset=${offset}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (spotifyRes.status === 429) {
                const retryAfter = spotifyRes.headers.get("Retry-After");
                return jsonResponse(
                    { error: "rate_limited", retryAfter: retryAfter ? parseInt(retryAfter) : null },
                    429
                );
            }

            if (!spotifyRes.ok) {
                const errorData = await spotifyRes.json().catch(() => ({}));
                return jsonResponse({ error: errorData?.error?.message || "Erreur Spotify" }, spotifyRes.status);
            }

            const data = await spotifyRes.json();
            return jsonResponse(data);

        } catch (err) {
            return jsonResponse({ error: "Erreur interne du proxy" }, 500);
        }
    }
};