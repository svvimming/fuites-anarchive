# Digital Compost

Rooted in open-source and permaculture philosophy, the Digital Compost is an experimental media processor designed to break down discarded 'Thingies' (images, sounds) into recombinant particles. Its processual logic problematizes the current perceptual regime of the digital by reframing some of the ways we commonly conceptualize the digital interface.

Images and audio are segmented into physics-enabled chunks that tumble through a simulated environment. Autonomous worms consume these fragments based on color affinity, excreting glues that attract and bind similar particles. Clusters form, fuse, and get exported as new compositions before dissolving back into the heap. Sound fragments can be triggered by proximity, allowing for live composition through interaction with the debris field.

## Installation

### 1. Install uv

[uv](https://docs.astral.sh/uv/) is a fast Python package manager. Install it first:

```bash
# macOS (Homebrew)
brew install uv

# Or install from source (must then restart terminal or `source ~/.zshrc` or `source ~/.bashrc`)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Install Python 3.13 if needed

```bash
uv python install 3.13
```

### 3. Clone the repository

```bash
git clone https://github.com/svvimming/fuites-anarchive.git
```

### 4. Navigate to compost

```bash
cd fuites-anarchive/packages/compost
```

### 5. Install dependencies

```bash
uv sync
```

## Usage

### Running the Simulation

```bash
uv run run_sim.py
```

### Desktop Shortcut (macOS)

1. Drag `Compost.command` to your Desktop or Dock
2. Double-click to launch

> **Note:** If macOS Gatekeeper blocks the file, remove the quarantine flag:
> ```bash
> xattr -d com.apple.quarantine Compost.command
> ```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `U` | Upload file(s) |
| `E` | Export glued compositions (saved to `exports/` folder) |
| `D` | Toggle debug view of thingie boundaries |
| `T` | Toggle torus world (wraparound edges) |
| `H` | Toggle history panel |
| `G` | Toggle glue visuals |
| `ESC` | Toggle UI |

### HTTP Upload

The simulation runs a local server (default: `http://127.0.0.1:5055`) that accepts file uploads, allowing integration with external tools.

## Configuration

Edit `config.yaml` to customize:
- Window size and FPS
- Physics parameters (gravity, elasticity, friction)
- Worm behavior and appetite thresholds
- Glue visual effects
- Audio/image segmentation parameters
