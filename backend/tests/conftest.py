import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.database import Base, get_db
from app.main import app

TEST_DB = "sqlite+aiosqlite:///./test.db"


@pytest_asyncio.fixture
async def async_client():
    engine = create_async_engine(TEST_DB, echo=False)
    test_async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with test_async_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def register_and_login(async_client, username="testuser", email="test@test.cn"):
    resp = await async_client.post("/api/auth/register", json={
        "username": username, "email": email, "password": "pass"
    })
    return resp.json()["access_token"]
