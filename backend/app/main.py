from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import init_db
from app.config import settings, FRONTEND_DIR
from app.routers import auth, sessions, chat, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Math GGB Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8765", "http://127.0.0.1:8765"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(chat.router, prefix="/api/sessions", tags=["chat"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Serve frontend SPA in production
if FRONTEND_DIR.exists():

    @app.get("/assets/{filename:path}")
    async def frontend_assets(filename: str):
        filepath = FRONTEND_DIR / "assets" / filename
        if filepath.exists():
            return FileResponse(filepath)
        return FileResponse(FRONTEND_DIR / "index.html")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str = ""):
        filepath = FRONTEND_DIR / full_path
        if full_path and filepath.exists():
            return FileResponse(filepath)
        return FileResponse(FRONTEND_DIR / "index.html")
