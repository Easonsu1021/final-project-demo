from pydantic import BaseModel, Field
from typing import List, Dict

class PredictionInputC(BaseModel):
    tool_height: float = Field(..., example=0.0, description="Tool Height (mm)")
    magnet: int = Field(..., example=10, description="Magnet Count")
    jig: float = Field(..., example=1.0, description="Jig Thickness (mm)")
    copper: int = Field(..., example=100, description="Copper Ratio (%)")
    b1: int = Field(..., example=40, description="Jig Center Hole B1 (mm)")
    w1: int = Field(..., example=47, description="Jig Center Hole W1 (mm)")
    substrate: int = Field(..., example=55, description="Substrate Size (mm)")
    sbthk_vals: List[float] = Field(..., min_items=33, max_items=33, description="Substrate Layer Thickness (33 values)")
    material_vals: List[float] = Field(..., min_items=7, max_items=7, description="Substrate Material Parameters (7 values)")

class PredictionInputS(BaseModel):
    magnet: int = Field(..., example=10, description="Magnet Count")
    jig: float = Field(..., example=1.0, description="Jig Thickness (mm)")
    copper: int = Field(..., example=100, description="Copper Ratio (%)")
    b1: int = Field(..., example=40, description="Jig Center Hole B1 (mm)")
    w1: int = Field(..., example=47, description="Jig Center Hole W1 (mm)")
    substrate: int = Field(..., example=55, description="Substrate Size (mm)")
    sbthk_vals: List[float] = Field(..., min_items=33, max_items=33, description="Substrate Layer Thickness (33 values)")
    material_vals: List[float] = Field(..., min_items=7, max_items=7, description="Substrate Material Parameters (7 values)")

class PlotData(BaseModel):
    x: List[float] = Field(..., description="X-axis grid coordinates (1D)")
    y: List[float] = Field(..., description="Y-axis grid coordinates (1D)")
    z: List[List[float | None]] = Field(..., description="Z-axis height values (2D grid)")

class PredictionOutput(BaseModel):
    warpage_um: float = Field(..., description="Predicted warpage value (μm)")
    input_summary: Dict[str, float | int | str]
    plot_data: PlotData

