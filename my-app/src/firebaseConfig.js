import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"

// Use import.meta.env instead of process.env
const firebaseConfig = {
    apiKey: "AIzaSyDyMEQdIjZivVgv9c0m49LO8KC4LYRfLl4",
    authDomain: "arcadia-1556c.firebaseapp.com",
    databaseURL: "https://arcadia-1556c-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "arcadia-1556c",
    storageBucket: "arcadia-1556c.firebasestorage.app",
    messagingSenderId: "175444977619",
    appId: "1:175444977619:web:834248a187bc8fc7c17126",
    measurementId: "G-EMWBEVREK0"
}

// Debug: make sure config is loaded
console.log("Firebase config loaded:", firebaseConfig)

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
