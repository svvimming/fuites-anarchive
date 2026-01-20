#!/usr/bin/env python3
"""
Image Segmentation Pipeline

Segments images using Felzenszwalb 2D segmentation,
extracts image chunks, and generates visualizations.
"""

import math
import numpy as np
import os
import sys
import time
import colorsys
import matplotlib.pyplot as plt
from PIL import Image
from skimage.segmentation import felzenszwalb, mark_boundaries
from skimage.util import img_as_ubyte
from matplotlib.colors import ListedColormap, hsv_to_rgb
from scipy.spatial import ConvexHull, QhullError

# Add parent directory for config import
sys.path.insert(0, '..')
import yaml

# =============================================================================
# CONFIGURATION
# =============================================================================

# Input
INPUT_IMAGE_PATH = "../thingies/images/IMG_0238 2.PNG"

# Output directory (auto-generated from input filename if None)
OUTPUT_DIR = None  # Will be set to "chunks_image_{input_filename}"

# Load config from yaml
def load_config():
    """Load configuration from config.yaml."""
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config.yaml')
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

CONFIG = load_config()

# Felzenszwalb segmentation parameters (from config)
FELZ_CONFIG = CONFIG.get("image", {}).get("segmentation", {}).get("felzenszwalb", {})
SCALE = FELZ_CONFIG.get("scale", 150)
SIGMA = FELZ_CONFIG.get("sigma", 3)
MIN_SIZE = FELZ_CONFIG.get("min_size", 20)

# Image filter parameters (from config)
IMAGE_FILTER = CONFIG.get("image", {}).get("segmentation", {}).get("chunk_filter", {})
MIN_VISIBLE_PIXELS = IMAGE_FILTER.get("min_visible_pixels", 30)
MIN_ALPHA_THRESHOLD = IMAGE_FILTER.get("min_alpha_threshold", 8)

# Screen dimensions for scaling (from config) - compost scales images to fit screen
WINDOW_CONFIG = CONFIG.get("simulation", {}).get("window", {})
SCREEN_WIDTH = WINDOW_CONFIG.get("width", 1728)
SCREEN_HEIGHT = WINDOW_CONFIG.get("height", 1117)
SCALE_TO_SCREEN = True  # Set to False to process at original resolution

# Visualization parameters
MAX_CHUNKS_GRID = 1000  # Maximum chunks to show in grid


