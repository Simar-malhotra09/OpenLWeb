import os
import json
import traceback
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from graph import Graph

app = FastAPI()

def file_exists(filepath: str) -> bool:
    return os.path.exists(filepath) and os.path.isfile(filepath)

@app.post("/expose_json_data")
async def expose_json_data():
    try:
        # Resolve paths relative to this file's location
        base_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(base_dir, "data.csv")
        json_path = os.path.join(base_dir, "output_graph.json")

        # Check if CSV file exists
        if not file_exists(csv_path):
            return JSONResponse(
                content={"error": f"CSV file not found at {csv_path}"},
                status_code=400
            )

        # Process the graph
        g = Graph(csv_path, json_path)
        g.make_file()
        g.populate_json_from_csv()

        # Check if JSON output file was created
        if not file_exists(json_path):
            return JSONResponse(
                content={"error": f"Graph JSON not found at {json_path}"},
                status_code=500
            )

        # Load and return JSON data
        with open(json_path, "r") as f:
            json_data = json.load(f)

        # Basic format check
        if not isinstance(json_data, dict) or "nodes" not in json_data or "links" not in json_data:
            return JSONResponse(
                content={"error": "Malformed graph JSON structure"},
                status_code=500
            )

        return JSONResponse(content=json_data, status_code=200)

    except Exception as e:
        # Print full traceback in terminal
        print("An exception occurred:", str(e))
        traceback.print_exc()
        return JSONResponse(
            content={"error": f"Internal server error: {str(e)}"},
            status_code=500
        )


