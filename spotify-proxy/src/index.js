let cachedToken = null;
let tokenExpiry = 0;

async function getSpotifyToken(clientId, clientSecret) {
    // Réutilise le token tant qu'il est valide, évite un appel inutile à Spotify
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
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 5000; // marge de sécurité de 5s
    return cachedToken;
}

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://remi-f930.github.io/",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}

async function appelerSpotify(url, token) {
    const spotifyRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    // Vérifie le 429 en priorité, avant tout autre traitement
    if (spotifyRes.status === 429) {
        const retryAfterHeader = spotifyRes.headers.get("Retry-After");
        console.log("Retry-After brut reçu de Spotify :", retryAfterHeader);
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
        // Gère les requêtes préliminaires CORS (préflight)
        if (request.method === "OPTIONS") {
            return jsonResponse({}, 204);
        }

        const url = new URL(request.url);

        try {
            const token = await getSpotifyToken(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET);

            // Route : /album/{id}/tracks — récupère les pistes d'un album
            const albumMatch = url.pathname.match(/^\/album\/([a-zA-Z0-9]+)\/tracks$/);
            if (albumMatch) {
                const albumId = albumMatch[1];
                return await appelerSpotify(
                    `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
                    token
                );
            }

            // Route par défaut : recherche d'albums
            const query = url.searchParams.get("q");
            const offset = url.searchParams.get("offset") || "0";

            if (!query) {
                return jsonResponse({ error: "Paramètre 'q' manquant" }, 400);
            }

            if (query.length > 100) {
                return jsonResponse({ error: "Requête trop longue" }, 400);
            }

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