def segment_image_felzenszwalb(
    image_path,
    output_dir,
    scale=150,
    sigma=3,
    min_size=20,
    min_visible_pixels=30,
    min_alpha_threshold=8,
    max_chunks=None,
    scale_to_screen=True,
    screen_width=1728,
    screen_height=1117,
):
    """
    2D Felzenszwalb image segmentation.

    Args:
        image_path: Path to input image
        output_dir: Output directory for visualizations
        scale: Felzenszwalb scale parameter
        sigma: Felzenszwalb sigma parameter
        min_size: Felzenszwalb min_size parameter
        min_visible_pixels: Minimum visible pixels for a segment
        min_alpha_threshold: Alpha threshold for visibility
        max_chunks: Maximum number of chunks to extract
        scale_to_screen: Whether to scale image to fit screen (like compost does)
        screen_width: Screen width for scaling
        screen_height: Screen height for scaling

    Returns:
        kept_segments: List of segment metadata dictionaries
        segments: Segment label array
        image_rgba: Original RGBA image
        unique_labels: Array of unique segment labels
        rgb_colors: List of RGB colors for each label
    """
    start_time = time.time()
    os.makedirs(output_dir, exist_ok=True)

    print(f"Loading image: {image_path}")
    img_pil = Image.open(image_path)

    # Convert to RGBA if needed
    if img_pil.mode != 'RGBA':
        img_pil = img_pil.convert('RGBA')

    orig_width, orig_height = img_pil.size

    # Scale to fit screen (same as compost queue_manager.py)
    if scale_to_screen:
        scale_ratio = min(screen_width / orig_width, screen_height / orig_height, 1.0)
        if scale_ratio < 1.0:
            new_width = int(orig_width * scale_ratio)
            new_height = int(orig_height * scale_ratio)
            img_pil = img_pil.resize((new_width, new_height), Image.LANCZOS)
            print(f"   Original: {orig_width}x{orig_height}")
            print(f"   Scaled to fit {screen_width}x{screen_height}: {new_width}x{new_height} (ratio: {scale_ratio:.3f})")

    image_rgba = np.array(img_pil)
    height, width = image_rgba.shape[:2]
    print(f"   Processing size: {width}x{height}, Mode: RGBA")

    # Extract RGB for segmentation
    image_rgb = image_rgba[:, :, :3]
    if image_rgb.dtype != np.uint8:
        image_rgb = img_as_ubyte(image_rgb)

    print(f"Running Felzenszwalb segmentation (scale={scale}, sigma={sigma}, min_size={min_size})...")
    segments = felzenszwalb(image_rgb, scale=scale, sigma=sigma, min_size=min_size)
    unique_labels = np.unique(segments)
    print(f"   Found {len(unique_labels)} initial segments")

    print("Extracting segments...")
    kept_segments = []
    filtered_count = 0
    filtered_by_coords = 0
    filtered_by_hull = 0
    filtered_by_visibility = 0

    # Generate colors for all labels
    n_labels = len(unique_labels)
    hsv_colors = [(i / n_labels, 0.8, 0.9) for i in range(n_labels)]
    rgb_colors = [hsv_to_rgb(c) for c in hsv_colors]
    np.random.seed(11)
    np.random.shuffle(rgb_colors)

    label_to_color = {label: rgb_colors[i % len(rgb_colors)] for i, label in enumerate(unique_labels)}

    for label in unique_labels:
        mask = (segments == label)
        coords = np.argwhere(mask)

        if len(coords) < 3:
            filtered_count += 1
            filtered_by_coords += 1
            continue

        # Calculate centroid and bounds
        centroid = coords.mean(axis=0)
        cy, cx = centroid
        min_y, min_x = coords.min(axis=0)
        max_y, max_x = coords.max(axis=0)

        seg_height = max_y - min_y + 1
        seg_width = max_x - min_x + 1

        # Extract segment surface as RGBA array
        segment_rgba = np.zeros((seg_height, seg_width, 4), dtype=np.uint8)
        for y, x in coords:
            segment_rgba[y - min_y, x - min_x] = image_rgba[y, x]

        # Compute convex hull vertices (same as image_processor.py)
        vertices = [(x - cx, y - cy) for (y, x) in coords]
        vertices_array = np.array(vertices)

        try:
            hull = ConvexHull(vertices_array)
            hull_vertices = [tuple(vertices_array[i]) for i in hull.vertices]
        except QhullError:
            filtered_count += 1
            filtered_by_hull += 1
            continue

        # Calculate hull bounding box
        hull_xs = [v[0] for v in hull_vertices]
        hull_ys = [v[1] for v in hull_vertices]
        hull_width = max(hull_xs) - min(hull_xs)
        hull_height = max(hull_ys) - min(hull_ys)

        surface_width = max(1, int(math.ceil(hull_width)))
        surface_height = max(1, int(math.ceil(hull_height)))

        # Create centered surface (same as image_processor.py)
        centered_rgba = np.zeros((surface_height, surface_width, 4), dtype=np.uint8)
        offset_x = surface_width / 2
        offset_y = surface_height / 2

        for y in range(seg_height):
            for x in range(seg_width):
                if segment_rgba[y, x, 3] > 0:  # Has alpha
                    blit_x = int(x - (cx - min_x) + offset_x)
                    blit_y = int(y - (cy - min_y) + offset_y)
                    if 0 <= blit_x < surface_width and 0 <= blit_y < surface_height:
                        centered_rgba[blit_y, blit_x] = segment_rgba[y, x]

        # Check minimum visibility on CENTERED surface (same as image_processor.py)
        visible_count = (centered_rgba[:, :, 3] >= min_alpha_threshold).sum()
        if visible_count < min_visible_pixels:
            filtered_count += 1
            filtered_by_visibility += 1
            continue

        # Calculate average color of segment
        valid_pixels = image_rgba[mask]
        avg_color = valid_pixels[:, :3].mean(axis=0) / 255.0

        # Calculate HSV color
        avg_h, avg_s, avg_v = colorsys.rgb_to_hsv(avg_color[0], avg_color[1], avg_color[2])

        segment_info = {
            "idx": len(kept_segments),
            "label": int(label),
            "min_x": int(min_x),
            "max_x": int(max_x),
            "min_y": int(min_y),
            "max_y": int(max_y),
            "width": int(seg_width),
            "height": int(seg_height),
            "surface_width": int(surface_width),
            "surface_height": int(surface_height),
            "centroid_x": float(cx),
            "centroid_y": float(cy),
            "area_pixels": int(mask.sum()),
            "visible_pixels": int(visible_count),
            "avg_color_rgb": tuple(avg_color),
            "avg_color_hsv": (float(avg_h), float(avg_s), float(avg_v)),
            "segment_color": label_to_color[label],
            "hull_vertices": hull_vertices,
        }
        kept_segments.append(segment_info)

        print(f"   Segment {len(kept_segments):3d}: {surface_width:4d}x{surface_height:4d} px (hull), area={mask.sum():6d}, visible={visible_count:5d}")

        if max_chunks is not None and len(kept_segments) >= max_chunks:
            break

    # Summary
    total_time = time.time() - start_time
    print(f"\nSummary:")
    print(f"   Processing time: {total_time:.2f}s")
    print(f"   Image size: {width}x{height}")
    print(f"   Total labels found: {len(unique_labels)}")
    print(f"   Filtered out: {filtered_count}")
    print(f"      - By coords (<3): {filtered_by_coords}")
    print(f"      - By hull (QhullError): {filtered_by_hull}")
    print(f"      - By visibility (<{min_visible_pixels}px): {filtered_by_visibility}")
    print(f"   Segments kept: {len(kept_segments)}")
    print(f"   Output directory: {output_dir}/")

    return kept_segments, segments, image_rgba, unique_labels, rgb_colors


