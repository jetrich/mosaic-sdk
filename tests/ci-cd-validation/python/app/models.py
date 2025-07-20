"""Pydantic models for the API."""

from pydantic import BaseModel, Field
from typing import Optional, Literal


class CalculationRequest(BaseModel):
    """Request model for calculation endpoint."""

    a: float = Field(..., description="First operand")
    b: Optional[float] = Field(None, description="Second operand (optional for sqrt)")
    operation: Literal["add", "subtract", "multiply", "divide", "power", "sqrt"] = Field(
        ..., description="Operation to perform"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "a": 10.0,
                "b": 5.0,
                "operation": "add",
            }
        }


class CalculationResponse(BaseModel):
    """Response model for calculation endpoint."""

    result: float = Field(..., description="Calculation result")
    operation: str = Field(..., description="Operation performed")
    a: float = Field(..., description="First operand")
    b: Optional[float] = Field(None, description="Second operand")

    class Config:
        json_schema_extra = {
            "example": {
                "result": 15.0,
                "operation": "add",
                "a": 10.0,
                "b": 5.0,
            }
        }


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""

    status: str = Field(..., description="Health status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "service": "python-cicd-test",
                "version": "1.0.0",
            }
        }