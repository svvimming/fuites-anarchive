"""System utility functions."""
import pygame
import sys


def quit_program() -> None:
    """
    Quits the pygame program gracefully.
    """
    pygame.quit()
    sys.exit()
