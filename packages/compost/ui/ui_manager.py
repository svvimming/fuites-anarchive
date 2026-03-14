"""UI management - floating pill bar."""
import math
import pygame
from typing import Dict, Any, List, Tuple


class UIManager:
    """Minimal floating pill bar with icon + shortcut buttons."""

    def __init__(
        self,
        config: Dict[str, Any],
        screen: pygame.Surface,
        font: pygame.font.Font
    ) -> None:
        self.config = config
        self.screen = screen
        self.colors = config["colors"]

        sim_cfg = config["simulation"]
        self.width = sim_cfg["window"]["width"]
        self.height = sim_cfg["window"]["height"]

        pill_cfg = sim_cfg["ui"]["pill_bar"]
        self.pill_h = pill_cfg["height"]
        self.pill_radius = pill_cfg["corner_radius"]
        self.pill_top = pill_cfg["top_margin"]
        self.bg_alpha = pill_cfg["bg_alpha"]
        self.pad_h = pill_cfg["padding_h"]

        # Fonts
        self._key_font = pygame.font.SysFont("Helvetica Neue, Helvetica, Arial", 13)
        self._label_font = pygame.font.SysFont("Helvetica Neue, Helvetica, Arial", 11)
        self._count_font = pygame.font.SysFont("Helvetica Neue, Helvetica, Arial", 14)
        self._status_font = pygame.font.SysFont("Helvetica Neue, Helvetica, Arial", 13)

        # Colors
        self._fg = (255, 255, 255)
        self._fg_dim = (200, 200, 200)
        self._rec_color = (255, 70, 70)
        self._divider_color = (90, 90, 90)

        # Button definitions: (draw_func_name, shortcut, width)
        self._btn_gap = 6  # gap between buttons
        self._btn_defs = [
            ("plus", "U", 36),
            ("rec_in", "I", 52),
            ("rec_out", "O", 58),
            ("clear", "C", 36),
            ("export", "E", 36),
            ("quit", "Q", 36),
        ]

        # Status: (letter, active_color)
        self._status_defs = [
            ("D", (180, 140, 255)),
            ("T", (80, 220, 220)),
            ("H", (80, 220, 80)),
            ("G", (220, 80, 220)),
            ("K", (255, 220, 60)),
        ]

        self._status_gap = 14
        self._count_w = 40

        # Pre-render status letters to measure
        status_surfs = [self._status_font.render(l, True, self._fg) for l, _ in self._status_defs]
        self._status_surf_widths = [s.get_width() for s in status_surfs]
        status_total = sum(self._status_surf_widths) + (len(self._status_defs) - 1) * self._status_gap

        # Layout: pad | buttons | pad | status | pad | count | pad
        buttons_total = sum(d[2] for d in self._btn_defs) + (len(self._btn_defs) - 1) * self._btn_gap
        self.pill_w = (
            self.pad_h + buttons_total
            + self.pad_h + status_total
            + self.pad_h + self._count_w
            + self.pad_h
        )
        self.pill_x = (self.width - self.pill_w) // 2
        self.pill_y = self.pill_top
        self._pill_cy = self.pill_y + self.pill_h // 2

        # Alpha surface
        self._pill_surface = pygame.Surface((self.pill_w, self.pill_h), pygame.SRCALPHA)

        # Layout left to right: buttons | status | count
        x = self.pill_x + self.pad_h

        # Buttons
        self.buttons: List[pygame.Rect] = []
        for _, _, w in self._btn_defs:
            self.buttons.append(pygame.Rect(x, self.pill_y, w, self.pill_h))
            x += w + self._btn_gap
        x = x - self._btn_gap + self.pad_h

        # Status
        self._status_x = x
        x += status_total + self.pad_h

        # Chunk count
        self._count_x = x

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
        dark_mode: bool = False,
    ) -> None:
        """Draw the floating pill bar."""
        cy = self._pill_cy

        # Background
        self._pill_surface.fill((0, 0, 0, 0))
        pygame.draw.rect(
            self._pill_surface,
            (20, 20, 20, self.bg_alpha),
            (0, 0, self.pill_w, self.pill_h),
            border_radius=self.pill_radius,
        )
        self.screen.blit(self._pill_surface, (self.pill_x, self.pill_y))

        # Buttons: subtle bg rect + icon + key
        recording = [False, audio_in_recording, audio_out_recording, False, False, False]
        key_gap = 5  # gap between icon right edge and key letter
        icon_r = 5   # icon radius / half-size
        btn_bg_color = (60, 60, 60)
        btn_inset = 4  # vertical inset from pill edge
        for i, (rect, (func_name, shortcut, _)) in enumerate(zip(self.buttons, self._btn_defs)):
            # Button background
            bg_rect = pygame.Rect(rect.x, self.pill_y + btn_inset, rect.width, self.pill_h - btn_inset * 2)
            pygame.draw.rect(self.screen, btn_bg_color, bg_rect, border_radius=6)

            is_rec = recording[i]
            key_surf = self._key_font.render(shortcut, True, self._fg_dim)

            if func_name in ("rec_in", "rec_out"):
                # dot + label + gap + key, all centered
                label = "IN" if func_name == "rec_in" else "OUT"
                lsurf = self._label_font.render(label, True, self._fg)
                dot_w = 6  # dot diameter
                content_w = dot_w + 4 + lsurf.get_width() + key_gap + key_surf.get_width()
                x0 = rect.x + (rect.width - content_w) // 2
                dot_color = self._rec_color if is_rec else self._fg
                pygame.draw.circle(self.screen, dot_color, (x0 + 3, cy), 3)
                self.screen.blit(lsurf, (x0 + dot_w + 4, cy - lsurf.get_height() // 2))
                self.screen.blit(key_surf, (x0 + dot_w + 4 + lsurf.get_width() + key_gap, cy - key_surf.get_height() // 2))
            else:
                # icon + gap + key, centered as a unit
                icon_w = icon_r * 2
                content_w = icon_w + key_gap + key_surf.get_width()
                x0 = rect.x + (rect.width - content_w) // 2
                icon_cx = x0 + icon_r

                if func_name == "plus":
                    self._draw_plus(icon_cx, cy)
                elif func_name == "clear":
                    self._draw_x(icon_cx, cy)
                elif func_name == "export":
                    self._draw_arrow_down(icon_cx, cy)
                elif func_name == "quit":
                    self._draw_square(icon_cx, cy)

                self.screen.blit(key_surf, (x0 + icon_w + key_gap, cy - key_surf.get_height() // 2))

        # Pipe 1 (between buttons and status)
        pipe1_x = self._status_x - self.pad_h // 2
        pygame.draw.line(self.screen, self._divider_color,
            (pipe1_x, self.pill_y + 7), (pipe1_x, self.pill_y + self.pill_h - 7), 1)

        # Pipe 2 (between status and count)
        pipe2_x = self._count_x - self.pad_h // 2
        pygame.draw.line(self.screen, self._divider_color,
            (pipe2_x, self.pill_y + 7), (pipe2_x, self.pill_y + self.pill_h - 7), 1)

        # Chunk count
        count_color = self._fg if chunk_count > 0 else self._fg_dim
        count_surf = self._count_font.render(str(chunk_count), True, count_color)
        self.screen.blit(count_surf, (
            self._count_x + self._count_w // 2 - count_surf.get_width() // 2,
            cy - count_surf.get_height() // 2,
        ))

        # Status letters
        states = [dark_mode, torus_world, history_panel_enabled, glue_visuals_enabled, debug_mode]
        sx = self._status_x
        inactive_status_color = (160, 160, 160)
        for (letter, active_color), active, sw in zip(self._status_defs, states, self._status_surf_widths):
            color = active_color if active else inactive_status_color
            surf = self._status_font.render(letter, True, color)
            self.screen.blit(surf, (sx, cy - surf.get_height() // 2))
            sx += sw + self._status_gap

    # ----------------------------------------------------------------
    # Icon drawing — small, 5px scale, centered at (cx, cy)
    # ----------------------------------------------------------------
    def _draw_plus(self, cx: int, cy: int) -> None:
        s = 4
        pygame.draw.line(self.screen, self._fg, (cx - s, cy), (cx + s + 1, cy), 2)
        pygame.draw.line(self.screen, self._fg, (cx, cy - s), (cx, cy + s + 1), 2)

    def _draw_x(self, cx: int, cy: int) -> None:
        s = 4
        pygame.draw.line(self.screen, self._fg, (cx - s, cy - s), (cx + s, cy + s), 2)
        pygame.draw.line(self.screen, self._fg, (cx + s, cy - s), (cx - s, cy + s), 2)

    def _draw_arrow_down(self, cx: int, cy: int) -> None:
        s = 4
        pygame.draw.line(self.screen, self._fg, (cx, cy - s), (cx, cy + s), 2)
        pygame.draw.line(self.screen, self._fg, (cx, cy + s), (cx - 3, cy + s - 3), 2)
        pygame.draw.line(self.screen, self._fg, (cx, cy + s), (cx + 3, cy + s - 3), 2)

    def _draw_square(self, cx: int, cy: int) -> None:
        s = 4
        pygame.draw.rect(self.screen, self._fg, pygame.Rect(cx - s, cy - s, s * 2 + 1, s * 2 + 1))

    # ----------------------------------------------------------------
    # Hourglass (drawn independently by simulation)
    # ----------------------------------------------------------------
    def draw_hourglass(self, x: int, y: int, t: float, w: int = 44, h: int = 60) -> None:
        """Draw an animated hourglass at (x, y)."""
        color = self.colors["WHITE"]
        pygame.draw.line(self.screen, color, (x, y), (x + w, y), 2)
        pygame.draw.line(self.screen, color, (x, y + h), (x + w, y + h), 2)
        mid_x = x + w // 2
        mid_y = y + h // 2
        pygame.draw.line(self.screen, color, (x + 1, y + 2), (mid_x, mid_y), 1)
        pygame.draw.line(self.screen, color, (x + w - 1, y + 2), (mid_x, mid_y), 1)
        pygame.draw.line(self.screen, color, (mid_x, mid_y), (x + 1, y + h - 2), 1)
        pygame.draw.line(self.screen, color, (mid_x, mid_y), (x + w - 1, y + h - 2), 1)
        # Sand animation
        # phase 0→1: sand drains from top to bottom, then resets
        phase = (t / 1.25) % 1.0  # one full cycle per 1.25s
        sand_color = (220, 190, 100)
        half_h = h // 2 - 4  # usable sand height per half
        max_half_w = w // 2 - 3  # max sand width at the wide end

        # How much sand remains in top (1→0) and accumulated in bottom (0→1)
        fill = 1.0 - phase

        # Top half: sand sits at the bottom of the top triangle (near the neck)
        # Surface drops from near-neck upward as it drains
        top_rows = int(fill * half_h)
        if top_rows > 0:
            for row in range(top_rows):
                # Draw from neck upward: row 0 = closest to neck
                ry = mid_y - 2 - row
                # Glass width at this y: narrower near neck, wider near top
                depth = row / half_h  # 0 at neck, approaches 1 at top
                hw = int(max_half_w * depth) + 1
                pygame.draw.line(self.screen, sand_color, (mid_x - hw, ry), (mid_x + hw, ry), 1)

        # Bottom half: sand piles up from the bottom
        bot_rows = int((1.0 - fill) * half_h)
        if bot_rows > 0:
            for row in range(bot_rows):
                # Draw from bottom upward: row 0 = bottom of glass
                ry = y + h - 3 - row
                # Glass width at this y: widest at bottom, narrower toward neck
                depth = row / half_h  # 0 at bottom, approaches 1 at neck
                hw = int(max_half_w * (1.0 - depth)) + 1
                pygame.draw.line(self.screen, sand_color, (mid_x - hw, ry), (mid_x + hw, ry), 1)

        # Falling grain through the neck
        if fill > 0.05:
            grain_y = mid_y + int(((t * 3) % 1.0) * (half_h + 2))
            if grain_y < y + h - 3 - bot_rows:
                pygame.draw.circle(self.screen, sand_color, (mid_x, grain_y), 1)

    # ----------------------------------------------------------------
    # Click handling
    # ----------------------------------------------------------------
    def handle_click(self, mouse_pos: Tuple[int, int]) -> str:
        """Check if a button was clicked and return which one."""
        button_names = ["upload", "audio_in", "audio_out", "clear", "export", "quit"]
        for rect, name in zip(self.buttons, button_names):
            if rect.collidepoint(mouse_pos):
                return name
        return ""
