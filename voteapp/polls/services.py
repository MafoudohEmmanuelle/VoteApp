import uuid
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
    Generate a list of unique UUID tokens for anonymous/restricted voters.
    These tokens can be shared manually (QR, link, email).
    """
    return [str(uuid.uuid4()) for _ in range(count)]


# -----------------------------
# Finalize poll results
# -----------------------------

def finalize_poll_results(poll: Poll):
    """
    Persist final poll results from Redis into the database.
    Should be called AFTER the poll closes.
    """

    # Ensure poll is closed
    poll.update_status()
    if poll.is_open():
        raise ValueError("Poll is still open")

    # IMPORTANT: Redis uses poll.public_id (UUID), not poll.id
    results = get_poll_results(poll.public_id)

    total_votes = sum(results.values())

    # Prevent duplicate result rows
    PollResult.objects.update_or_create(
        poll=poll,
        defaults={
            "results": results,
            "total_votes": total_votes
        }
    )


# -----------------------------
# Predefine allowed tokens
# -----------------------------

def add_allowed_tokens_to_poll(poll: Poll, tokens: list[str]):
    """
    Store allowed voter tokens in Redis for restricted polls.
    """

    if poll.voting_mode != Poll.VotingMode.RESTRICTED:
        raise ValueError("Poll is not restricted")

    # Redis keys MUST match voting logic → use public_id
    store_allowed_tokens(poll.public_id, tokens)
