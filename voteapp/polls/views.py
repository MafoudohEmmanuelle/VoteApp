from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.response import Response 
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from polls.models import Poll
from polls.serializers import (
    PollSerializer,
    PollCreateSerializer,
    UserRegisterSerializer,
    UserLoginSerializer,
    UserSerializer
)
from polls.services import generate_voter_tokens, finalize_poll_results
from polls.redis_votes import store_allowed_tokens, cast_vote, get_poll_results
from django.utils import timezone

# -----------------------------
# Authentication Views
# -----------------------------

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Registration successful",
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"]
        )

        if not user:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Login successful",
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        })


class LogoutView(APIView):
    """
    JWT logout is handled client-side by deleting tokens.
    """
    permission_classes = []

    def post(self, request):
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


# -----------------------------
# Poll Views
# -----------------------------

class PollCreateView(generics.CreateAPIView):
    serializer_class = PollCreateSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class PollListView(generics.ListAPIView):
    serializer_class = PollSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Poll.objects.filter(is_public=True) | Poll.objects.filter(created_by=user)
        else:
            return Poll.objects.filter(is_public=True)


class PollDetailView(generics.RetrieveAPIView):
    queryset = Poll.objects.all()
    serializer_class = PollSerializer
    permission_classes = [AllowAny]
    lookup_field = "public_id"


class GenerateVoterTokensView(APIView):
    """
    Generate voter tokens for restricted polls.
    Only the poll creator can generate and share tokens manually.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, poll_public_id):
        count = request.data.get("count")
        if not count or int(count) <= 0:
            return Response({"error": "Valid token count required"}, status=status.HTTP_400_BAD_REQUEST)

        poll = Poll.objects.get(public_id=poll_public_id)
        if poll.created_by != request.user:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        if poll.voting_mode != "restricted":
            return Response({"error": "Poll is not in restricted mode"}, status=status.HTTP_400_BAD_REQUEST)

        tokens = generate_voter_tokens(int(count))
        store_allowed_tokens(poll.public_id, tokens)

        # Return the link for voters
        poll_link = f"/vote/{poll.public_id}/"  # Frontend can use this link
        return Response({
            "poll_public_id": str(poll.public_id),
            "poll_link": poll_link,
            "tokens": tokens,
            "message": "Tokens generated successfully"
        }, status=status.HTTP_201_CREATED)


class VoteView(APIView):
    """
    Cast a vote using a token (anonymous or restricted).
    Live results are automatically broadcasted via WebSocket.
    """
    def post(self, request, poll_public_id):
        poll = Poll.objects.get(public_id=poll_public_id)
        poll.update_status()

        if not poll.is_open():
            return Response({"error": "Poll is not open for voting"}, status=status.HTTP_403_FORBIDDEN)

        choice_id = request.data.get("choice_id")
        voter_token = request.data.get("voter_token")

        if not choice_id:
            return Response({"error": "choice_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Allow authenticated users to vote without supplying a token
        if not voter_token:
            if request.user and request.user.is_authenticated:
                voter_token = f"user:{request.user.id}"
            else:
                return Response({"error": "voter_token is required for anonymous users"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cast_vote(poll.public_id, int(choice_id), voter_token)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        results = get_poll_results(poll.public_id)
        return Response({"message": "Vote recorded", "results": results}, status=status.HTTP_200_OK)


class FinalizePollView(APIView):
    """
    Finalize a poll and store the results in the database.
    Only the poll creator can finalize, and only after the poll is closed.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, poll_public_id):
        poll = Poll.objects.get(public_id=poll_public_id)
        if poll.created_by != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        poll.update_status()
        if poll.status != "closed":
            return Response({"error": "Poll is not yet closed"}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(poll, "result"):
            return Response({"error": "Poll already finalized"}, status=status.HTTP_400_BAD_REQUEST)

        finalize_poll_results(poll)
        return Response({"message": "Poll results finalized"}, status=status.HTTP_200_OK)
