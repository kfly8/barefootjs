"use client"

/**
 * Game Component
 *
 * 100x100 grid benchmark inspired by Luna UI's game example.
 * Tests DOM update performance with:
 * - Player (keyboard control)
 * - Enemies (move toward player)
 * - Bullets (shot by player)
 * - Real-time FPS measurement
 */

import { createSignal } from '@barefootjs/dom'

const GRID_SIZE = 100
const MAX_ENEMIES = 30
const PLAYER_SPEED = 1
const ENEMY_SPEED = 0.3
const BULLET_SPEED = 2

const EMPTY = 0
const PLAYER = 1
const ENEMY = 2
const BULLET = 3

type Entity = { x: number; y: number; vx?: number; vy?: number }

function Game() {
  // Game state signals
  const [score, setScore] = createSignal(0)
  const [fps, setFps] = createSignal(0)
  const [running, setRunning] = createSignal(false)
  const [entityCount, setEntityCount] = createSignal(0)

  // Game initialization (runs on client via ref)
  const initGame = (container: HTMLElement) => {
    // Create grid cells
    const cells: HTMLDivElement[] = []
    const cellTypes: number[] = new Array(GRID_SIZE * GRID_SIZE).fill(EMPTY)
    const prevCellTypes: number[] = new Array(GRID_SIZE * GRID_SIZE).fill(EMPTY)

    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const cell = document.createElement('div')
      cell.className = 'cell c0'
      container.appendChild(cell)
      cells.push(cell)
    }

    // Game state
    const player: Entity = { x: 50, y: 50 }
    const enemies: Entity[] = []
    const bullets: Entity[] = []
    const keys: Record<string, boolean> = {}

    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true
      if (e.key === ' ') e.preventDefault()
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    // FPS tracking
    let frameCount = 0
    let lastFpsTime = performance.now()

    // Spawn enemy
    const spawnEnemy = () => {
      if (enemies.length >= MAX_ENEMIES) return
      const side = Math.floor(Math.random() * 4)
      let x: number, y: number
      switch (side) {
        case 0: x = Math.random() * GRID_SIZE; y = 0; break
        case 1: x = GRID_SIZE - 1; y = Math.random() * GRID_SIZE; break
        case 2: x = Math.random() * GRID_SIZE; y = GRID_SIZE - 1; break
        default: x = 0; y = Math.random() * GRID_SIZE; break
      }
      enemies.push({ x, y })
    }

    // Shoot bullet
    const shoot = (dx: number, dy: number) => {
      bullets.push({
        x: player.x,
        y: player.y,
        vx: dx * BULLET_SPEED,
        vy: dy * BULLET_SPEED
      })
    }

    let lastShootTime = 0
    let lastSpawnTime = 0
    let animationId: number | null = null

    // Game loop
    const gameLoop = (time: number) => {
      if (!running()) {
        animationId = requestAnimationFrame(gameLoop)
        return
      }

      // Player movement
      if (keys['w'] || keys['arrowup']) player.y = Math.max(0, player.y - PLAYER_SPEED)
      if (keys['s'] || keys['arrowdown']) player.y = Math.min(GRID_SIZE - 1, player.y + PLAYER_SPEED)
      if (keys['a'] || keys['arrowleft']) player.x = Math.max(0, player.x - PLAYER_SPEED)
      if (keys['d'] || keys['arrowright']) player.x = Math.min(GRID_SIZE - 1, player.x + PLAYER_SPEED)

      // Shooting
      if (keys[' '] && time - lastShootTime > 150) {
        shoot(0, -1)
        lastShootTime = time
      }

      // Spawn enemies
      if (time - lastSpawnTime > 500) {
        spawnEnemy()
        lastSpawnTime = time
      }

      // Update enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i]
        const dx = player.x - e.x
        const dy = player.y - e.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0) {
          e.x += (dx / dist) * ENEMY_SPEED
          e.y += (dy / dist) * ENEMY_SPEED
        }
        if (dist < 1.5) {
          enemies.splice(i, 1)
        }
      }

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]
        b.x += b.vx!
        b.y += b.vy!
        if (b.x < 0 || b.x >= GRID_SIZE || b.y < 0 || b.y >= GRID_SIZE) {
          bullets.splice(i, 1)
          continue
        }
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j]
          const dx = b.x - e.x
          const dy = b.y - e.y
          if (dx * dx + dy * dy < 2) {
            enemies.splice(j, 1)
            bullets.splice(i, 1)
            setScore(s => s + 10)
            break
          }
        }
      }

      // Clear cell types
      cellTypes.fill(EMPTY)

      // Set player
      const px = Math.floor(player.x)
      const py = Math.floor(player.y)
      if (px >= 0 && px < GRID_SIZE && py >= 0 && py < GRID_SIZE) {
        cellTypes[py * GRID_SIZE + px] = PLAYER
      }

      // Set enemies
      for (const e of enemies) {
        const ex = Math.floor(e.x)
        const ey = Math.floor(e.y)
        if (ex >= 0 && ex < GRID_SIZE && ey >= 0 && ey < GRID_SIZE) {
          cellTypes[ey * GRID_SIZE + ex] = ENEMY
        }
      }

      // Set bullets
      for (const b of bullets) {
        const bx = Math.floor(b.x)
        const by = Math.floor(b.y)
        if (bx >= 0 && bx < GRID_SIZE && by >= 0 && by < GRID_SIZE) {
          cellTypes[by * GRID_SIZE + bx] = BULLET
        }
      }

      // Update DOM (dirty tracking - only update changed cells)
      for (let i = 0; i < cellTypes.length; i++) {
        if (cellTypes[i] !== prevCellTypes[i]) {
          cells[i].className = 'cell c' + cellTypes[i]
          prevCellTypes[i] = cellTypes[i]
        }
      }

      // Update entity count
      setEntityCount(1 + enemies.length + bullets.length)

      // FPS calculation
      frameCount++
      if (time - lastFpsTime >= 1000) {
        setFps(frameCount)
        frameCount = 0
        lastFpsTime = time
      }

      animationId = requestAnimationFrame(gameLoop)
    }

    // Start game loop
    animationId = requestAnimationFrame(gameLoop)
  }

  return (
    <div class="game">
      <style>{`
        .game {
          font-family: monospace;
          background: #1a1a2e;
          color: #eee;
          padding: 20px;
          max-width: 600px;
        }
        .stats {
          display: flex;
          gap: 20px;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .stats span { color: #0f0; }
        .controls {
          margin-bottom: 10px;
        }
        .controls button {
          padding: 8px 16px;
          margin-right: 10px;
          font-family: monospace;
          cursor: pointer;
        }
        .grid-container {
          display: grid;
          grid-template-columns: repeat(100, 4px);
          grid-template-rows: repeat(100, 4px);
          gap: 0;
          background: #000;
          border: 1px solid #333;
          width: fit-content;
        }
        .cell {
          width: 4px;
          height: 4px;
        }
        .c0 { background: #111; }
        .c1 { background: #0f0; }
        .c2 { background: #f00; }
        .c3 { background: #ff0; }
        .legend {
          margin-top: 10px;
          font-size: 12px;
        }
        .legend span {
          margin-right: 15px;
        }
        .legend .dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          margin-right: 4px;
          vertical-align: middle;
        }
      `}</style>

      <h2>100x100 Grid Benchmark</h2>

      <div class="stats">
        <div>FPS: <span>{fps()}</span></div>
        <div>Score: <span>{score()}</span></div>
        <div>Entities: <span>{entityCount()}</span></div>
      </div>

      <div class="controls">
        <button onClick={() => setRunning(r => !r)}>
          {running() ? 'Stop' : 'Start'}
        </button>
        <button onClick={() => { setScore(0); }}>
          Reset Score
        </button>
      </div>

      <div class="grid-container" ref={initGame}></div>

      <div class="legend">
        <span><span class="dot c1"></span>Player (WASD)</span>
        <span><span class="dot c2"></span>Enemy</span>
        <span><span class="dot c3"></span>Bullet (Space)</span>
      </div>

      <p style="margin-top: 15px; font-size: 12px; color: #888;">
        Arrow keys or WASD to move, Space to shoot
      </p>
    </div>
  )
}

export default Game
