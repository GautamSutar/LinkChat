import json
import uuid
from collections import deque
from channels.generic.websocket import AsyncWebsocketConsumer

# IMPORTANT: This in-memory state will NOT work if you run more than one
# server process (e.g., with Gunicorn workers). For production, you must
# use a shared backend like Redis to manage the waiting queue.
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

    # MODIFIED - This is now simpler and more powerful
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data.get("message")

        room_group_name = consumer_to_room.get(self.user_id)
        if room_group_name and message_content:
            # Broadcast the message to the group, including the sender's ID
            await self.channel_layer.group_send(
                room_group_name,
                {
                    "type": "chat_message",
                    "message": message_content,
                    "sender_user_id": self.user_id,
                },
            )

    # NEW - Handler for chat messages from the group
    async def chat_message(self, event):
        message = event["message"]
        sender_user_id = event["sender_user_id"]

        # Determine the prefix based on whether this consumer is the sender
        if self.user_id == sender_user_id:
            prefix = "You: "
        else:
            prefix = "Stranger: "

        # Send the formatted message down to the WebSocket client
        await self.send(text_data=json.dumps({"message": f"{prefix}{message}"}))

    # NEW - Handler for system messages (like connect/disconnect)
    async def system_message(self, event):
        await self.send(text_data=json.dumps({"message": event["message"]}))
