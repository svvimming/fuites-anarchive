"""Entry point for the Compost simulation."""
import pygame
import pymunk
import yaml

from simulation import Simulation
from network import UploadServer
from utils.system_utils import quit_program
from utils.logging_utils import get_logger

_logger = get_logger(__name__)


def load_config(config_file: str = "config.yaml") -> dict:
    """
    Load configuration settings from a YAML file.

    Args:
        config_file: Path to the configuration file.

    Returns:
        Configuration parameters as a dictionary.
    """
    with open(config_file, 'r') as file:
        return yaml.safe_load(file)


def main() -> None:
    """Main loop for the simulation."""
    # Load the configuration
    config = load_config()

    # Mixer is handled by SDAudioManager (sounddevice), not pygame.
    # Quit SDL's mixer so it doesn't hold the audio device.
    pygame.init()
    pygame.mixer.quit()

    # Resolve window size: "auto" uses usable desktop area (minus menu bar, dock, etc.)
    win_cfg = config["simulation"]["window"]
    if win_cfg.get("width") == "auto" or win_cfg.get("height") == "auto":
        import ctypes, ctypes.util
        sdl_path = ctypes.util.find_library("SDL2")
        usable_w, usable_h = None, None
        if sdl_path:
            sdl = ctypes.CDLL(sdl_path)
            rect = (ctypes.c_int * 4)()  # x, y, w, h
            if sdl.SDL_GetDisplayUsableBounds(0, rect) == 0:
                usable_w, usable_h = rect[2], rect[3]
                _logger.info("SDL usable bounds: %dx%d", usable_w, usable_h)
        if usable_w is None:
            # Fallback: full desktop resolution
            usable_w, usable_h = pygame.display.get_desktop_sizes()[0]
            _logger.info("Fallback to full desktop: %dx%d", usable_w, usable_h)
        if win_cfg.get("width") == "auto":
            win_cfg["width"] = usable_w
        if win_cfg.get("height") == "auto":
            win_cfg["height"] = usable_h
    screen = pygame.display.set_mode((win_cfg["width"], win_cfg["height"]))
    pygame.display.set_caption("Fuit.es Compost")
    font = pygame.font.SysFont(None, 24)

    # Initialize Pymunk space
    space = pymunk.Space()
    space.gravity = (
        config["simulation"]["physics"]["gravity"]["x"],
        config["simulation"]["physics"]["gravity"]["y"]
    )

    # Pass the entire config to the Simulation class
    simulation = Simulation(config, space, screen, font)

    # Start background HTTP server for uploads
    server_cfg = config.get("server", {})
    host = server_cfg.get("host", "127.0.0.1")
    port = int(server_cfg.get("port", 5055))

    upload_server = UploadServer(
        host=host,
        port=port,
        config=config,
        on_upload_callback=simulation.on_upload_received
    )
    upload_server.start()

    clock = pygame.time.Clock()
    running = True
    dt = 1.0 / config["simulation"]["fps"]

    while running:
        # Check if simulation requested quit
        if simulation.should_quit:
            running = False

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                simulation.handle_button_click(pygame.mouse.get_pos())
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_d:
                    simulation.dark_mode = not simulation.dark_mode
                elif event.key == pygame.K_t:
                    # Toggle torus world
                    simulation.toggle_torus_world()
                elif event.key == pygame.K_h:
                    # Toggle history panel
                    simulation.toggle_history_panel()
                elif event.key == pygame.K_g:
                    simulation.glue_visuals_enabled = not simulation.glue_visuals_enabled
                elif event.key == pygame.K_u:
                    simulation.upload_file()
                elif event.key == pygame.K_i:
                    simulation._toggle_audio_in_recording()
                elif event.key == pygame.K_o:
                    simulation._toggle_compost_recording()
                elif event.key == pygame.K_c:
                    simulation.clear_chunks()
                elif event.key == pygame.K_q:
                    running = False
                elif event.key == pygame.K_ESCAPE:
                    simulation.ui_enabled = not simulation.ui_enabled
                elif event.key == pygame.K_e:
                    # Export glues shortcut
                    simulation.export_glues()
                elif event.key == pygame.K_k:
                    simulation.debug_mode = not simulation.debug_mode
                elif event.key == pygame.K_p:
                    simulation.processing_indicator_enabled = not simulation.processing_indicator_enabled

        # Fill screen with background color
        bg = config["colors"]["BLACK"] if simulation.dark_mode else config["colors"]["WHITE"]
        screen.fill(bg)
        simulation.draw_ui()

        # Process any pending uploads (main-thread safe)
        simulation.process_pending_uploads()

        # Process completed file dialog results (non-blocking)
        simulation.process_file_dialogs()

        # Receive processed chunks from background (non-blocking)
        simulation.receive_chunks()

        # Handle audio hover for sound chunks
        simulation.handle_audio_hover(pygame.mouse.get_pos())

        space.step(dt)
        simulation.update_chunks()
        pygame.display.flip()
        clock.tick(config["simulation"]["fps"])
        pygame.display.set_caption(f"Compost — {clock.get_fps():.0f} FPS")

    # Clean up worker process before exiting
    simulation.cleanup()
    quit_program()


if __name__ == "__main__":
    main()
