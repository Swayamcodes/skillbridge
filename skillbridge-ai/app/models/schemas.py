from pydantic import BaseModel
from typing import List


class GigInput(BaseModel):
    id: str
    title: str
    description: str = ""
    skills_required: List[str] = []


class ApplicantInput(BaseModel):
    id: str
    full_name: str
    skills: List[str] = []
    bio: str = ""
    year: int | None = None
    reputation_score: float = 0


class ApplicantMatchResult(BaseModel):
    applicant_id: str
    full_name: str
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]


class MatchApplicantsRequest(BaseModel):
    gig: GigInput
    applicants: List[ApplicantInput]


class MatchApplicantsResponse(BaseModel):
    results: List[ApplicantMatchResult]
