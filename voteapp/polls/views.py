from rest_framework import generics, status
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404

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
    permission_classes = [AllowAny]

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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        poll = serializer.save()
        # Return the full poll data with public_id using PollSerializer
        response_serializer = PollSerializer(poll, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PollListView(generics.ListAPIView):
    serializer_class = PollSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        public_qs = Poll.objects.filter(is_public=True)
        if user.is_authenticated:
            own_qs = Poll.objects.filter(created_by=user)
            return public_qs.union(own_qs)
        return public_qs


class PollDetailView(generics.RetrieveAPIView):
    queryset = Poll.objects.all()
    serializer_class = PollSerializer
    permission_classes = [AllowAny]
    lookup_field = "public_id"


class GenerateVoterTokensView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, poll_public_id):
        count = request.data.get("count")
        try:
            count = int(count)
        except (TypeError, ValueError):
            return Response({"error": "Valid token count required"}, status=status.HTTP_400_BAD_REQUEST)
        if count <= 0:
            return Response({"error": "Valid token count required"}, status=status.HTTP_400_BAD_REQUEST)

        poll = get_object_or_404(Poll, public_id=poll_public_id)

        if poll.created_by != request.user:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        if poll.voting_mode != "restricted":
            return Response({"error": "Poll is not in restricted mode"}, status=status.HTTP_400_BAD_REQUEST)

        tokens = generate_voter_tokens(count)
        store_allowed_tokens(poll.public_id, tokens)

        poll_link = f"/vote/{poll.public_id}/"
        return Response({
            "poll_public_id": str(poll.public_id),
            "poll_link": poll_link,
            "tokens": tokens,
            "message": "Tokens generated successfully"
        }, status=status.HTTP_201_CREATED)


class VoteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, poll_public_id):
        poll = get_object_or_404(Poll, public_id=poll_public_id)
        poll.update_status()

        if not poll.is_open():
            return Response({"error": "Poll is not open for voting"}, status=status.HTTP_403_FORBIDDEN)

        choice_id = request.data.get("choice_id")
        voter_token = request.data.get("voter_token")

        if choice_id is None:
            return Response({"error": "choice_id is required"}, status=status.HTTP_400_BAD_REQUEST)

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
    permission_classes = [IsAuthenticated]

    def post(self, request, poll_public_id):
        poll = get_object_or_404(Poll, public_id=poll_public_id)

        if poll.created_by != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        poll.update_status()
        if poll.status != "closed":
            return Response({"error": "Poll is not yet closed"}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(poll, "result"):
            return Response({"error": "Poll already finalized"}, status=status.HTTP_400_BAD_REQUEST)

        finalize_poll_results(poll)
        return Response({"message": "Poll results finalized"}, status=status.HTTP_200_OK)
