import pytest


@pytest.mark.asyncio
async def test_create_session(async_client):
    resp = await async_client.post("/api/auth/register", json={
        "username": "s1", "email": "s1@test.cn", "password": "pass"
    })
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await async_client.post("/api/sessions", json={"title": "三角形题目"}, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["title"] == "三角形题目"


@pytest.mark.asyncio
async def test_list_sessions(async_client):
    resp = await async_client.post("/api/auth/register", json={
        "username": "s2", "email": "s2@test.cn", "password": "pass"
    })
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await async_client.post("/api/sessions", json={"title": "题目1"}, headers=headers)
    await async_client.post("/api/sessions", json={"title": "题目2"}, headers=headers)

    resp = await async_client.get("/api/sessions", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_delete_session(async_client):
    resp = await async_client.post("/api/auth/register", json={
        "username": "s3", "email": "s3@test.cn", "password": "pass"
    })
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await async_client.post("/api/sessions", json={"title": "to delete"}, headers=headers)
    sid = resp.json()["id"]
    resp = await async_client.delete(f"/api/sessions/{sid}", headers=headers)
    assert resp.status_code == 204

    resp = await async_client.get("/api/sessions", headers=headers)
    assert len(resp.json()) == 0


@pytest.mark.asyncio
async def test_unauthorized_access(async_client):
    resp = await async_client.get("/api/sessions")
    assert resp.status_code == 403
