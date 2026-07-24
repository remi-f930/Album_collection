import { getFirestore, collection, addDoc, getDocs, setDoc, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { auth, db } from "./firebase_config.js";
import { getTitles, formatDuration } from "./spotify_access.js";

export async function addAlbum(album, type) {
    const status = await checkAlbum(album.id);
    if (type == 0) {
        type = "CD";
    }
    else {
        type = "vinyl";
    }
    const user = auth.currentUser;
    if (!user || !user.emailVerified) {
        window.location.href = "../index.html"
        return;
    }
    if (!status[type]) {
        try {
            const albumRef = doc(db, "users", user.uid, type, album.id);
            let date = album.release_date;
            if (date.length > 4) {
                date = `${date[0]}` + `${date[1]}` + `${date[2]}` + `${date[3]}`;
            }
            const titles = await getTitles(album.id);
            let title_data = [];
            titles.forEach(title => {
                title_data.push({
                    name: title.name,
                    number: title.track_number,
                    url: title.external_urls.spotify,
                    duration: formatDuration(Number(title.duration_ms))
                })
            });
            await setDoc(albumRef, {
                id: album.id,
                image: album.images[0].url,
                name: album.name,
                artist: album.artists[0].name,
                releaseDate: date,
                spotifyUrl: album.external_urls.spotify,
                titles: title_data
            });
            message(`${album.name} successfully added to your collection in ${type}`);
            return 1;
        } catch (err) {
            message("database error" + err);
            return 0;
        }
    }
    else {
        if (confirm(`are you sure you want to delete ${album.name} in ${type} from your collection ?`)) {
            try {
                const albumRef = doc(db, "users", user.uid, type, album.id);
                await deleteDoc(albumRef);
                message(`${album.name} successfully removed from your collection in ${type}`);
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
}

export function message(msg) {
    const dialog = document.createElement("dialog");
    dialog.innerHTML = `
        <p>${msg}</p>
        <button class="close_dialog">✕</button>
    `;
    dialog.closedBy = "any";
    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector(".close_dialog").addEventListener("click", () => {
        dialog.close();
        dialog.remove();
    });
}

export function attachAddButton(button, album, type) {
    button.addEventListener("click", async () => {
        const succes = await addAlbum(album, type);
        if (succes == 1) {
            button.style.backgroundColor = "green";
        }
        else {
            button.style.backgroundColor = "";
        }
    });
}

export async function checkAlbum(albumId) {
    const user = auth.currentUser;
    if (!user) return { CD: false, vinyl: false };

    try {
        const cdRef = doc(db, "users", user.uid, "CD", albumId);
        const vinylRef = doc(db, "users", user.uid, "vinyl", albumId);

        const [cdSnapshot, vinylSnapshot] = await Promise.all([
            getDoc(cdRef),
            getDoc(vinylRef)
        ]);

        return {
            CD: cdSnapshot.exists(),
            vinyl: vinylSnapshot.exists()
        };
    } catch (err) {
        console.error("Verification error", err);
        return { CD: false, vinyl: false };
    }
}