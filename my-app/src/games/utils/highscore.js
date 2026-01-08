// games/utils/highscore.js
import { db, serverTimestamp, auth } from "../../firebase";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";

export async function saveHighscore(gameId, score) {
  const user = auth.currentUser;
  if (!user) {
    console.log("❌ NO USER");
    return false;
  }

  try {
    // A) Privater Score (deine bisherige Logik)
    const userGameRef = doc(db, "userScores", user.uid, "games", gameId);

    // B) Globaler Leaderboard Score (NEU für das Leaderboard-Widget)
    // Pfad: leaderboards / {gameId} / ranking / {userId}
    const globalRef = doc(db, "leaderboards", gameId, "ranking", user.uid);

    const scoreData = {
      gameId,
      score,
      uid: user.uid,
      displayName: user.displayName || user.email?.split("@")[0] || "Spieler",
      updated: serverTimestamp(),
    };

    // Parallel speichern
    await Promise.all([
      setDoc(userGameRef, scoreData, { merge: true }),
      setDoc(globalRef, scoreData, { merge: true }),
    ]);

    console.log(`✅ SAVED ${score} for ${gameId} (Private & Global)`);
    return true;
  } catch (error) {
    console.error("Save Error:", error);
    return false;
  }
}

// Deine getHighscore bleibt für den persönlichen Bestwert gleich
export async function getHighscore(gameId) {
  const user = auth.currentUser;
  if (!user) return 0;

  try {
    const gameRef = doc(db, "userScores", user.uid, "games", gameId);
    const snap = await getDoc(gameRef);
    return snap.exists() ? snap.data().score : 0;
  } catch (error) {
    return 0;
  }
}
