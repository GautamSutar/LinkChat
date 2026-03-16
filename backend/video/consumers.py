import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class VideoConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.room_group_name = self.session_id

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Notify the other person in the room that someone joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "user_joined", "sender_channel_name": self.channel_name},
        )
        print(f"VideoConsumer: {self.channel_name} joined room {self.room_group_name}")

    async def disconnect(self, close_code):
        # When a user disconnects, broadcast call_ended so the other person knows
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "call_ended_event", "sender_channel_name": self.channel_name},
        )
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content):
        msg_type = content.get("type")

        if msg_type == "call_ended":
            # Explicit call end from client — broadcast to everyone else
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "call_ended_event", "sender_channel_name": self.channel_name},
            )
        else:
            # Forward WebRTC signaling: video_offer, video_answer, ice_candidate
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": f"signal_{msg_type}" if msg_type in ["video_offer", "video_answer", "ice_candidate"] else msg_type,
                    "sdp": content.get("sdp"),
                    "candidate": content.get("candidate"),
                    "sender_channel_name": self.channel_name,
                },
            )

    # ─── Event handlers ──────────────────────────────────────────────────────

    async def user_joined(self, event):
        if self.channel_name != event["sender_channel_name"]:
            await self.send_json({"type": "partner_ready"})

    async def signal_video_offer(self, event):
        if self.channel_name != event["sender_channel_name"]:
            await self.send_json({"type": "video_offer", "sdp": event["sdp"]})

    async def signal_video_answer(self, event):
        if self.channel_name != event["sender_channel_name"]:
            await self.send_json({"type": "video_answer", "sdp": event["sdp"]})

    async def signal_ice_candidate(self, event):
        if self.channel_name != event["sender_channel_name"]:
            await self.send_json({"type": "ice_candidate", "candidate": event["candidate"]})

    async def call_ended_event(self, event):
        # Only notify the OTHER person
        if self.channel_name != event["sender_channel_name"]:
            await self.send_json({"type": "call_ended"})
