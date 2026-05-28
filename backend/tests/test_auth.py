import pytest

@pytest.mark.asyncio
async def test_register(async_client):
    resp = await async_client.post("/api/auth/register", json={
        "username": "teacher1", "email": "t1@school.cn", "password": "pass123"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["username"] == "teacher1"

@pytest.mark.asyncio
async def test_login(async_client):
    await async_client.post("/api/auth/register", json={
        "username": "teacher2", "email": "t2@school.cn", "password": "pass123"
    })
    resp = await async_client.post("/api/auth/login", json={
        "email": "t2@school.cn", "password": "pass123"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()

@pytest.mark.asyncio
async def test_login_wrong_password(async_client):
    await async_client.post("/api/auth/register", json={
        "username": "teacher3", "email": "t3@school.cn", "password": "pass123"
    })
    resp = await async_client.post("/api/auth/login", json={
        "email": "t3@school.cn", "password": "wrong"
    })
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_duplicate_register(async_client):
    await async_client.post("/api/auth/register", json={
        "username": "teacher4", "email": "t4@school.cn", "password": "pass123"
    })
    resp = await async_client.post("/api/auth/register", json={
        "username": "teacher4", "email": "t4@school.cn", "password": "pass123"
    })
    assert resp.status_code == 400
