import React, { useEffect, useRef, useState, useCallback } from "react"
import { getHighscore, saveHighscore } from "../utils/highscore"

const GAME_ID = "jumper"
const GRAVITY = 0.7
const JUMP_VELOCITY = -12
const GROUND_Y = 276
const FLOOR_Y = 300
const BASE_SPEED = 4
const SPEED_SCALE = 1 / 300
const SPAWN_INTERVAL_MIN = 80
const SPAWN_INTERVAL_MAX = 140

export default function Jumper() {
  const canvasRef = useRef(null)

  // React-States NUR für UI
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)

  // Refs für Game-State (kein Re-Render)
  const gameStateRef = useRef({
    player: { x: 80, y: 250, w: 24, h: 24, vy: 0, onGround: false },
    obstacles: [],
    t: 0,
    s: 0,
    nextSpawnIn: 100,
    lastFrameTime: 0,
  })

  const startGame = useCallback(() => {
    const state = gameStateRef.current
    state.player.y = 250
    state.player.vy = 0
    state.player.onGround = false
    state.obstacles = []
    state.t = 0
    state.s = 0
    state.nextSpawnIn = 100
    setScore(0)
    setIsGameOver(false)
    setIsRunning(true)
  }, [])

  const endGame = useCallback(() => {
    const { s } = gameStateRef.current
    setIsRunning(false)
    setIsGameOver(true)
    if (s > best) {
      setBest(s)
      saveHighscore(GAME_ID, s)
    }
  }, [best])

  const jump = useCallback(() => {
    const { player } = gameStateRef.current
    if (!isRunning) {
      // Start per ersten Jump
      startGame()
      return
    }
    if (player.onGround) {
      player.vy = JUMP_VELOCITY
      player.onGround = false
    }
  }, [isRunning, startGame])

  useEffect(() => {
    let rafId

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    let cancelled = false

    const spawnObstacleSet = (state) => {
      const c = canvas
      // Großer Block
      state.obstacles.push({
        x: c.width + 20,
        y: FLOOR_Y - 10,
        w: 30 + Math.random() * 30,
        h: 30,
      })
      // Optional kleiner Block
      if (Math.random() < 0.5) {
        state.obstacles.push({
          x: c.width + 80,
          y: FLOOR_Y,
          w: 18,
          h: 20,
        })
      }
      state.nextSpawnIn =
        SPAWN_INTERVAL_MIN +
        Math.floor(Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN))
    }

    const step = (timestamp) => {
      if (cancelled) return

      const state = gameStateRef.current
      const { player } = state

      // Zeit-Differenz (könnte man für delta-basiertes Movement nutzen)
      const dt = state.lastFrameTime ? timestamp - state.lastFrameTime : 16
      state.lastFrameTime = timestamp

      // Hintergrund
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#0b1a4a"
      ctx.fillRect(0, FLOOR_Y, canvas.width, 60)

      if (isRunning) {
        // Physik
        player.vy += GRAVITY
        player.y += player.vy
        if (player.y > GROUND_Y) {
          player.y = GROUND_Y
          player.vy = 0
          player.onGround = true
        }

        // Spawn
        state.nextSpawnIn -= 1
        if (state.nextSpawnIn <= 0) {
          spawnObstacleSet(state)
        }

        // Hindernisse bewegen
        const speed = BASE_SPEED + state.s * SPEED_SCALE
        state.obstacles.forEach((o) => {
          o.x -= speed
        })
        state.obstacles = state.obstacles.filter((o) => o.x + o.w > 0)

        // Kollision
        for (const o of state.obstacles) {
          if (
            player.x < o.x + o.w &&
            player.x + player.w > o.x &&
            player.y < o.y + o.h &&
            player.y + player.h > o.y
          ) {
            endGame()
            break
          }
        }

        // Score & Ticks
        state.s += 1
        state.t += 1

        // Nur gelegentlich UI updaten (Performance)
        if (state.s % 5 === 0) {
          setScore(state.s)
        }
      }

      // Objekte zeichnen
      // Hindernisse
      ctx.fillStyle = "#e74c3c"
      state.obstacles.forEach((o) => ctx.fillRect(o.x, o.y, o.w, o.h))

      // Spieler
      ctx.fillStyle = isGameOver ? "#555" : "#7aa2ff"
      ctx.fillRect(player.x, player.y, player.w, player.h)

      // Overlay bei Game Over
      if (isGameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.4)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#ffffff"
        ctx.font = "24px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("Game Over - Space/Klick zum Neustart", canvas.width / 2, canvas.height / 2)
      }

      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [endGame, isRunning, isGameOver])

  useEffect(() => {
    getHighscore(GAME_ID).then((v) => {
      if (typeof v === "number") setBest(v)
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault()
        if (isGameOver) {
          startGame()
        } else {
          jump()
        }
      }
    }

    const handleClick = () => {
      if (isGameOver) {
        startGame()
      } else {
        jump()
      }
    }

    window.addEventListener("keydown", handleKey)
    canvas.addEventListener("mousedown", handleClick)

    return () => {
      window.removeEventListener("keydown", handleKey)
      canvas.removeEventListener("mousedown", handleClick)
    }
  }, [isGameOver, jump, startGame])

  return (
    <div>
      <div className="controls">
        <span className="pill">
          Steuerung: <b>Space/Klick</b> = Springen / Start
        </span>
        <span className="pill">
          Score: <span className="score">{score}</span>
        </span>
        <span className="pill">
          Best: <span className="best">{best}</span>
        </span>
        <span className="pill">
          Status: {isGameOver ? "Game Over" : isRunning ? "Läuft" : "Bereit"}
        </span>
      </div>
      <div className="canvas-wrap">
        <canvas ref={canvasRef} width="720" height="360" />
      </div>
    </div>
  )
}
