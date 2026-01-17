import secrets
from polls.models import PollResult, Poll
from polls.redis_votes import (
    get_poll_results,
    store_allowed_tokens
)

# -----------------------------
# Generate voter tokens
# -----------------------------

def generate_voter_tokens(count: int) -> list[str]:
    """
    Generate a list of unique secure tokens for restricted voters.
    """
    return [secrets.token_urlsafe(16) for _ in range(count)]

# -----------------------------
# Finalize poll results
# -----------------------------

def finalize_poll_results(poll: Poll):
    """
    Persist final poll results from Redis into the database.
    Should be called AFTER the poll closes.
    Called automatically by signal when poll.status changes to 'closed'.
    """
    if poll.is_open():
        raise ValueError("Poll is still open")

    if hasattr(poll, 'result'):
        raise ValueError("Poll already finalized")

    results = get_poll_results(poll.public_id)
    total_votes = sum(results.values())

    pr = PollResult.objects.create(
        poll=poll,
        results=results,
        total_votes=total_votes
    )

    return pr

# -----------------------------
# Predefine allowed tokens
# -----------------------------

def add_allowed_tokens_to_poll(poll: Poll, tokens: list[str]):
    """
    Store allowed voter tokens in Redis for restricted polls.
    """
    if poll.voting_mode != "restricted":
        raise ValueError("Poll is not restricted")

    store_allowed_tokens(poll.public_id, tokens)
