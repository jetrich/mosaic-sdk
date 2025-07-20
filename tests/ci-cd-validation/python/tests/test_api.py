"""API tests for the FastAPI application."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


class TestAPI:
    """Test cases for the API endpoints."""

    @pytest.fixture
    def client(self):
        """Provide a test client for the API."""
        return TestClient(app)

    def test_root(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Python CI/CD Test API"
        assert data["version"] == "1.0.0"
        assert data["status"] == "running"

    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "python-cicd-test"
        assert data["version"] == "1.0.0"

    def test_calculate_add(self, client):
        """Test calculation endpoint with addition."""
        response = client.post(
            "/calculate",
            json={"a": 10, "b": 5, "operation": "add"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["result"] == 15
        assert data["operation"] == "add"
        assert data["a"] == 10
        assert data["b"] == 5

    def test_calculate_subtract(self, client):
        """Test calculation endpoint with subtraction."""
        response = client.post(
            "/calculate",
            json={"a": 10, "b": 3, "operation": "subtract"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["result"] == 7

    def test_calculate_multiply(self, client):
        """Test calculation endpoint with multiplication."""
        response = client.post(
            "/calculate",
            json={"a": 4, "b": 5, "operation": "multiply"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["result"] == 20

    def test_calculate_divide(self, client):
        """Test calculation endpoint with division."""
        response = client.post(
            "/calculate",
            json={"a": 20, "b": 4, "operation": "divide"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["result"] == 5

    def test_calculate_divide_by_zero(self, client):
        """Test calculation endpoint with division by zero."""
        response = client.post(
            "/calculate",
            json={"a": 10, "b": 0, "operation": "divide"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "Division by zero" in data["detail"]

    def test_calculate_power(self, client):
        """Test calculation endpoint with power operation."""
        response = client.post(
            "/calculate",
            json={"a": 2, "b": 3, "operation": "power"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["result"] == 8

    def test_calculate_sqrt(self, client):
        """Test calculation endpoint with square root."""
        response = client.post(
            "/calculate",
            json={"a": 16, "operation": "sqrt"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["result"] == 4

    def test_calculate_invalid_operation(self, client):
        """Test calculation endpoint with invalid operation."""
        response = client.post(
            "/calculate",
            json={"a": 10, "b": 5, "operation": "invalid"}
        )
        assert response.status_code == 422  # Pydantic validation error

    def test_calculate_missing_fields(self, client):
        """Test calculation endpoint with missing fields."""
        response = client.post(
            "/calculate",
            json={"a": 10}
        )
        assert response.status_code == 422

    def test_calculate_invalid_types(self, client):
        """Test calculation endpoint with invalid types."""
        response = client.post(
            "/calculate",
            json={"a": "ten", "b": 5, "operation": "add"}
        )
        assert response.status_code == 422

    def test_history(self, client):
        """Test history endpoint."""
        response = client.get("/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["operation"] == "add"
        assert data[1]["operation"] == "multiply"

    def test_list_operations(self, client):
        """Test operations listing endpoint."""
        response = client.get("/operations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert "add" in data
        assert "subtract" in data
        assert "multiply" in data
        assert "divide" in data
        assert "power" in data
        assert "sqrt" in data

    @pytest.mark.asyncio
    async def test_concurrent_requests(self, client):
        """Test API can handle concurrent requests."""
        import asyncio
        import httpx

        async def make_request():
            async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
                response = await ac.post(
                    "/calculate",
                    json={"a": 10, "b": 5, "operation": "add"}
                )
                return response

        # Make 10 concurrent requests
        tasks = [make_request() for _ in range(10)]
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
            assert response.json()["result"] == 15