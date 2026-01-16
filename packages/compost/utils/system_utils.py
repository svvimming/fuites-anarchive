"""System utility functions."""
import platform
import subprocess
import sys
from typing import List, Set

import pygame


def quit_program() -> None:
    """
    Quits the pygame program gracefully.
    """
    pygame.quit()
    sys.exit()


def open_file_dialog_sync(
    image_exts: Set[str],
    audio_exts: Set[str],
    timeout: int = 120
) -> List[str]:
    """
    Open a native file dialog for selecting multiple image/audio files.

    Cross-platform: macOS (osascript), Windows (PowerShell), Linux (zenity).
    This is a blocking call - run in a thread if needed.

    Args:
        image_exts: Set of image extensions (e.g. {'.png', '.jpg'})
        audio_exts: Set of audio extensions (e.g. {'.wav', '.mp3'})
        timeout: Dialog timeout in seconds

    Returns:
        List of selected file paths (empty if cancelled or error)
    """
    try:
        if platform.system() == "Darwin":  # macOS
            script = '''
                set fileList to choose file of type {"public.image", "public.audio"} with prompt "Select image or audio files" with multiple selections allowed
                set pathList to ""
                repeat with f in fileList
                    set pathList to pathList & POSIX path of f & linefeed
                end repeat
                return pathList
            '''
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True, text=True, timeout=timeout
            )
            return [p.strip() for p in result.stdout.strip().split('\n') if p.strip()]

        elif platform.system() == "Windows":
            exts = ";".join(f"*{e}" for e in image_exts | audio_exts)
            script = f'''
                Add-Type -AssemblyName System.Windows.Forms
                $d = New-Object System.Windows.Forms.OpenFileDialog
                $d.Multiselect = $true
                $d.Filter = "Media files|{exts}|All files|*.*"
                if ($d.ShowDialog() -eq 'OK') {{ $d.FileNames -join "`n" }}
            '''
            result = subprocess.run(
                ["powershell", "-Command", script],
                capture_output=True, text=True, timeout=timeout
            )
            return [p.strip() for p in result.stdout.strip().split('\n') if p.strip()]

        else:  # Linux - fallback to zenity
            all_exts = " ".join(f"*.{e.lstrip('.')}" for e in image_exts | audio_exts)
            result = subprocess.run(
                ["zenity", "--file-selection", "--multiple", "--separator=\n",
                 f"--file-filter=Media files | {all_exts}"],
                capture_output=True, text=True, timeout=timeout
            )
            return [p.strip() for p in result.stdout.strip().split('\n') if p.strip()]

    except subprocess.TimeoutExpired:
        return []
    except Exception:
        return []
