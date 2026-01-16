#!/bin/bash
# Fuit.es Compost - Desktop Launcher
# Double-click this file to start the simulation

# Find the compost project directory using Spotlight (in fuites-anarchive repo)
COMPOST_DIR=$(mdfind -name "run_sim.py" | xargs -I {} dirname {} | grep "fuites-anarchive/packages/compost$" | head -1)

if [ -z "$COMPOST_DIR" ]; then
    echo "Could not find compost project. Make sure it's indexed by Spotlight."
    read -p "Press Enter to close..."
    exit 1
fi

echo "Starting Compost simulation from: $COMPOST_DIR"

cd "$COMPOST_DIR"
uv run run_sim.py
