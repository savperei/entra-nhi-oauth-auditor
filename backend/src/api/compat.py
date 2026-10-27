"""Compatibility fallbacks for FastAPI components when running in minimal/offline environments."""

try:
    from fastapi import APIRouter, FastAPI, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import HTMLResponse, JSONResponse, Response
except ImportError:

    class HTTPException(Exception):
        def __init__(self, status_code: int = 400, detail: str = ""):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail

    def Query(default=None, **kwargs):
        return default

    class Response:
        def __init__(self, content="", media_type="text/plain", headers=None, status_code=200):
            if isinstance(content, str):
                self.body = content.encode("utf-8")
                self.text = content
            elif isinstance(content, bytes):
                self.body = content
                self.text = content.decode("utf-8", errors="replace")
            else:
                self.body = b""
                self.text = ""
            self.content = content
            self.media_type = media_type
            self.headers = headers or {}
            self.status_code = status_code

    class JSONResponse(Response):
        def __init__(self, content, headers=None, status_code=200):
            import json
            super().__init__(
                content=json.dumps(content),
                media_type="application/json",
                headers=headers,
                status_code=status_code,
            )
            self.content = content

    class HTMLResponse(Response):
        def __init__(self, content, headers=None, status_code=200):
            super().__init__(
                content=content,
                media_type="text/html",
                headers=headers,
                status_code=status_code,
            )

    class APIRouter:
        def __init__(self, prefix: str = "", tags: list | None = None):
            self.prefix = prefix
            self.tags = tags or []
            self.routes = []

        def get(self, path: str, **kwargs):
            def decorator(func):
                self.routes.append(("GET", self.prefix + path, func))
                return func
            return decorator

        def post(self, path: str, **kwargs):
            def decorator(func):
                self.routes.append(("POST", self.prefix + path, func))
                return func
            return decorator

        def include_router(self, router):
            for method, path, func in router.routes:
                self.routes.append((method, self.prefix + path, func))

    class FastAPI(APIRouter):
        def __init__(self, title: str = "", version: str = "", description: str = ""):
            super().__init__()
            self.title = title
            self.version = version
            self.description = description
            self.middleware_stack = []

        def add_middleware(self, middleware_cls, **kwargs):
            self.middleware_stack.append((middleware_cls, kwargs))

        def on_event(self, event_type: str):
            def decorator(func):
                if event_type == "startup":
                    func()
                return func
            return decorator

    class CORSMiddleware:
        pass

