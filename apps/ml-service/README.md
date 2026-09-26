# OneMoon ML Service (`apps/ml-service`)

FastAPI microservice for email heuristics, NLP threat modeling, phishing detection, and URL classification.

## Requirements

- Python 3.10+
- Dependencies listed in `requirements.txt`

## Running Locally

```bash
# Optional: create a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server with Uvicorn
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /health`: Returns service health status
- `GET /docs`: Swagger UI OpenAPI documentation
