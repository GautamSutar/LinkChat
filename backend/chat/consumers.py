import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"
        user = self.scope.get("user")
        self.username = (
            user.display_name or user.email.split("@")[0]
            if user and user.is_authenticated
            else "Anonymous"
        )
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        # Notify others in the room that this user joined, include username for partner display
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user_joined",
                "username": self.username,
                "sender_channel_name": self.channel_name,
            },
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user_left",
                "username": self.username,
                "sender_channel_name": self.channel_name,
            },
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")

        if message_type == "message":
            message = data.get("message")
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": message,
                    "sender": self.username,
                    "sender_channel_name": self.channel_name,
                },
            )

        elif message_type == "start_video":
            session_id = f"{self.room_name}"
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "video_initiated",
                    "session_id": session_id,
                },
            )
        elif message_type == "start_voice":
            session_id = f"voice_{self.room_name}"
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "voice_initiated",
                    "session_id": session_id,
                },
            )

    async def user_joined(self, event):
        """Send partner's name to the other user in the room."""
        if self.channel_name != event.get("sender_channel_name"):
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "partner_joined",
                        "partner_name": event["username"],
                        "message": f"--- {event['username']} joined the chat! 👋 ---",
                    }
                )
            )

    async def user_left(self, event):
        """Notify when partner leaves."""
        if self.channel_name != event.get("sender_channel_name"):
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "partner_left",
                        "message": f"--- {event['username']} left the chat ---",
                    }
                )
            )

    async def chat_message(self, event):
        if self.channel_name != event.get("sender_channel_name"):
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "chat_message",
                        "message": event["message"],
                        "sender": event["sender"],
                    }
                )
            )

    async def system_message(self, event):
        if self.channel_name != event.get("sender_channel_name"):
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "system_message",
                        "message": event["message"],
                    }
                )
            )

    async def video_initiated(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "video_initiated",
                    "session_id": event["session_id"],
                }
            )
        )

    async def voice_initiated(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "voice_initiated",
                    "session_id": event["session_id"],
                }
            )
        )
