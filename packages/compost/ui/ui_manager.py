"""UI management - buttons, status bar."""
import pygame
from typing import Dict, Any, List, Tuple


class UIManager:
    """
    Handles creation and rendering of the UI (buttons, bar, debug text).
    """

    def __init__(
        self,
        config: Dict[str, Any],
        screen: pygame.Surface,
        font: pygame.font.Font
    ) -> None:
        """
        Initialize the UI manager.

        Args:
            config: Global config dict (for colors, button dims, etc.)
            screen: The main window surface for drawing.
            font: The font object for text rendering.
        """
        self.config = config
        self.screen = screen
        self.font = font

        sim_cfg = config["simulation"]
        self.width = sim_cfg["window"]["width"]
        self.height = sim_cfg["window"]["height"]
        self.ui_bar_height = sim_cfg["ui"]["ui_bar_height"]
        self.colors = config["colors"]

        # Button dims
        self.button_width = sim_cfg["ui"]["buttons"]["width"]
        self.button_height = sim_cfg["ui"]["buttons"]["height"]
        self.button_gap = sim_cfg["ui"]["buttons"]["gap"]

        self.buttons = self._create_buttons()

    def _create_buttons(self) -> List[pygame.Rect]:
        """Create UI button rectangles."""
        upload_rect = pygame.Rect(
            10,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        audio_in_rect = pygame.Rect(
            upload_rect.right + self.button_gap,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        audio_out_rect = pygame.Rect(
            audio_in_rect.right + self.button_gap,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        clear_rect = pygame.Rect(
            audio_out_rect.right + self.button_gap,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        export_rect = pygame.Rect(
            clear_rect.right + self.button_gap,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        quit_rect = pygame.Rect(
            export_rect.right + self.button_gap,
            (self.ui_bar_height - self.button_height) // 2,
            self.button_width,
            self.button_height
        )
        return [upload_rect, audio_in_rect, audio_out_rect, clear_rect, export_rect, quit_rect]

    def draw_ui(
        self,
        debug_mode: bool,
        torus_world: bool = False,
        history_panel_enabled: bool = True,
        glue_visuals_enabled: bool = True,
        ui_enabled: bool = True,
        chunk_count: int = 0,
        audio_in_recording: bool = False,
        audio_out_recording: bool = False,
    ) -> None:
        """
        Draw the UI bar, buttons, and optional debug text.

        Args:
            debug_mode: Whether to show debug mode status on the UI bar.
            torus_world: Whether the simulation is in torus world mode.
            history_panel_enabled: Whether the history panel is visible.
            glue_visuals_enabled: Whether glue visuals are visible.
            ui_enabled: Whether UI is currently enabled.
            chunk_count: Number of chunks in the simulation.
            audio_in_recording: Whether audio input recording is active.
            audio_out_recording: Whether compost recording is active.
        """
        ui_bar_rect = pygame.Rect(0, 0, self.width, self.ui_bar_height)
        pygame.draw.rect(self.screen, self.colors["UI_BG"], ui_bar_rect)

        button_texts = [
            "Upload (U)",
            "Stop In (I)" if audio_in_recording else "Rec In (I)",
            "Stop Out (O)" if audio_out_recording else "Rec Out (O)",
            "Clear Canvas",
            "Export Glues (E)",
            "Quit"
        ]
        button_recording = [False, audio_in_recording, audio_out_recording, False, False, False]
        for rect, text, is_recording in zip(self.buttons, button_texts, button_recording):
            self._draw_button(rect, text, is_recording)

        # Build right-aligned status texts with shortcuts; lay them out from right edge
        status_texts = [
            f"Chunks: {chunk_count}",
            f"UI: {'ON' if ui_enabled else 'OFF'} (ESC)",
            f"Glue Visuals: {'ON' if glue_visuals_enabled else 'OFF'} (G)",
            f"History: {'ON' if history_panel_enabled else 'OFF'} (H)",
            f"World: {'Torus' if torus_world else 'Rigid Walls'} (T)",
            f"Debug: {'ON' if debug_mode else 'OFF'} (D)",
        ]
        gap = 20
        x_right = self.width - 10
        y_center = (self.ui_bar_height) // 2
        # Place each status block from right to left
        for text in status_texts:
            surface = self.font.render(text, True, self.colors["WHITE"])
            x_right -= surface.get_width()
            self.screen.blit(surface, (x_right, y_center - surface.get_height() // 2))
            x_right -= gap

    def _draw_button(self, rect: pygame.Rect, text: str, is_recording: bool = False) -> None:
        """Draw a single button."""
        bg_color = self.colors.get("RECORDING", [200, 60, 60]) if is_recording else self.colors["DARK_GRAY"]
        pygame.draw.rect(self.screen, bg_color, rect, border_radius=5)
        text_surface = self.font.render(text, True, self.colors["WHITE"])
        text_rect = text_surface.get_rect(center=rect.center)
        self.screen.blit(text_surface, text_rect)

    def handle_click(self, mouse_pos: Tuple[int, int]) -> str:
        """
        Check if a button was clicked and return which one.

        Args:
            mouse_pos: (x, y) position of the mouse click

        Returns:
            String identifying which button was clicked, or empty string if none
        """
        button_names = ["upload", "audio_in", "audio_out", "clear", "export", "quit"]
        for rect, name in zip(self.buttons, button_names):
            if rect.collidepoint(mouse_pos):
                return name
        return ""
