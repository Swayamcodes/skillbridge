from __future__ import annotations

from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def recommend_gigs(user_skills: list, open_gigs: list) -> list[dict[str, Any]]:
    if not isinstance(user_skills, list):
        raise ValueError("user_skills must be a list")
    if not isinstance(open_gigs, list):
        raise ValueError("open_gigs must be a list")

    normalized_skills = [str(skill).strip() for skill in user_skills if str(skill).strip()]
    if not normalized_skills or not open_gigs:
        return []

    user_text = " ".join(normalized_skills)
    gig_records: list[dict[str, Any]] = []

    for gig in open_gigs:
        if not isinstance(gig, dict):
            continue

        title = str(gig.get("title", "")).strip()
        description = str(gig.get("description", "")).strip()
        skills_required = gig.get("skills_required", [])

        if not isinstance(skills_required, list):
            skills_required = []

        combined_text = " ".join(
            part for part in [title, description, " ".join(str(skill) for skill in skills_required)] if part
        ).strip()

        gig_records.append(
            {
                "gig_id": gig.get("id"),
                "title": title,
                "text": combined_text,
            }
        )

    valid_gigs = [gig for gig in gig_records if gig["text"]]
    if not valid_gigs:
        return []

    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform([user_text, *[gig["text"] for gig in valid_gigs]])
    similarity_scores = cosine_similarity(vectors[0:1], vectors[1:]).flatten()

    ranked_gigs = sorted(
        (
            {
                "gig_id": gig["gig_id"],
                "match_score": round(float(score), 4),
                "title": gig["title"],
            }
            for gig, score in zip(valid_gigs, similarity_scores)
        ),
        key=lambda item: item["match_score"],
        reverse=True,
    )

    return ranked_gigs[:10]
