import pygame
import pymunk
import math
from typing import List, Tuple, Dict, Any
import random


class Chunk:
    """Handles a single polygon chunk with physics and a surface."""

    def __init__(
        self,
        segment_surface: pygame.Surface,
        vertices: List[Tuple[float, float]],
        config: Dict[str, Any],
        space: pymunk.Space,
        downsized: bool = False  # Indicates if the segment has been downsized
    ) -> None:
        """
        Initialize an Chunk instance.
        
        Args:
            segment_surface (pygame.Surface): Cropped surface of the image segment.
            vertices (List[Tuple[float, float]]): The polygon vertices for the chunk.
            config (Dict[str, Any]): The entire config dictionary loaded from YAML.
            space (pymunk.Space): The Pymunk physics space.
            downsized (bool): Indicates if the segment has been downsized.
        """
        self.config = config
        self.space = space
        self.segment_surface = segment_surface

        sim_cfg = config["simulation"]
        self.width = sim_cfg["window"]["width"]
        self.height = sim_cfg["window"]["height"]
        self.ui_bar_height = sim_cfg["window"]["ui_bar_height"]
        vel_min = sim_cfg["chunk_velocity_min"]
        vel_max = sim_cfg["chunk_velocity_max"]

        if downsized:
            # Resize the segment_surface to a smaller size
            downsample_factor = config["compression"].get("downsample_factor", 0.5)
            new_width = max(1, int(segment_surface.get_width() * downsample_factor))
            new_height = max(1, int(segment_surface.get_height() * downsample_factor))
            self.segment_surface = pygame.transform.scale(segment_surface, (new_width, new_height))
            # print(f"Downsized chunk to ({new_width}, {new_height})")
            # Optionally, scale down the vertices as well
            self.vertices = [(x * downsample_factor, y * downsample_factor) for (x, y) in vertices]
        else:
            self.segment_surface = segment_surface
            self.vertices = vertices

        # Compute a valid random position using bounding-box constraints
        random_x, random_y = self._get_random_position_in_bounds(self.vertices)

        # Setup the chunk's body and shape
        mass = 1.0
        moment = pymunk.moment_for_poly(mass, self.vertices)
        self.body = pymunk.Body(mass, moment)
        self.body.position = (random_x, random_y)
        self.body.velocity = (
            random.uniform(vel_min, vel_max),
            random.uniform(vel_min, vel_max),
        )

        self.shape = pymunk.Poly(self.body, self.vertices)
        self.shape.elasticity = 1.0
        self.shape.friction = 5.0
        self.shape.filter = pymunk.ShapeFilter(group=1)

        self.space.add(self.body, self.shape)

        # if downsized:
            # print(f"Created a downsized chunk at position ({random_x}, {random_y}) with size {self.segment_surface.get_size()}.")
        # else:
            # print(f"Created a chunk at position ({random_x}, {random_y}) with size {self.segment_surface.get_size()}.")

    def _get_random_position_in_bounds(
        self,
        vertices: List[Tuple[float, float]]
    ) -> Tuple[float, float]:
        """
        Compute a valid random (x,y) for this chunk, ensuring it remains within screen boundaries.
        The UI bar is treated as an overlay, so objects can be placed across the full screen.

        Args:
            vertices (List[Tuple[float, float]]): Polygon vertices for this chunk.

        Returns:
            (random_x, random_y): A valid position where the chunk can be placed.
        """
        # 1) Compute bounding box
        xs = [v[0] for v in vertices]
        ys = [v[1] for v in vertices]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)

        # 2) Determine allowable placement range
        allowed_min_x = -min_x
        allowed_max_x = self.width - max_x
        allowed_min_y = -min_y  # Allow placement from top of screen
        allowed_max_y = self.height - max_y

        # 3) Generate a valid random position
        if allowed_min_x > allowed_max_x or allowed_min_y > allowed_max_y:
            # If polygon is too large, clamp to a default position
            random_x = max(0, allowed_min_x)
            random_y = max(0, allowed_min_y)  # Start from top of screen
        else:
            random_x = random.uniform(allowed_min_x, allowed_max_x)
            random_y = random.uniform(allowed_min_y, allowed_max_y)

        return random_x, random_y

    def draw(self, surface: pygame.Surface, debug_mode: bool = False, torus_world: bool = False) -> None:
        """
        Draw the chunk on a Pygame surface.
        In torus mode, handles drawing the chunk at multiple positions when crossing boundaries.
        The UI bar is treated as an overlay only - wrapping happens across the full screen.
        Args:
            surface (pygame.Surface): The surface to draw on.
            debug_mode (bool): Whether to draw debug outlines.
            torus_world (bool): Whether the simulation uses torus wrapping.
        """
        pos = self.body.position
        angle_degrees = math.degrees(-self.body.angle)
        rotated_surface = pygame.transform.rotate(self.segment_surface, angle_degrees)
        width, height = surface.get_size()
        
        # Determine if the chunk is crossing boundaries for torus mode
        if torus_world:
            # Get the bounding rectangle of the rotated surface
            rect = rotated_surface.get_rect(center=(int(pos.x), int(pos.y)))
            
            # Check if the chunk is crossing any of the screen boundaries
            positions_to_draw = [(pos.x, pos.y)]
            
            # Check horizontal boundaries
            if rect.left < 0:
                positions_to_draw.append((pos.x + width, pos.y))
            elif rect.right > width:
                positions_to_draw.append((pos.x - width, pos.y))
                
            # Check vertical boundaries - treat top of screen as top boundary (ignore UI bar)
            if rect.top < 0:
                positions_to_draw.append((pos.x, pos.y + height))
            elif rect.bottom > height:
                positions_to_draw.append((pos.x, pos.y - height))
                
            # Check corners (diagonal wrapping)
            if rect.left < 0 and rect.top < 0:
                positions_to_draw.append((pos.x + width, pos.y + height))
            elif rect.left < 0 and rect.bottom > height:
                positions_to_draw.append((pos.x + width, pos.y - height))
            elif rect.right > width and rect.top < 0:
                positions_to_draw.append((pos.x - width, pos.y + height))
            elif rect.right > width and rect.bottom > height:
                positions_to_draw.append((pos.x - width, pos.y - height))
            
            # Draw the chunk at all required positions
            for x, y in positions_to_draw:
                rect = rotated_surface.get_rect(center=(int(x), int(y)))
                surface.blit(rotated_surface, rect)
                
                # Draw debug outline if needed
                if debug_mode:
                    colors = self.config["colors"]
                    cos_a = math.cos(self.body.angle)
                    sin_a = math.sin(self.body.angle)
                    transformed_vertices = [
                        (
                            v.x * cos_a - v.y * sin_a + x,
                            v.x * sin_a + v.y * cos_a + y
                        )
                        for v in self.shape.get_vertices()
                    ]
                    pygame.draw.polygon(surface, colors["RED"], transformed_vertices, width=1)
        else:
            # Standard drawing for non-torus mode
            rect = rotated_surface.get_rect(center=(int(pos.x), int(pos.y)))
            surface.blit(rotated_surface, rect)
            
            if debug_mode:
                colors = self.config["colors"]
                cos_a = math.cos(self.body.angle)
                sin_a = math.sin(self.body.angle)
                transformed_vertices = [
                    (
                        v.x * cos_a - v.y * sin_a + pos.x,
                        v.x * sin_a + v.y * cos_a + pos.y
                    )
                    for v in self.shape.get_vertices()
                ]
                pygame.draw.polygon(surface, colors["RED"], transformed_vertices, width=1) 


