from django.urls import path
from .consumers import LiveResultsConsumer

websocket_urlpatterns = [
    path("ws/polls/<uuid:poll_id>/", LiveResultsConsumer.as_asgi()),
]
