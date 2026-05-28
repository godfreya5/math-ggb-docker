import sys
from pathlib import Path
from pydantic_settings import BaseSettings


def _get_app_dir() -> Path:
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent.parent


APP_DIR = _get_app_dir()
DATA_DIR = APP_DIR / "data"
FRONTEND_DIR = APP_DIR / "frontend" / "dist"


class Settings(BaseSettings):
    database_url: str = f"sqlite+aiosqlite:///{DATA_DIR / 'math_ggb.db'}"
    secret_key: str = "change-me-to-a-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 168
    llm_provider: str = "zhipu"
    llm_api_key: str = ""
    llm_base_url: str = "https://open.bigmodel.cn/api/paas/v4/"
    llm_model: str = "glm-4v"
    upload_dir: str = str(DATA_DIR / "uploads")

    class Config:
        env_file = str(APP_DIR / ".env")


settings = Settings()

DATA_DIR.mkdir(parents=True, exist_ok=True)
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
