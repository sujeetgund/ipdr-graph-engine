from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from app.services.a2b_mapper import A2BMapper
from typing import List
from app.models.mapping import Edge, IPDRLog
import pandas as pd
import io
import logging


logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api/v1/mappings")


async def get_a2b_mapper() -> A2BMapper:
    from app.main import a2b_mapper

    if a2b_mapper is None:
        raise HTTPException(status_code=500, detail="A2B Mapper service not available")
    return a2b_mapper


@router.post("/map", response_model=List[Edge])
async def map_a_to_b(
    file: UploadFile = File(...), a2b_mapper: A2BMapper = Depends(get_a2b_mapper)
):
    # Check file type
    if not file.filename.endswith(".csv") or file.content_type != "text/csv":
        raise HTTPException(status_code=400, detail="File must be a CSV")

    # Read file content
    contents = await file.read()

    # Create DataFrame from CSV
    df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

    # Check for null values
    if df.isnull().values.any():
        logger.warning(
            f"Uploaded file contains {df.isnull().sum().sum()} null values. Rows with nulls will be dropped."
        )
        df = df.dropna()

    df.to_csv(
        "debug_uploaded_file.csv", index=False
    )  # Debug line to save the uploaded file

    # Check file format
    expected_columns = set(IPDRLog.__fields__.keys())
    actual_columns = set(df.columns)

    missing_columns = expected_columns - actual_columns
    if missing_columns:
        raise HTTPException(
            status_code=400, detail=f"Missing columns: {missing_columns}"
        )

    # Map A to B
    result = a2b_mapper.get_mappings(df)

    await a2b_mapper.cleanup()  # Ensure resources are cleaned up after processing
    return result
