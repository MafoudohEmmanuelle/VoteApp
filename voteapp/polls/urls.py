from django.urls import path
from polls.views import (
    RegisterView,
    LoginView,
    LogoutView,
    PollCreateView,
    PollListView,
    PollDetailView,
    GenerateVoterTokensView,
    VoteView,
    FinalizePollView,
)

urlpatterns = [
    # Authentication
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),

    # Polls
    path("polls/", PollListView.as_view(), name="poll-list"),
    path("polls/create/", PollCreateView.as_view(), name="poll-create"),
    path("polls/<uuid:public_id>/", PollDetailView.as_view(), name="poll-detail"),

    # Voting
    path("polls/<uuid:poll_public_id>/vote/", VoteView.as_view(), name="poll-vote"),

    # Restricted voters
    path("polls/<uuid:poll_public_id>/tokens/", GenerateVoterTokensView.as_view(), name="poll-generate-tokens"),

    # Finalize poll
    path("polls/<uuid:poll_public_id>/finalize/", FinalizePollView.as_view(), name="poll-finalize"),
]

