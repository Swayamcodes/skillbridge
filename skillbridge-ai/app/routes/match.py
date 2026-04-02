from fastapi import APIRouter

from app.models.schemas import MatchApplicantsRequest, MatchApplicantsResponse
from app.services.skill_matcher import match_applicants

router = APIRouter(tags=["matching"])


@router.post("/match-applicants", response_model=MatchApplicantsResponse)
def match_applicants_route(payload: MatchApplicantsRequest):
    results = match_applicants(
        gig=payload.gig.model_dump(),
        applicants=[applicant.model_dump() for applicant in payload.applicants],
    )
    return {"results": results}
