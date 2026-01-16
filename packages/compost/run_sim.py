"""Entry point for the Compost simulation."""
import pygame
import pymunk
import yaml

from simulation import Simulation
from network import UploadServer
from utils.system_utils import quit_program


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
                    simulation.debug_mode = not simulation.debug_mode
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
                elif event.key == pygame.K_ESCAPE:
                    simulation.ui_enabled = not simulation.ui_enabled
                elif event.key == pygame.K_e:
                    # Export glues shortcut
                    simulation.export_glues()

        # Fill screen with background color
        screen.fill(config["colors"]["WHITE"])
        simulation.draw_ui()

        # Process any pending uploads (main-thread safe)
        simulation.process_pending_uploads()

        # Process completed file dialog results (non-blocking)
        simulation.process_file_dialogs()

        # Receive processed chunks from background (non-blocking)
        simulation.receive_chunks()

        # Handle audio hover for sound chunks
        simulation.handle_audio_hover(pygame.mouse.get_pos())

        # Clean up finished audio periodically
        simulation.cleanup_finished_audio()

        space.step(dt)
        simulation.update_chunks()
        pygame.display.flip()
        clock.tick(config["simulation"]["fps"])

    # Clean up worker process before exiting
    simulation.cleanup()
    quit_program()


if __name__ == "__main__":
    main()