def create_main_visualization(image_rgba, segments, unique_labels, rgb_colors, output_dir):
    """Create main 3-panel visualization: original, segments, boundaries."""
    print("Creating main visualization...")

    height, width = image_rgba.shape[:2]

    # Create figure with 3 panels (no normalized image)
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))

    # Panel 1: Original image
    axes[0].imshow(image_rgba)
    axes[0].set_title(f'Original Image ({width}x{height})')
    axes[0].axis('off')

    # Panel 2: Colored segments
    n_labels = len(unique_labels)
    unique_cmap = ListedColormap(rgb_colors)
    axes[1].imshow(segments, cmap=unique_cmap)
    axes[1].set_title(f'Felzenszwalb Particles ({n_labels} labels)')
    axes[1].axis('off')

    # Panel 3: Boundaries overlaid on original
    # Normalize image for boundary display
    image_norm = image_rgba[:, :, :3].astype(float) / 255.0
    boundary_img = mark_boundaries(image_norm, segments, color=(1, 1, 0), mode='thick')
    axes[2].imshow(boundary_img)
    axes[2].set_title('Particle Boundaries')
    axes[2].axis('off')

    plt.tight_layout()

    pdf_path = os.path.join(output_dir, "00_felzenszwalb_image_analysis.pdf")
    plt.savefig(pdf_path, format='pdf', dpi=300, bbox_inches='tight')
    plt.close()

    print(f"Saved: {pdf_path}")


