# Sync'd

> Think together. Match perfectly.

A polished, mobile-first party game web app built with React + TypeScript + Vite + Tailwind CSS.

## The Game

Teams of two partners see the same category prompt and must independently think of the same answer. After a 3-2-1 countdown, both partners say their answer simultaneously. If they match — the team scores a point!

## Features

- 🎯 **492 built-in prompts** across 12 categories and 4 difficulty levels (Easy, Medium, Hard, Chaos)
- 👥 **2–8 teams**, fully customizable names
- ⏱ **Optional countdown timer** (10s / 15s / 20s / 30s)
- 🏆 **Three scoring modes**: Standard, Double, Streak
- 🤫 **Secret Answer Mode**: Partners type answers instead of speaking
- 📱 **PWA** — works offline after first load
- 💾 **Local game history** via localStorage
- ✏️ **Custom prompts** — add your own inside-jokes or group-specific categories
- 🎵 **Sound effects** via Web Audio API (no external dependencies)
- 🎉 **Confetti & animations** for match results and win screen

## Development

```bash
npm install
npm run dev
```

## Deploy to Netlify

The repo includes a `netlify.toml` — just point Netlify at this repo:

- Build command: `npm run build`
- Publish directory: `dist`
