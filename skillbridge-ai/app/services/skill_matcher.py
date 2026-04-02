def normalize_skill(skill: str) -> str:
    return skill.strip().lower()


def match_applicants(gig: dict, applicants: list[dict]) -> list[dict]:
    required_skills = {normalize_skill(skill) for skill in gig.get("skills_required", []) if skill}
    results = []

    for applicant in applicants:
        applicant_skills = {normalize_skill(skill) for skill in applicant.get("skills", []) if skill}
        matched_skills = sorted(required_skills.intersection(applicant_skills))
        missing_skills = sorted(required_skills.difference(applicant_skills))

        if required_skills:
            match_score = round((len(matched_skills) / len(required_skills)) * 100, 2)
        else:
            match_score = 0.0

        results.append(
            {
                "applicant_id": applicant["id"],
                "full_name": applicant["full_name"],
                "match_score": match_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
            }
        )

    return sorted(results, key=lambda item: item["match_score"], reverse=True)