class GluedChunk:
    """A chunk that has been attracted to glue and follows flocking behavior."""
    def __init__(self, chunk: Chunk, glue_center: Tuple[float, float], config: Dict[str, Any], tint_rgb: tuple):
        self.chunk = chunk
        self.glue_center = glue_center
        self.config = config
        self.tint_rgb = tint_rgb
        flocking_cfg = config["worm"]["glue"]["flocking"]
        self.maxspeed = flocking_cfg["maxspeed"]
        self.maxforce = flocking_cfg["maxforce"]
        self.desired_separation = flocking_cfg["desired_separation"]
        self.separate_force_mult = flocking_cfg["separate_force_mult"]
        self.seek_force_mult = flocking_cfg["seek_force_mult"]

    def apply_behaviors(self, glued_chunks: List['GluedChunk']) -> None:
        """Apply flocking behaviors (separation and seeking) to the chunk."""
        separate_force = self.separate(glued_chunks)
        seek_force = self.seek(self.glue_center)

        # Apply force multipliers
        separate_force = (separate_force[0] * self.separate_force_mult,
                          separate_force[1] * self.separate_force_mult)
        seek_force = (seek_force[0] * self.seek_force_mult,
                      seek_force[1] * self.seek_force_mult)

        # Apply forces
        self.apply_force(separate_force)
        self.apply_force(seek_force)

    def apply_force(self, force: Tuple[float, float]) -> None:
        """Apply a force to the chunk's body."""
        # Apply force at the body's center, not at local point (0,0)
        self.chunk.body.apply_force_at_world_point(force, self.chunk.body.position)

    def separate(self, glued_chunks: List['GluedChunk']) -> Tuple[float, float]:
        """Calculate separation force to avoid crowding other chunks."""
        sum_x, sum_y = 0, 0
        count = 0

        # Get current position
        pos = self.chunk.body.position

        # Check distance to every other chunk
        for other in glued_chunks:
            if other.chunk is not self.chunk:
                other_pos = other.chunk.body.position
                # Calculate distance between chunks
                dx = pos.x - other_pos.x
                dy = pos.y - other_pos.y
                d = math.sqrt(dx*dx + dy*dy)

                # If they're too close, calculate repulsion
                if d > 0 and d < self.desired_separation:
                    # Weighted by distance (closer = stronger force)
                    # Use inverse square law for more natural separation
                    force_strength = (self.desired_separation - d) / self.desired_separation
                    force_strength = min(force_strength, 1.0)  # Cap at 1.0
                    
                    # Normalize the direction vector
                    dx /= d
                    dy /= d
                    # Add to the sum with distance-based weighting
                    sum_x += dx * force_strength
                    sum_y += dy * force_strength
                    count += 1

        # Average the forces
        if count > 0:
            sum_x /= count
            sum_y /= count

            # Scale to maximum speed
            magnitude = math.sqrt(sum_x*sum_x + sum_y*sum_y)
            if magnitude > 0:
                sum_x = (sum_x / magnitude) * self.maxspeed
                sum_y = (sum_y / magnitude) * self.maxspeed

            # Convert to steering force by subtracting current velocity
            vel = self.chunk.body.velocity
            sum_x -= vel.x
            sum_y -= vel.y

            # Limit to maximum force
            magnitude = math.sqrt(sum_x*sum_x + sum_y*sum_y)
            if magnitude > self.maxforce:
                sum_x = (sum_x / magnitude) * self.maxforce
                sum_y = (sum_y / magnitude) * self.maxforce

        return (sum_x, sum_y)

    def seek(self, target: Tuple[float, float]) -> Tuple[float, float]:
        """Calculate seeking force toward target position."""
        # Vector pointing from location to target
        pos = self.chunk.body.position
        dx = target[0] - pos.x
        dy = target[1] - pos.y

        # Calculate distance to target
        distance = math.sqrt(dx*dx + dy*dy)
        
        # Normalize and scale to maximum speed
        if distance > 0:
            dx = (dx / distance) * self.maxspeed
            dy = (dy / distance) * self.maxspeed
        else:
            dx = dy = 0

        # Convert to steering force by subtracting current velocity
        vel = self.chunk.body.velocity
        dx -= vel.x
        dy -= vel.y

        # Limit to maximum force
        magnitude = math.sqrt(dx*dx + dy*dy)
        if magnitude > self.maxforce:
            dx = (dx / magnitude) * self.maxforce
            dy = (dy / magnitude) * self.maxforce

        return (dx, dy)

    def draw(self, surface: pygame.Surface, debug_mode: bool = False, torus_world: bool = False):
        # Draw the chunk normally
        self.chunk.draw(surface, debug_mode=debug_mode, torus_world=torus_world)
        # Draw a small dot at the centroid in the glue's color
        centroid = self.chunk.body.position
        pygame.draw.circle(surface, self.tint_rgb, (int(centroid.x), int(centroid.y)), 5)