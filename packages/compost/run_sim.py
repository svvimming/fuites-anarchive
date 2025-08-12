import pygame
import pymunk
import tkinter as tk
import yaml
import threading
from flask import Flask, request, jsonify
from urllib.request import urlopen, Request
from urllib.parse import urlparse
from simulation import Simulation
from utils import quit_program


def load_config(config_file: str = "config.yaml") -> dict:
    """
    Load configuration settings from a YAML file.

    Args:
        config_file (str): Path to the configuration file.

    Returns:
        dict: Configuration parameters as a dictionary.
    """
    with open(config_file, 'r') as file:
        return yaml.safe_load(file)


def main() -> None:
    """
    Main loop for the simulation.
    """
    # Load the configuration
    config = load_config()

    # Initialize Tkinter for file dialogs
    root = tk.Tk()
    root.withdraw()

    # Pygame initialization
    pygame.init()
    screen = pygame.display.set_mode(
        (config["simulation"]["window"]["width"], config["simulation"]["window"]["height"])
    )
    pygame.display.set_caption("Fuit.es Compost")
    font = pygame.font.SysFont(None, 24)

    # Initialize Pymunk space
    space = pymunk.Space()
    space.gravity = (
        config["simulation"]["gravity_x"],
        config["simulation"]["gravity_y"]
    )

    # Pass the entire config to the Simulation class
    simulation = Simulation(config, space, screen, font)

    # Start background HTTP server for uploads
    server_cfg = config.get("server", {})
    host = server_cfg.get("host", "127.0.0.1")
    port = int(server_cfg.get("port", 5055))
    max_download_bytes = int(server_cfg.get("max_download_bytes", 25 * 1024 * 1024))  # 25MB default
    download_timeout = int(server_cfg.get("download_timeout_sec", 15))

    def create_app(sim: Simulation) -> Flask:
        app = Flask(__name__)

        @app.get("/health")
        def health():
            return jsonify({"status": "ok"})

        @app.post("/post-compost-upload")
        def post_compost_upload():
            # Accept only a URL to a file; we will download in-memory and process
            url = None
            target_width = None
            target_height = None
            
            if request.is_json:
                payload = request.get_json(silent=True) or {}
                thingie = payload.get("thingie")
                if thingie and thingie.get("file_ref"):
                    url = thingie.get("file_ref").get("file_url")
                    # Extract width and height from the 'at' object if available
                    at_obj = thingie.get("at")
                    if at_obj:
                        if "width" in at_obj:
                            target_width = at_obj.get("width")
                            print(f"Extracted target width from JSON: {target_width}")
                        if "height" in at_obj:
                            target_height = at_obj.get("height")
                            print(f"Extracted target height from JSON: {target_height}")
                        
            if not url:
                return jsonify({"ok": False, "error": "missing 'url'"}), 400

            # Basic URL validation
            parsed = urlparse(url)
            if parsed.scheme not in ("http", "https") or not parsed.netloc:
                return jsonify({"ok": False, "error": "invalid url"}), 400

            # Download with size limit and timeout
            try:
                req = Request(url, headers={"User-Agent": "fuites-compost/1.0"})
                with urlopen(req, timeout=download_timeout) as resp:
                    # Optional: check content type hints
                    content_type = resp.headers.get("Content-Type", "").lower()
                    # Read with cap
                    data_chunks = []
                    total = 0
                    chunk_size = 256 * 1024
                    while True:
                        chunk = resp.read(chunk_size)
                        if not chunk:
                            break
                        total += len(chunk)
                        if total > max_download_bytes:
                            return jsonify({"ok": False, "error": "file too large"}), 413
                        data_chunks.append(chunk)
                    data = b"".join(data_chunks)
            except Exception as exc:
                return jsonify({"ok": False, "error": f"download failed: {exc}"}), 502

            if not data:
                return jsonify({"ok": False, "error": "empty response"}), 502

            # Enqueue for main-thread processing and return quickly
            try:
                # Pass both image data and target dimensions
                if target_width is not None and target_height is not None:
                    print(f"Enqueueing image with target dimensions: {target_width}x{target_height}")
                else:
                    print("Enqueueing image without target dimensions")
                sim.enqueue_image_bytes(data, target_width, target_height)
                return jsonify({"ok": True}), 200
            except Exception as exc:
                return jsonify({"ok": False, "error": str(exc)}), 500

        return app

    def run_server() -> None:
        app = create_app(simulation)
        # Disable reloader to avoid thread spawning another process
        app.run(host=host, port=port, debug=False, use_reloader=False, threaded=True)

    server_thread = threading.Thread(target=run_server, name="upload-server", daemon=True)
    server_thread.start()
    print(f"Upload server listening on http://{host}:{port}")

    clock = pygame.time.Clock()
    running = True
    dt = 1.0 / config["simulation"]["fps"]

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                simulation.handle_button_click(pygame.mouse.get_pos())
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_d:
                    simulation.debug_mode = not simulation.debug_mode
                elif event.key == pygame.K_t:
                    # Toggle torus world
                    simulation.torus_world = not simulation.torus_world
                    # Need to recreate boundaries when switching modes
                    simulation.clear_boundaries()
                    simulation._create_boundaries()
                elif event.key == pygame.K_h:
                    # Toggle history panel
                    simulation.toggle_history_panel()
                elif event.key == pygame.K_g:
                    simulation.glue_visuals_enabled = not simulation.glue_visuals_enabled

        # Fill screen with background color
        screen.fill(config["colors"]["WHITE"])
        simulation.draw_ui()
        # Drain any queued uploads (main-thread safe)
        simulation.drain_upload_queue()
        space.step(dt)
        simulation.update_chunks()
        pygame.display.flip()
        clock.tick(config["simulation"]["fps"])

    quit_program()


if __name__ == "__main__":
    main()