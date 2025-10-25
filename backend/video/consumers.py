import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class VideoConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        print(f"\n--- VIDEO CONSUMER CONNECT ---")
        print(f"User received from scope: {self.user}")
        print(f"Is user authenticated: {self.user.is_authenticated}")
        print(f"Is user authenticated: {self.user.is_authenticated}")
        print(f"--------------------------\n")
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.room_group_name = f"{self.session_id}"
        print("--- VIDEO CONSUMER: About to add to group...")
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        print("--- VIDEO CONSUMER: Successfully added to group. Accepting...")
        await self.accept()
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "user_joined", "sender_channel_name": self.channel_name},
        )
        print("--- VIDEO CONSUMER: Sent user_joined message to group.")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": content.get("type"),
                "sdp": content.get("sdp"),
                "candidate": content.get("candidate"),
                "sender_channel_name": self.channel_name,
            },
        )
    async def user_joined(self, event):
        if self.channel_name != event["sender_channel_name"]:
            await self.send_json({"type": "partner_ready"})

    async def video_offer(self, event):
        if self.channel_name != event["sender_channel_name"]:
            await self.send_json({"type": "video_offer", "sdp": event["sdp"]})

    async def video_answer(self, event):
        if self.channel_name != event["sender_channel_name"]:
            await self.send_json({"type": "video_answer", "sdp": event["sdp"]})

    async def ice_candidate(self, event):
        if self.channel_name != event["sender_channel_name"]:
            await self.send_json(
                {"type": "ice_candidate", "candidate": event["candidate"]}
            )
