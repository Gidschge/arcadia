// src/utils/highscore.js
import { db } from "../firebase"
import { ref, get, set } from "firebase/database"

// gameId = e.g. "memory", "snake", etc.

export async function getHighscore(userId, gameId) {
    if (!userId) return 0

    try {
        const snapshot = await get(ref(db, `scores/${userId}/${gameId}`))
        if (snapshot.exists()) {
            const data = snapshot.val()
            return data.highscore || 0
        } else {
            return 0
        }
    } catch (err) {
        console.error("Error loading highscore:", err)
        return 0
    }
}

export async function saveHighscore(userId, gameId, score) {
    if (!userId) return

    try {
        await set(ref(db, `scores/${userId}/${gameId}`), {
            highscore: score,
            updatedAt: Date.now()
        })
    } catch (err) {
        console.error("Error saving highscore:", err)
    }
}
