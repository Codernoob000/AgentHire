from fastapi import FastAPI

app = FastAPI()

# 🔹 Dummy freelancer data
freelancers = [
    {"name": "John", "skills": ["react", "frontend"], "rating": 4.8, "experience": 3},
    {"name": "Alice", "skills": ["backend", "node"], "rating": 4.6, "experience": 4},
    {"name": "Bob", "skills": ["react", "ui"], "rating": 4.7, "experience": 2}
]

@app.get("/")
def home():
    return {"message": "Backend running 🚀"}


# 🔹 AI Recommendation Logic
def recommend_freelancer(project_desc):
    best = None
    best_score = 0

    for f in freelancers:
        score = 0

        # Skill match (IMPORTANT)
        if "react" in project_desc.lower() and "react" in f["skills"]:
            score += 5

        if "backend" in project_desc.lower() and "backend" in f["skills"]:
            score += 5

        # Add rating & experience
        score += f["rating"]
        score += f["experience"]

        if score > best_score:
            best_score = score
            best = f

    return best, best_score


# 🔹 API
@app.post("/recommend")
def recommend(data: dict):
    if "description" not in data:
        return {"error": "description is required"}

    result, score = recommend_freelancer(data["description"])

    return {
        "recommended_freelancer": result["name"],
        "rating": result["rating"],
        "experience": result["experience"],
        "match_score": score
    }
@app.post("/hire")
def hire(data: dict):
    if "freelancer" not in data:
        return {"error": "freelancer name required"}

    freelancer = data["freelancer"]

    return {
        "message": f"{freelancer} hired successfully",
        "tx_id": "TXN" + freelancer.upper() + "123"
    }

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)