#!/bin/bash
# Fuit.es Compost - Desktop Launcher
# Double-click this file to start the simulation

# Capture this window's ID so we close only this window on exit
WINDOW_ID=$(osascript -e 'tell application "Terminal" to id of front window')

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

# Close this specific Terminal window on exit
osascript -e "tell application \"Terminal\" to close (every window whose id is $WINDOW_ID)" &
