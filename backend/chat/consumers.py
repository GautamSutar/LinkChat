import json
import uuid
from collections import deque
from channels.generic.websocket import AsyncWebsocketConsumer


waiting_for_partner = deque()
consumer_to_room = {}


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.user_id = str(uuid.uuid4())

        waiting_for_partner.append(self)
        await self.send(text_data=json.dumps({"message": "Looking for a partner..."}))

        if len(waiting_for_partner) >= 2:
            partner1 = waiting_for_partner.popleft()
            partner2 = waiting_for_partner.popleft()

            room_group_name = f"chat_{partner1.user_id}_{partner2.user_id}"

            consumer_to_room[partner1.user_id] = room_group_name
            consumer_to_room[partner2.user_id] = room_group_name

            await partner1.channel_layer.group_add(
                room_group_name, partner1.channel_name
            )
            await partner2.channel_layer.group_add(
                room_group_name, partner2.channel_name
            )

            await partner1.channel_layer.group_send(
                room_group_name,
                {
                    "type": "system_message",
                    "message": "You are now connected with a stranger!",
                },
            )

    async def disconnect(self, close_code):
        if self in waiting_for_partner:
            waiting_for_partner.remove(self)

        room_group_name = consumer_to_room.pop(self.user_id, None)
        if room_group_name:
            await self.channel_layer.group_send(
                room_group_name,
                {
                    "type": "system_message",
                    "message": "Your partner has disconnected. Looking for a new partner...",
                },
            )
            await self.channel_layer.group_discard(room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")
        room_group_name = consumer_to_room.get(self.user_id)
        if not room_group_name:
            return
        if message_type == "message":
            message_content = data.get("message")
            if message_content:
                await self.channel_layer.group_send(
                    room_group_name,
                    {
                        "type": "chat_message",
                        "message": message_content,
                        "sender_user_id": self.user_id,
                        },
                        )
        elif message_type == "start_video":
            session_id = room_group_name.replace("chat_", "")
            await self.channel_layer.group_send(
                room_group_name,
                {
                    "type": "start_video",
                    "session_id": session_id,
                }
            )

    async def chat_message(self, event):
        message = event["message"]
        sender_user_id = event["sender_user_id"]
        if self.user_id == sender_user_id:
            prefix = "You: "
        else:
            prefix = "Stranger: "

        await self.send(text_data=json.dumps({"message": f"{prefix}{message}"}))

    async def system_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "system_message",
                    "message": event["message"],
                }
            )
        )

    async def video_initiate(self, event):
        await self.send(
            text_data=json.dumps(
                {"type": "video_initiated", "session_id": event["session_id"]}
            )
        )
