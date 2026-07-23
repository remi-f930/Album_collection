import { attachAddButton, addAlbum, checkAlbum } from "./data_access.js";

const album_input = document.querySelector("#album_input");
const album_list = document.querySelector("#album_list");

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
}

async function getAlbum(album) {
    album = album.trim().toLowerCase();

    if (!album) return null;

    try {
        const response = await fetch(`https://spotify-proxy.album-collection.workers.dev/?q=${encodeURIComponent(album)}`);
        const data = await response.json();
        if (!response.ok) {
            console.error("API error : ", data.error);
            return null;
        }
        return data.albums.items;
    }
    catch (err) {
        console.error(err);
        return null;
    }
}

async function getTitles(albumId) {
    if (!albumId) return null;
    try {
        const response = await fetch(`https://spotify-proxy.album-collection.workers.dev/album/${albumId}/tracks`);
        const data = await response.json();
        if (!response.ok) {
            console.error("API error : ", data.error);
            return null;
        }
        return data.items;
    }
    catch (err) {
        console.error(err);
        return null;
    }
}

async function showAlbums(albums) {
    album_list.innerHTML = "";
    if (!albums || albums.length === 0) {
        album_list.innerHTML = "<p>Aucun résultat.</p>";
        return;
    }
    for (const album of albums) {
        let date = album.release_date;
        if (date.length > 4) {
            date = `${date[0]}` + `${date[1]}` + `${date[2]}` + `${date[3]}`;
        }
        const item = document.createElement("div");
        item.classList.add("album_item");
        item.innerHTML = ` 
        <fieldset class="album">
            <a class="album_cover_link" href="${album.external_urls.spotify}" target="_blank" rel="noopener noreferrer">
                <img src="${album.images[0]?.url}" alt="${album.name}" width="80">
            </a>
            <details class="album_aside">
                <summary>${album.total_tracks} tracks</summary>
                <li id="title_list_${album.id}">API Error</li>
            </details>
            <p>${album.name}</p>
            <p class="album_artist">${album.artists[0].name}</p>
            <p class="album_date">${date}</p>
            <div class="album_buttons">
                <button class="cd">CD</button>
                <button class="vinyl">Vinyl</button>
            </div>
        </fieldset>`;
        album_list.appendChild(item);
        const addCdButton = item.querySelector(".cd");
        attachAddButton(addCdButton, album, 0);
        const addVinylButton = item.querySelector(".vinyl");
        attachAddButton(addVinylButton, album, 1);
        const status = await checkAlbum(album.id);
        if (status.CD) {
            addCdButton.style.backgroundColor = "green";
        }
        if (status.vinyl) {
            addVinylButton.style.backgroundColor = "green";
        }
        const details = item.querySelector(".album_aside");
        let titlesLoaded = false;

        details.addEventListener("toggle", async () => {
            if (details.open && !titlesLoaded) {
                titlesLoaded = true;
                const titles = await getTitles(album.id);
                showTitles(titles, album.id);
            }
        });
    }
}

function showTitles(titles, albumId) {
    const li = document.querySelector("#" + CSS.escape("title_list_" + albumId));
    if (!li || !titles || titles.length === 0) return;

    titles.forEach(title => {
        const item = document.createElement("div");
        item.innerHTML = `
            <a href="${title.external_urls.spotify}" target="NULL_">
                <span class="track_name">${title.track_number}. ${title.name}</span>
                <span class="track_duration">${formatDuration(title.duration_ms)}</span>
            </a>
        `;
        li.appendChild(item);
    });
}

let timeoutId;

album_input.addEventListener("keyup", () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
        const album = album_input.value;
        const albums = await getAlbum(album);
        showAlbums(albums);
    }, 400);
});