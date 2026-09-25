"""End-to-end tests for every /api/tasks endpoint (via the ASGI app)."""


async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


async def test_list_empty(client):
    resp = await client.get("/api/tasks")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_filters_by_status(client, fake_repo):
    fake_repo.seed(title="A", status="todo")
    fake_repo.seed(title="B", status="done")
    fake_repo.seed(title="C", status="done")

    resp = await client.get("/api/tasks", params={"status": "done"})
    assert resp.status_code == 200
    titles = [t["title"] for t in resp.json()]
    assert titles == ["B", "C"]


async def test_list_rejects_unknown_status(client):
    resp = await client.get("/api/tasks", params={"status": "archived"})
    assert resp.status_code == 422


async def test_get_single_task(client, fake_repo):
    task = fake_repo.seed(title="Wire endpoint")
    resp = await client.get(f"/api/tasks/{task.id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Wire endpoint"
    assert resp.json()["comment_count"] == 0


async def test_list_includes_comment_count(client, fake_repo, fake_comments):
    task = fake_repo.seed(title="Discuss")
    fake_comments.seed(task.id, body="One")
    fake_comments.seed(task.id, body="Two")
    resp = await client.get("/api/tasks")
    assert resp.status_code == 200
    assert resp.json()[0]["comment_count"] == 2


async def test_get_missing_task_returns_404(client):
    resp = await client.get("/api/tasks/999")
    assert resp.status_code == 404


async def test_create_task(client):
    resp = await client.post(
        "/api/tasks",
        json={"title": "New task", "description": "desc", "assignee": "Sam"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] == 1
    assert body["status"] == "todo"
    assert body["assignee"] == "Sam"


async def test_create_task_requires_title(client):
    resp = await client.post("/api/tasks", json={"description": "no title"})
    assert resp.status_code == 422


async def test_create_task_rejects_bad_status(client):
    resp = await client.post("/api/tasks", json={"title": "x", "status": "nope"})
    assert resp.status_code == 422


async def test_update_task(client, fake_repo):
    task = fake_repo.seed(title="Old", status="todo")
    resp = await client.put(
        f"/api/tasks/{task.id}",
        json={"title": "Updated", "status": "in-progress"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Updated"
    assert body["status"] == "in-progress"


async def test_update_missing_task_returns_404(client):
    resp = await client.put("/api/tasks/999", json={"title": "x", "status": "todo"})
    assert resp.status_code == 404


async def test_delete_task(client, fake_repo):
    task = fake_repo.seed()
    resp = await client.delete(f"/api/tasks/{task.id}")
    assert resp.status_code == 204

    follow_up = await client.get(f"/api/tasks/{task.id}")
    assert follow_up.status_code == 404


async def test_delete_missing_task_returns_404(client):
    resp = await client.delete("/api/tasks/999")
    assert resp.status_code == 404


async def test_count_returns_total(client, fake_repo):
    fake_repo.seed(title="A", status="todo")
    fake_repo.seed(title="B", status="done")

    resp = await client.get("/api/tasks/count")
    assert resp.status_code == 200
    assert resp.json() == {"count": 2}


async def test_count_filters_by_status(client, fake_repo):
    fake_repo.seed(title="A", status="todo")
    fake_repo.seed(title="B", status="done")

    resp = await client.get("/api/tasks/count", params={"status": "done"})
    assert resp.status_code == 200
    assert resp.json() == {"count": 1}


async def test_count_rejects_unknown_status(client):
    resp = await client.get("/api/tasks/count", params={"status": "archived"})
    assert resp.status_code == 422


async def test_list_search_case_insensitive_title_contains(client, fake_repo):
    fake_repo.seed(title="Wire up the board UI", status="todo")
    fake_repo.seed(title="Other task", status="todo")

    resp = await client.get("/api/tasks", params={"q": "wire"})
    assert resp.status_code == 200
    titles = [t["title"] for t in resp.json()]
    assert titles == ["Wire up the board UI"]


async def test_list_search_matches_description_or_assignee(client, fake_repo):
    fake_repo.seed(title="A", description="Deploy to staging", assignee=None)
    fake_repo.seed(title="B", description=None, assignee="Ana")
    fake_repo.seed(title="C", description="noop", assignee="Sam")

    by_desc = await client.get("/api/tasks", params={"q": "staging"})
    assert [t["title"] for t in by_desc.json()] == ["A"]

    by_assignee = await client.get("/api/tasks", params={"q": "ana"})
    assert [t["title"] for t in by_assignee.json()] == ["B"]


async def test_list_search_matches_full_stored_description(client, fake_repo):
    long_desc = "Visible summary. " + ("hidden detail " * 20) + "needlephrase"
    fake_repo.seed(title="Card", description=long_desc)
    fake_repo.seed(title="Other", description="no match here")

    resp = await client.get("/api/tasks", params={"q": "needlephrase"})
    assert resp.status_code == 200
    assert [t["title"] for t in resp.json()] == ["Card"]


async def test_list_inactive_q_returns_unfiltered(client, fake_repo):
    fake_repo.seed(title="One")
    fake_repo.seed(title="Two")

    missing = await client.get("/api/tasks")
    short = await client.get("/api/tasks", params={"q": "ab"})
    whitespace = await client.get("/api/tasks", params={"q": "   "})

    assert missing.status_code == 200
    assert short.json() == missing.json()
    assert whitespace.json() == missing.json()


async def test_list_q_truncated_at_200(client, fake_repo):
    needle = "x" * 200
    fake_repo.seed(title="Hit", description=needle + "TAIL")
    fake_repo.seed(title="Miss", description="y" * 50)

    # Client sends >200 chars; server truncates to 200 before matching.
    resp = await client.get("/api/tasks", params={"q": needle + "EXTRA"})
    assert resp.status_code == 200
    assert [t["title"] for t in resp.json()] == ["Hit"]


async def test_list_status_and_q_intersection(client, fake_repo):
    fake_repo.seed(title="Keep", status="in-progress", assignee="Ana")
    fake_repo.seed(title="Wrong status", status="todo", assignee="Ana")
    fake_repo.seed(title="Wrong query", status="in-progress", assignee="Sam")

    resp = await client.get(
        "/api/tasks", params={"status": "in-progress", "q": "ana"}
    )
    assert resp.status_code == 200
    assert [t["title"] for t in resp.json()] == ["Keep"]


async def test_list_inactive_q_with_status_is_status_only(client, fake_repo):
    fake_repo.seed(title="A", status="todo")
    fake_repo.seed(title="B", status="done")

    status_only = await client.get("/api/tasks", params={"status": "todo"})
    short_q = await client.get("/api/tasks", params={"status": "todo", "q": "ab"})
    blank_q = await client.get("/api/tasks", params={"status": "todo", "q": "   "})

    assert short_q.json() == status_only.json()
    assert blank_q.json() == status_only.json()


async def test_list_active_q_no_matches_returns_empty_array(client, fake_repo):
    fake_repo.seed(title="Something")
    resp = await client.get("/api/tasks", params={"q": "zzzz-no-match"})
    assert resp.status_code == 200
    assert resp.json() == []
