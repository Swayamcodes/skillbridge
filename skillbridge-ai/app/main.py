from fastapi import FastAPI

from app.routes.match import router as match_router

app = FastAPI(title="SkillBridge AI Service")

app.include_router(match_router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "SkillBridge AI service is running"}
