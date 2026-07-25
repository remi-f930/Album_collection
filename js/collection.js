import { getDocs, collection, query, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { auth, db } from "./firebase_config.js";
import { addAlbum, message } from "./data_access.js";

const collection_button = document.querySelector("#collection_button");
const album_list = document.querySelector("#album_list");
const collection_icon = document.querySelector("#collection_icon");
const album_input = document.querySelector("#album_input");
const album_collection = document.querySelector("#album_collection");
const load_more = document.querySelector("#load_more_button");

let collection_mode = 0;


collection_button.addEventListener("click", async () => {
    if (!collection_mode) {
        collection_mode = 1;
        collection_icon.src = "../img/search.png";
        album_list.style.display = "none";
        album_input.style.display = "none";
        load_more.style.display = "none";
        const user_collection = await getCollection();
        showCollection();
        album_collection.style.display = "block";
    }
    else {
        collection_mode = 0;
        collection_icon.src = "../img/vinyls.png";
        album_list.style.display = "grid";
        album_input.style.display = "block";
        if (!album_collection.innerHTML == "") {
            load_more.style.display = "block";
        }
        album_collection.style.display = "none";
    }
})

async function getCollection() {
    try {
        const user = auth.currentUser;
        const CDref = collection(db, "users", user.uid, "CD");
        const Vinylref = collection(db, "users", user.uid, "vinyl");
        const collectionCD = await getDocs(CDref);
        const collectionVinyl = await getDocs(Vinylref);
        let CDs = [];
        collectionCD.forEach(CD => {
            const cd = CD.data();
            CDs.push(cd);
        });
        let Vinyls = [];
        collectionVinyl.forEach(Vinyl => {
            const vinyl = Vinyl.data();
            Vinyls.push(vinyl);
        });
        return { CD: CDs, vinyl: Vinyls };
    } catch (err) {
        album_collection.innerHTML = `<h1>Database error : ${err}</h1>`;
        return null;
    }
}

async function showCollection() {
    album_collection.innerHTML = "";
    const user_collection = await getCollection();
    const collectionCD = user_collection.CD;
    const collectionVinyl = user_collection.vinyl;

    if (collectionCD.length === 0 && collectionVinyl.length === 0) {
        album_collection.innerHTML = `<p class="empty_collection">Your collection is empty for now.</p>`;
        return;
    }

    collectionCD.forEach(CD => {
        renderRow(CD, "CD");
    });

    collectionVinyl.forEach(vinyl => {
        renderRow(vinyl, "vinyl");
    });
}

function renderRow(album, type) {
    const row = document.createElement("div");
    row.classList.add("collection_row");
    row.innerHTML = `
        <a class="row_cover" href="${album.spotifyUrl}" target="_blank" rel="noopener noreferrer">
            <img src="${album.image}" alt="${album.name}">
        </a>
        <div class="row_info">
            <p class="row_title">${album.name}</p>
            <p class="row_meta">${album.artist} · ${album.releaseDate}</p>
        </div>
        <span class="type_badge ${type === "CD" ? "type_cd" : "type_vinyl"}">${type === "CD" ? "CD" : "Vinyl"}</span>
        <details class="row_tracks">
            <summary>${album.titles.length} tracks</summary>
            <div class="row_tracklist" id="${type}_collection_title_list_${album.id}"></div>
        </details>
        <button class="delete_button" id="${type}_delete_${album.id}">Remove</button>
    `;
    album_collection.appendChild(row);

    const trackList = row.querySelector(`#${type}_collection_title_list_${album.id}`);
    const deleteButton = row.querySelector(`#${type}_delete_${album.id}`);
    deleteButton.addEventListener("click", () => {
        deleteAlbum(album, type);
    });

    album.titles.forEach(title => {
        const trackItem = document.createElement("div");
        trackItem.innerHTML = `
            <a href="${title.url}" target="_blank" rel="noopener noreferrer">
                 <span class="track_name">${title.number}. ${title.name}</span>
                 <span class="track_duration">${title.duration}</span>
            </a>
         `;
        trackList.appendChild(trackItem);
    });
}

async function deleteAlbum(album, type) {
    const user = auth.currentUser;
    if (confirm(`are you sure you want to delete ${album.name} in ${type} from your collection ?`)) {
        try {
            const albumRef = doc(db, "users", user.uid, type, album.id);
            await deleteDoc(albumRef);
            message(`${album.name} successfully removed from your collection in ${type}`);
            showCollection();
            return 0;
        } catch (err) {
            message("database error" + err);
            return 0;
        }
    }
    else {
        return 1;
    }
}