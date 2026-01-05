"""HTTP upload server."""
import threading
from flask import Flask, request, jsonify
from urllib.request import urlopen, Request
from urllib.parse import urlparse
from typing import Dict, Any, Callable


class UploadServer:
    """Flask-based HTTP server for receiving image uploads."""

    def __init__(
        self,
        host: str,
        port: int,
        config: Dict[str, Any],
        enqueue_callback: Callable[[bytes, int, int], None]
    ):
        """
        Initialize the upload server.

        Args:
            host: Host address to bind to
            port: Port to listen on
            config: Server configuration
            enqueue_callback: Callback to enqueue image bytes (bytes, width, height)
        """
        self.host = host
        self.port = port
        self.config = config
        self.enqueue_callback = enqueue_callback
        self.app = None
        self.thread = None

        # Server limits
        server_cfg = config.get("server", {})
        self.max_download_bytes = int(server_cfg.get("max_download_bytes", 25 * 1024 * 1024))
        self.download_timeout = int(server_cfg.get("download_timeout_sec", 15))

    def start(self) -> None:
        """Start the upload server in a background thread."""
        self.app = self._create_app()
        self.thread = threading.Thread(
            target=self._run_server,
            name="upload-server",
            daemon=True
        )
        self.thread.start()
        print(f"Upload server listening on http://{self.host}:{self.port}")

    def _create_app(self) -> Flask:
        """Create Flask app with routes."""
        app = Flask(__name__)

        @app.get("/health")
        def health():
            return jsonify({"status": "ok"})

        @app.post("/post-compost-upload")
        def post_compost_upload():
            # Accept only a URL to a file; we will download in-memory and process
            url = None
            target_width = None
            target_height = None

            if request.is_json:
                payload = request.get_json(silent=True) or {}
                thingie = payload.get("thingie")
                if thingie and thingie.get("file_ref"):
                    url = thingie.get("file_ref").get("file_url")
                    # Extract width and height from the 'at' object if available
                    at_obj = thingie.get("at")
                    if at_obj:
                        if "width" in at_obj:
                            target_width = at_obj.get("width")
                            print(f"Extracted target width from JSON: {target_width}")
                        if "height" in at_obj:
                            target_height = at_obj.get("height")
                            print(f"Extracted target height from JSON: {target_height}")

            if not url:
                return jsonify({"ok": False, "error": "missing 'url'"}), 400

            # Basic URL validation
            parsed = urlparse(url)
            if parsed.scheme not in ("http", "https") or not parsed.netloc:
                return jsonify({"ok": False, "error": "invalid url"}), 400

            # Download with size limit and timeout
            try:
                req = Request(url, headers={"User-Agent": "fuites-compost/1.0"})
                with urlopen(req, timeout=self.download_timeout) as resp:
                    # Read with cap
                    data_chunks = []
                    total = 0
                    chunk_size = 256 * 1024
                    while True:
                        chunk = resp.read(chunk_size)
                        if not chunk:
                            break
                        total += len(chunk)
                        if total > self.max_download_bytes:
                            return jsonify({"ok": False, "error": "file too large"}), 413
                        data_chunks.append(chunk)
                    data = b"".join(data_chunks)
            except Exception as exc:
                return jsonify({"ok": False, "error": f"download failed: {exc}"}), 502

            if not data:
                return jsonify({"ok": False, "error": "empty response"}), 502

            # Enqueue for main-thread processing and return quickly
            try:
                if target_width is not None and target_height is not None:
                    print(f"Enqueueing image with target dimensions: {target_width}x{target_height}")
                else:
                    print("Enqueueing image without target dimensions")
                self.enqueue_callback(data, target_width, target_height)
                return jsonify({"ok": True}), 200
            except Exception as exc:
                return jsonify({"ok": False, "error": str(exc)}), 500

        return app

    def _run_server(self) -> None:
        """Run Flask server."""
        self.app.run(
            host=self.host,
            port=self.port,
            debug=False,
            use_reloader=False,
            threaded=True
        )