def create_colored_segments_grid(kept_segments, segments, image_rgba, output_dir, max_chunks=100):
    """Create grid visualization of chunks with segment colors."""
    print("Creating colored segments grid...")

    N = min(len(kept_segments), max_chunks)
    if N == 0:
        print("   No segments to display")
        return

    cols = 4
    rows = int(np.ceil(N / cols))
    fig_grid, axes_grid = plt.subplots(rows, cols, figsize=(cols * 4, rows * 4.5))
    axes_grid = np.atleast_2d(axes_grid).reshape(rows, cols)

    for idx in range(rows * cols):
        r, c = idx // cols, idx % cols
        ax = axes_grid[r, c]

        if idx < N:
            seg = kept_segments[idx]
            label = seg["label"]
            color = seg["segment_color"]

            min_x, max_x = seg["min_x"], seg["max_x"]
            min_y, max_y = seg["min_y"], seg["max_y"]
            seg_width = seg["width"]
            seg_height = seg["height"]

            # Create chunk mask
            chunk_mask = (segments[min_y:max_y+1, min_x:max_x+1] == label)

            # Create colored chunk image
            colored_chunk = np.ones((seg_height, seg_width, 3))
            colored_chunk[chunk_mask] = color

            ax.imshow(colored_chunk, origin='upper', interpolation='nearest')
            ax.set_facecolor('white')

            # Title with segment info
            h, s, v = seg["avg_color_hsv"]
            title = (f"#{idx} Label {label}\n"
                     f"Size: {seg_width}x{seg_height}\n"
                     f"Area: {seg['area_pixels']} px\n"
                     f"HSV: ({h:.2f}, {s:.2f}, {v:.2f})")
            ax.set_title(title, fontsize=8, linespacing=1.2)
            ax.set_xticks([])
            ax.set_yticks([])
        else:
            ax.axis('off')

    plt.tight_layout()
    fig_grid.suptitle("Image Particles: Colored by Label", fontsize=14, y=1.002)

    pdf_path = os.path.join(output_dir, "01_image_chunks_grid_colored.pdf")
    plt.savefig(pdf_path, format='pdf', dpi=300, bbox_inches='tight')
    print(f"Saved: {pdf_path}")
    plt.close()


def create_actual_colors_grid(kept_segments, segments, image_rgba, output_dir, max_chunks=100):
    """Create grid visualization of chunks with actual image colors."""
    print("Creating actual colors grid...")

    N = min(len(kept_segments), max_chunks)
    if N == 0:
        print("   No segments to display")
        return

    cols = 4
    rows = int(np.ceil(N / cols))
    fig_grid, axes_grid = plt.subplots(rows, cols, figsize=(cols * 4, rows * 4.5))
    axes_grid = np.atleast_2d(axes_grid).reshape(rows, cols)

    for idx in range(rows * cols):
        r, c = idx // cols, idx % cols
        ax = axes_grid[r, c]

        if idx < N:
            seg = kept_segments[idx]
            label = seg["label"]

            min_x, max_x = seg["min_x"], seg["max_x"]
            min_y, max_y = seg["min_y"], seg["max_y"]
            seg_width = seg["width"]
            seg_height = seg["height"]

            # Create chunk mask
            chunk_mask = (segments[min_y:max_y+1, min_x:max_x+1] == label)

            # Extract actual image chunk with transparency
            chunk_rgba = np.zeros((seg_height, seg_width, 4), dtype=np.uint8)
            chunk_rgba[:, :, 3] = 255  # Start with full opacity white
            chunk_rgba[:, :, :3] = 255  # White background

            # Copy actual pixel values where mask is True
            region = image_rgba[min_y:max_y+1, min_x:max_x+1]
            chunk_rgba[chunk_mask] = region[chunk_mask]

            # For non-masked areas, make them transparent/white
            chunk_rgba[~chunk_mask, 3] = 0

            ax.imshow(chunk_rgba, origin='upper', interpolation='nearest')
            ax.set_facecolor('white')

            # Title with segment info
            avg_rgb = seg["avg_color_rgb"]
            title = (f"#{idx} Label {label}\n"
                     f"Size: {seg_width}x{seg_height}\n"
                     f"Area: {seg['area_pixels']} px\n"
                     f"RGB: ({avg_rgb[0]:.2f}, {avg_rgb[1]:.2f}, {avg_rgb[2]:.2f})")
            ax.set_title(title, fontsize=8, linespacing=1.2)
            ax.set_xticks([])
            ax.set_yticks([])
        else:
            ax.axis('off')

    plt.tight_layout()
    fig_grid.suptitle("Image Particles: Felzenszwalb Segmentation", fontsize=14, y=1.002)

    pdf_path = os.path.join(output_dir, "02_image_chunks_grid_actual.pdf")
    plt.savefig(pdf_path, format='pdf', dpi=300, bbox_inches='tight')
    print(f"Saved: {pdf_path}")
    plt.close()


