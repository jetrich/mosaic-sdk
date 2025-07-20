"""Main FastAPI application for CI/CD testing."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import logging

from app.calculator import Calculator
from app.models import CalculationRequest, CalculationResponse, HealthResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Python CI/CD Test API",
    description="A test API for validating CI/CD pipelines",
    version="1.0.0",
)

# Initialize calculator
calculator = Calculator()


@app.get("/", response_model=Dict[str, str])
async def root() -> Dict[str, str]:
    """Root endpoint."""
    return {
        "message": "Python CI/CD Test API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="python-cicd-test",
        version="1.0.0",
    )


@app.post("/calculate", response_model=CalculationResponse)
async def calculate(request: CalculationRequest) -> CalculationResponse:
    """Perform calculation based on the request."""
    try:
        if request.operation == "add":
            result = calculator.add(request.a, request.b)
        elif request.operation == "subtract":
            result = calculator.subtract(request.a, request.b)
        elif request.operation == "multiply":
            result = calculator.multiply(request.a, request.b)
        elif request.operation == "divide":
            result = calculator.divide(request.a, request.b)
        elif request.operation == "power":
            result = calculator.power(request.a, request.b)
        elif request.operation == "sqrt":
            result = calculator.square_root(request.a)
        else:
            raise HTTPException(status_code=400, detail="Invalid operation")

        logger.info(f"Calculation: {request.a} {request.operation} {request.b} = {result}")
        
        return CalculationResponse(
            result=result,
            operation=request.operation,
            a=request.a,
            b=request.b,
        )
    except ValueError as e:
        logger.error(f"Calculation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/history", response_model=List[CalculationResponse])
async def get_history() -> List[CalculationResponse]:
    """Get calculation history (mock implementation)."""
    # In a real app, this would fetch from a database
    return [
        CalculationResponse(result=15.0, operation="add", a=10.0, b=5.0),
        CalculationResponse(result=50.0, operation="multiply", a=10.0, b=5.0),
    ]


@app.get("/operations", response_model=List[str])
async def list_operations() -> List[str]:
    """List available operations."""
    return ["add", "subtract", "multiply", "divide", "power", "sqrt"]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)