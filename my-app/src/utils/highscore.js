// src/utils/highscore.js
import { db } from "../firebaseConfig"
import { ref, get, set } from "firebase/database"

const userId = "exampleUser" // temporary placeholder

export async function getHighscore(gameId) {
    try {
        const snapshot = await get(ref(db, `scores/${userId}/${gameId}`))
        if (snapshot.exists()) {
            return snapshot.val().highscore || 0
        } else {
            return 0
        }
    } catch (err) {
        console.error("Error loading highscore:", err)
        return 0
    }
}

export async function saveHighscore(gameId, score) {
    try {
        await set(ref(db, `scores/${userId}/${gameId}`), {
            highscore: score,
            updatedAt: Date.now()
        })
    } catch (err) {
        console.error("Error saving highscore:", err)
    }
}