def export_particles_as_png(kept_segments, segments, image_rgba, output_dir):
    """Export each particle as an individual PNG file."""
    print("Exporting individual particles as PNG...")

    particles_dir = os.path.join(output_dir, "particles")
    os.makedirs(particles_dir, exist_ok=True)

    for seg in kept_segments:
        idx = seg["idx"]
        label = seg["label"]
        min_x, max_x = seg["min_x"], seg["max_x"]
        min_y, max_y = seg["min_y"], seg["max_y"]
        seg_width = seg["width"]
        seg_height = seg["height"]

        # Create chunk mask
        chunk_mask = (segments[min_y:max_y+1, min_x:max_x+1] == label)

        # Extract actual image chunk with transparency
        chunk_rgba = np.zeros((seg_height, seg_width, 4), dtype=np.uint8)

        # Copy actual pixel values where mask is True
        region = image_rgba[min_y:max_y+1, min_x:max_x+1]
        chunk_rgba[chunk_mask] = region[chunk_mask]

        # Save as PNG
        img_pil = Image.fromarray(chunk_rgba, mode='RGBA')
        png_path = os.path.join(particles_dir, f"particle_{idx:03d}_label_{label}.png")
        img_pil.save(png_path)

    print(f"Saved {len(kept_segments)} particles to {particles_dir}/")


def main():
    """Main entry point."""
    # Determine output directory
    output_dir = OUTPUT_DIR
    if output_dir is None:
        input_name = os.path.splitext(os.path.basename(INPUT_IMAGE_PATH))[0]
        output_dir = f"chunks_image_{input_name}"

    print("=" * 60)
    print("IMAGE SEGMENTATION")
    print("=" * 60)
    print(f"Input:  {INPUT_IMAGE_PATH}")
    print(f"Output: {output_dir}/")
    print(f"Config: scale={SCALE}, sigma={SIGMA}, min_size={MIN_SIZE}")
    print(f"Screen: {SCREEN_WIDTH}x{SCREEN_HEIGHT} (scale_to_screen={SCALE_TO_SCREEN})")
    print("=" * 60)

    # Run segmentation
    kept_segments, segments, image_rgba, unique_labels, rgb_colors = segment_image_felzenszwalb(
        INPUT_IMAGE_PATH,
        output_dir=output_dir,
        scale=SCALE,
        sigma=SIGMA,
        min_size=MIN_SIZE,
        min_visible_pixels=MIN_VISIBLE_PIXELS,
        min_alpha_threshold=MIN_ALPHA_THRESHOLD,
        max_chunks=MAX_CHUNKS_GRID,
        scale_to_screen=SCALE_TO_SCREEN,
        screen_width=SCREEN_WIDTH,
        screen_height=SCREEN_HEIGHT,
    )

    if not kept_segments:
        print("No segments extracted. Exiting.")
        return

    # Create visualizations
    print("\nGenerating visualizations...")
    create_main_visualization(image_rgba, segments, unique_labels, rgb_colors, output_dir)
    create_colored_segments_grid(kept_segments, segments, image_rgba, output_dir, max_chunks=MAX_CHUNKS_GRID)
    create_actual_colors_grid(kept_segments, segments, image_rgba, output_dir, max_chunks=MAX_CHUNKS_GRID)

    # Export individual particles as PNG
    print("\nExporting particles...")
    export_particles_as_png(kept_segments, segments, image_rgba, output_dir)

    print("\n" + "=" * 60)
    print("DONE")
    print(f"Output saved to: {output_dir}/")
    print("=" * 60)


if __name__ == "__main__":
    main()
