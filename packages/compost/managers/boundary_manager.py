"""Physics boundary management (walls and torus wrapping)."""
import pymunk
from typing import Dict, Any, List
from weakref import WeakKeyDictionary


class BoundaryManager:
    """Manages physics boundaries and torus wrapping."""

    def __init__(
        self,
        config: Dict[str, Any],
        space: pymunk.Space,
        width: int,
        height: int
    ):
        """
        Initialize boundary manager.

        Args:
            config: Global configuration dict
            space: Pymunk physics space
            width: Screen width
            height: Screen height
        """
        self.config = config
        self.space = space
        self.width = width
        self.height = height
        self.torus_world = config["simulation"].get("torus_world", False)
        self.boundary_walls: List[pymunk.Segment] = []
        self._body_margin_cache: WeakKeyDictionary = WeakKeyDictionary()
        self._create_boundaries()

    def _create_boundaries(self) -> None:
        """
        Create boundaries based on the configuration.
        If torus_world is True, creates a torus world without walls.
        If False, creates rigid walls around the simulation area.
        Note: The UI bar is treated as an overlay, with rigid walls at the screen edges.
        """
        if not self.torus_world:
            # Create traditional rigid walls at screen edges
            static_lines = [
                pymunk.Segment(self.space.static_body, (0, 0), (self.width, 0), 1),
                pymunk.Segment(self.space.static_body, (0, 0), (0, self.height), 1),
                pymunk.Segment(self.space.static_body, (0, self.height), (self.width, self.height), 1),
                pymunk.Segment(self.space.static_body, (self.width, 0), (self.width, self.height), 1),
            ]
            physics_cfg = self.config.get("physics", {}).get("chunk", {})
            for line in static_lines:
                line.elasticity = physics_cfg.get("elasticity", 1.0)
                line.friction = physics_cfg.get("friction", 5.0)
            self.space.add(*static_lines)
            # Store references to these walls to be able to remove them later
            self.boundary_walls = static_lines
        else:
            # For torus world, no walls are needed
            self.boundary_walls = []

    def clear_boundaries(self) -> None:
        """Remove any existing boundary walls from the space."""
        if self.boundary_walls:
            for wall in self.boundary_walls:
                try:
                    self.space.remove(wall)
                except (ValueError, RuntimeError):
                    # Wall may have already been removed
                    pass
            self.boundary_walls = []

    def toggle_mode(self) -> None:
        """Toggle between torus and rigid walls."""
        self.torus_world = not self.torus_world
        self._body_margin_cache.clear()  # Clear for immediate fresh start
        self.clear_boundaries()
        self._create_boundaries()

    def _get_body_margin(self, body: pymunk.Body) -> float:
        """
        Get the wrapping margin for a body (cached for performance).

        Args:
            body: The physics body

        Returns:
            The margin (max extent from center) for wrapping calculations
        """
        if body in self._body_margin_cache:
            return self._body_margin_cache[body]

        margin = 0.0
        # Find the shape associated with this body
        for shape in self.space.shapes:
            if shape.body == body:
                if hasattr(shape, 'radius'):
                    margin = shape.radius
                elif hasattr(shape, 'get_vertices'):
                    vertices = shape.get_vertices()
                    if vertices:
                        max_x = max(abs(v.x) for v in vertices)
                        max_y = max(abs(v.y) for v in vertices)
                        margin = max(max_x, max_y)
                break

        self._body_margin_cache[body] = margin
        return margin

    def handle_torus_wrapping(self) -> None:
        """
        Handle the torus wrapping for all bodies in the space.
        If a body goes beyond an edge, wrap it to the opposite edge.
        This creates a seamless torus world effect.
        Note: The UI bar is treated as an overlay, with wrapping happening across the full screen.
        """
        if not self.torus_world:
            return

        # Check all bodies in the space
        for body in self.space.bodies:
            # Skip static bodies
            if body.body_type == pymunk.Body.STATIC:
                continue

            position = body.position
            margin = self._get_body_margin(body)

            # Check x-axis boundaries - only teleport when fully beyond boundary
            if position.x < -margin:
                body.position = pymunk.Vec2d(self.width + position.x, position.y)
            elif position.x > self.width + margin:
                body.position = pymunk.Vec2d(position.x - self.width, position.y)

            # Check y-axis boundaries - treat top of screen as top boundary (ignore UI bar)
            if position.y < -margin:
                body.position = pymunk.Vec2d(position.x, self.height + position.y)
            elif position.y > self.height + margin:
                body.position = pymunk.Vec2d(position.x, position.y - self.height)
