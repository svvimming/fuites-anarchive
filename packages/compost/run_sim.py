import pygame
import pymunk
import tkinter as tk
import yaml
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
        space.step(dt)
        simulation.update_chunks()
        pygame.display.flip()
        clock.tick(config["simulation"]["fps"])

    quit_program()


if __name__ == "__main__":
    main()