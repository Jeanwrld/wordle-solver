# 🟩 Wordle AI Solver

A full-stack machine learning project that trains a neural network to solve Wordle puzzles using information theory — achieving **100% win rate** across all 2,315 possible answers with an average of **3.46 guesses**.

**Live Demo → [wordle-solver-tan.vercel.app](https://wordle-solver-tan.vercel.app)**

![Win Rate](https://img.shields.io/badge/Win%20Rate-100%25-brightgreen) ![Avg Turns](https://img.shields.io/badge/Avg%20Turns-3.46-blue) ![Model](https://img.shields.io/badge/Model-HuggingFace-yellow)

---

## Links

| | |
|---|---|
| 🌐 Live App | [wordle-solver-tan.vercel.app](https://wordle-solver-tan.vercel.app) |
| 🤗 Model | [huggingface.co/sato2ru/wordle-solver](https://huggingface.co/sato2ru/wordle-solver) |
| 🎮 Gradio Demo | [huggingface.co/spaces/sato2ru/wordle](https://huggingface.co/spaces/sato2ru/wordle) |
| ⚙️ Backend Repo | [github.com/Jeanwrld/wordle-api](https://github.com/Jeanwrld/wordle-api) |

---

## How It Works

### Strategy
The model is trained via **supervised learning on entropy-optimal move data**. The core idea comes from information theory:

$$E[\text{Info}(guess)] = \sum_{p} P(p) \cdot \log_2\left(\frac{1}{P(p)}\right)$$

Where $P(p)$ is the probability of each colour pattern given the remaining possible words. The guess that maximises this expected entropy cuts the possibility space the most efficiently on average.

### Pipeline

```
1. Entropy Solver (Python)
   └─ Plays all 2,315 Wordle games optimally
   └─ Records every (board_state → best_guess) pair
   └─ Generates ~10,000 training samples

2. Neural Network (PyTorch)
   └─ Input:  390-dim binary board encoding
              (26 letters × 5 positions × 3 states)
   └─ Hidden: 512 → 512 → 256 with BatchNorm + Dropout
   └─ Output: Probability distribution over 12,972 valid words
   └─ Loss:   CrossEntropy vs entropy-optimal move

3. Deployment
   └─ Model weights → Hugging Face Hub
   └─ FastAPI backend → Railway
   └─ React frontend → Vercel
```

### Board Encoding
Each game state is encoded as a 390-dimensional binary vector:
- 26 letters × 5 positions × 3 states (grey/yellow/green)
- A `1` at index `letter * 15 + pos * 3 + state` means that letter was seen at that position with that colour

---

## Results

| Metric | Score |
|--------|-------|
| Win rate | **100.0%** |
| Average turns | **3.460** |
| Solved in ≤ 3 | 53.8% |
| Solved in ≤ 4 | 97.5% |
| Failures | 0 |

Turn distribution across all 2,315 answers:

```
1 turn :    1
2 turns:   59  ████████████
3 turns: 1188  ██████████████████████████████████████████████
4 turns: 1010  ████████████████████████████████████████
5 turns:   56  ███████████
6 turns:    1
FAILED :    0
```

---

## Stack

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Model training | Python, PyTorch | Google Colab |
| Model weights | Hugging Face Hub | [sato2ru/wordle-solver](https://huggingface.co/sato2ru/wordle-solver) |
| Backend API | FastAPI | Railway |
| Frontend | React | Vercel |
| Gradio demo | Gradio | HF Spaces |

---

## Project Structure

```
wordle-solver/
│
├── wordle_train.ipynb       # Full training pipeline (Colab)
│   ├── Phase 1: Data generation (entropy solver)
│   ├── Phase 2: Model training (WordleNet)
│   ├── Phase 3: Evaluation & benchmarking
│   ├── Phase 4: Push to Hugging Face Hub
│   └── Phase 5: Deploy Gradio app to HF Spaces
│
├── wordle-ui/               # React frontend (deployed on Vercel)
│   └── src/
│       └── App.js           # Full UI — board, suggestions, pattern picker
│
└── README.md
```

> Backend code lives in a separate repo → [github.com/Jeanwrld/wordle-api](https://github.com/Jeanwrld/wordle-api)

---

## Running Locally

### Backend
```bash
git clone https://github.com/Jeanwrld/wordle-api
cd wordle-api
pip install -r requirements.txt
python main.py
# API runs at http://localhost:8000
```

### Frontend
```bash
git clone https://github.com/Jeanwrld/wordle-solver
cd wordle-solver/wordle-ui
npm install
npm start
# App runs at http://localhost:3000
```

---

## API

**Base URL:** `https://web-production-ea1d.up.railway.app`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/suggest` | Get next best guess given history |
| GET | `/opener` | Get best opening word |

**Example request:**
```json
POST /suggest
{
  "history": [
    { "word": "crane", "pattern": [0, 2, 0, 1, 0] }
  ]
}
```

**Example response:**
```json
{
  "suggestion": "boils",
  "top_suggestions": [
    { "word": "boils", "entropy": 3.821, "is_possible": true },
    { "word": "toils", "entropy": 3.764, "is_possible": true }
  ],
  "possible_count": 28,
  "bits_remaining": 4.81,
  "solved": false,
  "message": "28 words remaining — try BOILS"
}
```

---

## Inspiration

Strategy based on [3Blue1Brown's video](https://www.youtube.com/watch?v=v68zYyaEmEA) — *Solving Wordle using information theory*.

---

## Design Decisions

### Why CRANE and not SALET, for a best openner
3Blue1Brown's follow-up video points out that the mathematically optimal opener is actually **SALET** (avg ~3.42 turns) not CRANE — but only when the solver has access to the official hidden answer list.

This app uses CRANE deliberately because:
- CRANE is on the answer list — you can win in 1 guess
- SALET is only a valid *guess*, never an answer — turn 1 win is impossible
- The difference in average turns is negligible (3.46 vs 3.42)
- The goal is to assist a human player, not purely minimise turns

This mirrors the distinction Sanderson makes between **"computer mode"** (minimise avg turns at all costs) and **"human mode"** (use real words, play naturally).

> The "best" strategy depends entirely on your goal — are you trying to win a math competition, or actually enjoy the game?

## License

MIT
