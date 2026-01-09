// games/utils/highscore.js
import { db, serverTimestamp, auth } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function saveHighscore(gameId, score) {
  const user = auth.currentUser;
  if (!user) {
    console.log("❌ NO USER");
    return false;
  }

  try {
    // 1. Zuerst den aktuellen Bestwert abrufen
    const userGameRef = doc(db, "userScores", user.uid, "games", gameId);
    const snap = await getDoc(userGameRef);

    const oldScore = snap.exists() ? snap.data().score : 0;

    // 2. 🔥 Vergleich: Nur speichern, wenn der neue Score höher ist
    if (score <= oldScore) {
      console.log(
        `ℹ️ Kein neuer Rekord (${score} <= ${oldScore}). Nicht gespeichert.`
      );
      return false;
    }

    // 3. Wenn höher, dann beide Pfade aktualisieren
    const globalRef = doc(db, "leaderboards", gameId, "ranking", user.uid);

    const scoreData = {
      gameId,
      score,
      uid: user.uid,
      displayName: user.displayName || user.email?.split("@")[0] || "Spieler",
      updated: serverTimestamp(),
    };

    await Promise.all([
      setDoc(userGameRef, scoreData, { merge: true }),
      setDoc(globalRef, scoreData, { merge: true }),
    ]);

    console.log(`✅ NEUER HIGHSCORE: ${score} (vorher ${oldScore})`);
    return true;
  } catch (error) {
    console.error("Save Error:", error);
    return false;
  }
}

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
