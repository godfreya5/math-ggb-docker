import pytest
import os
from app.config import settings
from tests.conftest import register_and_login


@pytest.mark.asyncio
async def test_full_flow_upload(async_client):
    token = await register_and_login(async_client, "fullflow", "full@test.cn")
    headers = {"Authorization": f"Bearer {token}"}

    # Create session
    resp = await async_client.post("/api/sessions", json={"title": "测试题"}, headers=headers)
    assert resp.status_code == 201
    sid = resp.json()["id"]

    # Create a minimal valid PNG
    img_path = os.path.join(settings.upload_dir, "test.png")
    sig = b'\x89PNG\r\n\x1a\n'
    with open(img_path, 'wb') as f:
        f.write(sig)

    # Upload image
    with open(img_path, "rb") as f:
        resp = await async_client.post(
            f"/api/sessions/{sid}/upload",
            files={"file": ("test.png", f, "image/png")},
            headers=headers,
        )
    assert resp.status_code == 200
    assert resp.json()["filename"].endswith(".png")

    # Get messages (should be empty initially)
    resp = await async_client.get(f"/api/sessions/{sid}/messages", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 0

    # Cleanup
    if os.path.exists(img_path):
        os.remove(img_path)


@pytest.mark.asyncio
async def test_create_and_list_sessions(async_client):
    token = await register_and_login(async_client, "listtest", "list@test.cn")
    headers = {"Authorization": f"Bearer {token}"}

    await async_client.post("/api/sessions", json={"title": "A"}, headers=headers)
    await async_client.post("/api/sessions", json={"title": "B"}, headers=headers)

    resp = await async_client.get("/api/sessions", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_get_session(async_client):
    token = await register_and_login(async_client, "gettest", "get@test.cn")
    headers = {"Authorization": f"Bearer {token}"}

    resp = await async_client.post("/api/sessions", json={"title": "找三角形"}, headers=headers)
    sid = resp.json()["id"]

    resp = await async_client.get(f"/api/sessions/{sid}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "找三角形"


@pytest.mark.asyncio
async def test_unauthorized_session_access(async_client):
    token = await register_and_login(async_client, "owner", "owner@test.cn")
    headers = {"Authorization": f"Bearer {token}"}

    resp = await async_client.post("/api/sessions", json={"title": "私有"}, headers=headers)
    sid = resp.json()["id"]

    # Another user
    token2 = await register_and_login(async_client, "intruder", "bad@test.cn")
    headers2 = {"Authorization": f"Bearer {token2}"}

    resp = await async_client.get(f"/api/sessions/{sid}", headers=headers2)
    assert resp.status_code == 404
