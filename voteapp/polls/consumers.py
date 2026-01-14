from channels.generic.websocket import AsyncJsonWebsocketConsumer

class LiveResultsConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Expect URL like /ws/polls/<public_id>/
        self.public_id = self.scope['url_route']['kwargs']['poll_id']
        self.group_name = f"poll_{self.public_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Read-only consumer; clients don’t send messages
        pass

    async def send_vote_update(self, event):
        # event["data"] contains {"poll_id": str(uuid), "votes": {choice_id: count}}
        await self.send_json({"type": "vote_update", **event["data"]})
