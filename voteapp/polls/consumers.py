import json
from channels.generic.websocket import AsyncWebsocketConsumer


class LiveResultsConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer that streams live poll results in real time.
    Read-only: clients only receive updates.
    """

    async def connect(self):
        # Poll UUID from URL
        self.poll_id = str(self.scope["url_route"]["kwargs"]["poll_id"])

        # One WebSocket group per poll
        self.group_name = f"poll_{self.poll_id}"

        # Join poll group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        # Accept connection
        await self.accept()

    async def disconnect(self, close_code):
        # Leave poll group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        """
        This WebSocket is read-only.
        Incoming messages from clients are ignored.
        """
        return

    async def send_vote_update(self, event):
        """
        Receive vote updates from Redis broadcaster
        and forward them to the frontend.
        """
        await self.send(
            text_data=json.dumps(event["data"])
        )
