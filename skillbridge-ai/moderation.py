from __future__ import annotations

import re

from better_profanity import profanity


profanity.load_censor_words()


def moderate_text(text: str) -> dict:
    if not isinstance(text, str):
        raise ValueError("text must be a string")

    cleaned_text = profanity.censor(text)
    is_safe = not profanity.contains_profanity(text)

    tokens = re.findall(r"\b[\w']+\b", text)
    flagged_words = sorted({token for token in tokens if profanity.contains_profanity(token)})

    return {
        "is_safe": is_safe,
        "cleaned_text": cleaned_text,
        "flagged_words": flagged_words,
    }
