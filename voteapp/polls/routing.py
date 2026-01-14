from django.urls import re_path
from .consumers import LiveResultsConsumer

websocket_urlpatterns = [
    re_path(r"^ws/polls/(?P<poll_id>[0-9a-f-]+)/$", LiveResultsConsumer.as_asgi()),
]
