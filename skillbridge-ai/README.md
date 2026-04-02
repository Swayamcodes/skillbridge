# SkillBridge AI Service

## Run locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --app-dir .
```

## Available endpoint

- `POST /api/match-applicants`

This service is intended to rank applicants against a gig using skill overlap.
