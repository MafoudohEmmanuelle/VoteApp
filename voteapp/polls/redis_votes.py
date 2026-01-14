from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from polls.models import Poll, Choice
from polls.redis_client import redis_client

# =============================
# Redis key helpers (UUID-based)
# =============================

def votes_key(poll_uuid):
    return f"poll:{poll_uuid}:votes"

def voters_key(poll_uuid):
    return f"poll:{poll_uuid}:voters"

def allowed_tokens_key(poll_uuid):
    return f"poll:{poll_uuid}:allowed_tokens"

def used_tokens_key(poll_uuid):
    return f"poll:{poll_uuid}:used_tokens"

# =============================
# Poll state helper
# =============================

def is_poll_open(poll: Poll) -> bool:
    poll.update_status()
    return poll.is_open()

# =============================
# Cast Vote
# =============================

def cast_vote(poll_public_id, choice_id, voter_token):
    """
    Cast a vote for a poll (open or restricted).
    Uses Redis for speed + WebSocket for live updates.
    For OPEN polls, voter_token must be unique per voter (frontend generates random token).
    """

    poll = Poll.objects.get(public_id=poll_public_id)

    if not is_poll_open(poll):
        raise ValueError("Poll is closed")

    if not Choice.objects.filter(id=choice_id, poll=poll).exists():
        raise ValueError("Invalid choice")

    v_key = votes_key(poll.public_id)

    # OPEN VOTING
    if poll.voting_mode == "open":
        voter_set = voters_key(poll.public_id)

        if not voter_token:
            raise ValueError("Missing voter token")

        if redis_client.sismember(voter_set, voter_token):
            raise ValueError("Already voted")

        pipe = redis_client.pipeline()
        pipe.sadd(voter_set, voter_token)
        pipe.hincrby(v_key, str(choice_id), 1)  # store choice_id as string
        pipe.execute()

    # RESTRICTED VOTING
    else:
        allowed = allowed_tokens_key(poll.public_id)
        used = used_tokens_key(poll.public_id)

        if not voter_token:
            raise ValueError("Missing voter token")

        if not redis_client.sismember(allowed, voter_token):
            raise ValueError("Invalid or unauthorized token")

        if redis_client.sismember(used, voter_token):
            raise ValueError("Token already used")

        pipe = redis_client.pipeline()
        pipe.sadd(used, voter_token)
        pipe.hincrby(v_key, str(choice_id), 1)
        pipe.execute()

    broadcast_live_results(poll.public_id)

# =============================
# Broadcast live results
# =============================

def broadcast_live_results(poll_uuid):
    """
    Push live results to WebSocket group
    """
    channel_layer = get_channel_layer()
    raw_votes = redis_client.hgetall(votes_key(poll_uuid))
    votes = {int(k): int(v) for k, v in raw_votes.items()}

    async_to_sync(channel_layer.group_send)(
        f"poll_{poll_uuid}",
        {
            "type": "send_vote_update",
            "data": {
                "poll_id": str(poll_uuid),
                "votes": votes
            }
        }
    )

# =============================
# Get results (for finalization)
# =============================

def get_poll_results(poll_uuid):
    raw_votes = redis_client.hgetall(votes_key(poll_uuid))
    return {int(k): int(v) for k, v in raw_votes.items()}

# =============================
# Store allowed tokens
# =============================

def store_allowed_tokens(poll_uuid, tokens: list[str]):
    # Consider hashing tokens before storing in production
    if tokens:
        redis_client.sadd(allowed_tokens_key(poll_uuid), *tokens)
