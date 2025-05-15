import json
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from graph import Graph

app = FastAPI()

@app.post("/expose_json_data")
async def expose_json_data():
    try:
        csv_path = "./data.csv"
        json_path = "./output_graph.json"

        g = Graph(csv_path, json_path)
        g.make_file()
        g.populate_json_from_csv()

        with open(json_path, "r") as f:
            json_data = json.load(f)  # parse JSON string into dict

        return JSONResponse(content=json_data, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
