import json
import logging
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer

_waiting_users = []
_active_pairs = {}

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        user = self.scope.get("user")

        if user and user.is_authenticated:
            self.username = user.display_name or user.email.split("@")[0]
            self.gender = getattr(user, "gender", "O")
        else:
            short_id = self.channel_name.split("!")[-1][:4] if "!" in self.channel_name else "Guest"
            self.username = f"Stranger_{short_id}"
            self.gender = "O"

        print(f"DEBUG: Connect - {self.username} ({self.channel_name}) in {self.room_name}")
        await self.accept()

        if self.room_name == "random":
            await self.handle_random_match()
        else:
            self.room_group_name = f"chat_{self.room_name}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.send_system_message("Connected to room.")

    async def handle_random_match(self):
        global _waiting_users

        if _waiting_users:
            partner_channel, partner_name, partner_gender = _waiting_users.pop(0)

            pair_id = str(uuid.uuid4())
            self.room_group_name = f"pair_{pair_id}"

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.channel_layer.group_add(self.room_group_name, partner_channel)

            _active_pairs[self.channel_name] = {
                "partner": partner_channel,
                "partner_name": partner_name,
                "partner_gender": partner_gender,
                "room": self.room_group_name,
            }
            _active_pairs[partner_channel] = {
                "partner": self.channel_name,
                "partner_name": self.username,
                "partner_gender": self.gender,
                "room": self.room_group_name,
            }

            print(f"DEBUG: Matched {self.username} with {partner_name} in {self.room_group_name}")

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "pairing_complete",
                    "room_group_name": self.room_group_name,
                    "pairs": {
                        self.channel_name: {
                            "name": self.username,
                            "gender": self.gender,
                            "partner": partner_name,
                            "partner_gender": partner_gender,
                        },
                        partner_channel: {
                            "name": partner_name,
                            "gender": partner_gender,
                            "partner": self.username,
                            "partner_gender": self.gender,
                        },
                    },
                },
            )
        else:
            _waiting_users.append((self.channel_name, self.username, self.gender))
            print(f"DEBUG: {self.username} added to waiting queue. Current queue: {len(_waiting_users)}")
            await self.send_system_message("Searching for a partner...")

    async def disconnect(self, close_code):
        print(f"DEBUG: Disconnect - {self.username}")
        global _waiting_users
        _waiting_users = [u for u in _waiting_users if u[0] != self.channel_name]

        if self.channel_name in _active_pairs:
            pair_info = _active_pairs.pop(self.channel_name)
            room_group = pair_info["room"]

            await self.channel_layer.group_send(
                room_group,
                {"type": "partner_left", "message": f"--- {pair_info['partner_name']} left the chat ---"},
            )

            partner_channel = pair_info["partner"]
            _active_pairs.pop(partner_channel, None)

            await self.channel_layer.group_discard(room_group, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "message":
                message = data.get("message", "")
                if not hasattr(self, 'room_group_name'):
                    await self.send_system_message("You are not connected to a partner yet.")
                    return
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat_message",
                        "message": message,
                        "sender": self.username,
                        "sender_channel_name": self.channel_name,
                    },
                )

            elif message_type in ["start_video", "start_voice"]:
                if not hasattr(self, 'room_group_name'):
                    return
                # Caller gets outgoing notification immediately (only to themselves)
                call_kind = "video" if message_type == "start_video" else "voice"
                session_id = self.room_group_name
                # Notify the receiver with incoming call event (everyone in group except caller)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "call_incoming",
                        "call_kind": call_kind,
                        "session_id": session_id,
                        "caller_channel": self.channel_name,
                    },
                )

            elif message_type == "call_accepted":
                if not hasattr(self, 'room_group_name'):
                    return
                # Receiver accepted — tell everyone (incl caller) to join call
                call_kind = data.get("call_kind", "video")
                session_id = data.get("session_id", self.room_group_name)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "call_started",
                        "call_kind": call_kind,
                        "session_id": session_id,
                    },
                )

            elif message_type == "call_denied":
                if not hasattr(self, 'room_group_name'):
                    return
                # Receiver denied — tell caller the call was rejected
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "call_rejected",
                        "rejector_channel": self.channel_name,
                    },
                )

        except Exception as e:
            print(f"DEBUG: Error in receive: {str(e)}")
            import traceback
            traceback.print_exc()

    # ─── Event handlers ─────────────────────────────────────────────────────────

    async def pairing_complete(self, event):
        self.room_group_name = event["room_group_name"]
        my_info = event["pairs"].get(self.channel_name)
        if my_info:
            print(f"DEBUG: {self.username} pairing complete for {self.room_group_name}")
            await self.send(text_data=json.dumps({
                "type": "partner_joined",
                "partner_name": my_info["partner"],  # Send real name
                "partner_gender": my_info["partner_gender"],
                "message": f"--- Connected with {my_info['partner']}! 👋 ---",
            }))

    async def chat_message(self, event):
        if self.channel_name != event.get("sender_channel_name"):
            await self.send(text_data=json.dumps({
                "type": "chat_message",
                "message": event["message"],
                "sender": event["sender"],  # Send real name
            }))

    async def partner_left(self, event):
        await self.send(text_data=json.dumps({
            "type": "partner_left",
            "message": event.get("message", "--- The stranger left the chat ---"),
        }))

    async def call_incoming(self, event):
        # Only notify the person who is NOT the caller
        if self.channel_name != event["caller_channel"]:
            await self.send(text_data=json.dumps({
                "type": "call_incoming",
                "call_kind": event["call_kind"],
                "session_id": event["session_id"],
            }))
        else:
            # Let the caller know their outgoing call is ringing
            await self.send(text_data=json.dumps({
                "type": "call_outgoing",
                "call_kind": event["call_kind"],
                "session_id": event["session_id"],
            }))

    async def call_started(self, event):
        await self.send(text_data=json.dumps({
            "type": "call_started",
            "call_kind": event["call_kind"],
            "session_id": event["session_id"],
        }))

    async def call_rejected(self, event):
        # Only notify the person who is NOT the rejector (i.e., the caller)
        if self.channel_name != event["rejector_channel"]:
            await self.send(text_data=json.dumps({
                "type": "call_rejected",
            }))

    async def send_system_message(self, message):
        await self.send(text_data=json.dumps({
            "type": "system_message",
            "message": message,
        }))
