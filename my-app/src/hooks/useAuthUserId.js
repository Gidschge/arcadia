// src/hooks/useAuthUserId.js
import { useState, useEffect } from "react"
import { auth } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function useAuthUserId() {
    const [userId, setUserId] = useState(null)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid)
            } else {
                setUserId(null)
            }
        })
        return () => unsub()
    }, [])

    return userId
}
