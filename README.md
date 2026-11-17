# NEON WAKE — Open-World Crime Game (`gta6-01`)

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Vanszs/gta6-openworld/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Vanszs/gta6-openworld/reward.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**NEON WAKE** is an offline desktop-browser open-world crime game built for the [make.fun `gta6-01` bounty](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01).

## Features

- **District-Scale Neon City & Waterfront**: Multi-lane boulevards, signalized intersections, sidewalks, central park, lit commercial towers, and a harbor waterfront with animated water highlights, boardwalk, wooden piers, container stacks, cranes, and bollards.
- **On-Foot & Vehicle Action**: 8-direction movement, sprint, weapon switching (Pistol & SMG), carjacking, drift physics with tyre smoke, headlights, and chassis damage.
- **Traffic, Pedestrians & Wanted Dispatch**: Lane-following traffic obeying intersection signals, reactive pedestrians, 1–5 star police response with pursuing cruisers, officers on foot, and high-star roadblocks.
- **Mission System & Shops**: Four sequential jobs with live radar routing, nearest-target tracking on kill missions, rooftop shop signs, and explicit `localStorage` save/load.
- **Procedural WebAudio**: Engine hum, tyre screech, gunfire, sirens, and UI chimes synthesized in real time after first key press.

## Controls

- **On Foot**: `[WASD]` Move · `[SHIFT]` Sprint · `[LMB]` Fire · `[Q/E]` Weapon · `[F]` Hijack
- **Driving**: `[WASD]` Drive · `[SPACE]` Drift · `[LMB]` Fire · `[F]` Exit
- **System**: `[ENTER]` Start / Accept · `[ESC / P]` Pause & Save/Load · `[M]` Mute Audio

## Run Locally

```bash
node serve.ts
# Open http://localhost:8080
```

## Build Output & Dossier

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
