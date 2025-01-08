from fastapi import FastAPI
from fastapi.responses import JSONResponse
from script import ClusterAnalyzer 

app = FastAPI()

@app.post("/analyze_clusters")
async def analyze_clusters():


    try:
            
        analyzer = ClusterAnalyzer(sentences_file='data.txt') 
        cluster_heads= analyzer.run()


        return JSONResponse(content={"cluster_heads": cluster_heads}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

