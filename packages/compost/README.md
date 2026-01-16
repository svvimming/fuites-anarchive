# Digital Compost

Rooted in open-source and permaculture philosophy, the Digital Compost is an experimental media processor designed to break down discarded 'Thingies' (images, sounds) into recombinant particles. Its processual logic problematizes the current perceptual regime of the digital by reframing some of the ways we commonly conceptualize the digital interface.

Images and audio are segmented into physics-enabled chunks that tumble through a simulated environment. Autonomous worms consume these fragments based on color affinity, excreting glues that attract and bind similar particles. Clusters form, fuse, and get exported as new compositions before dissolving back into the heap. Sound fragments can be triggered by proximity, allowing for live composition through interaction with the debris field.

## Installation

### 1. Install uv

[uv](https://docs.astral.sh/uv/) is a fast Python package manager. Install it first:

```bash
# macOS (Homebrew)
brew install uv

# Or from source
curl -LsSf https://astral.sh/uv/install.sh | sh
```

After installation, restart your terminal or run `source ~/.bashrc` (or `~/.zshrc`).

### 2. Install Python 3.13 if needed

```bash
uv python install 3.13
```

### 3. Clone and install the repository and navigate to the compost

```bash
git clone https://github.com/svvimming/fuites-anarchive.git
cd fuites-anarchive/packages/compost
uv sync
```

## Usage

### Running the Simulation

```bash
# With uv
uv run run_sim.py
```

### Desktop Shortcut (macOS)

A `Compost.command` file is provided. Double-click to launch, or drag it to your Desktop or Dock for quick access.

> **Note:** If macOS Gatekeeper blocks the file, remove the quarantine flag:
> ```bash
> xattr -d com.apple.quarantine Compost.command
> ```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `U` | Upload file(s) |
| `E` | Export glues |
| `D` | Toggle debug mode |
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
