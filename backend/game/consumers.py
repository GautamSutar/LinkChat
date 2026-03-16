import json
import logging
import uuid
import random
from channels.generic.websocket import AsyncWebsocketConsumer

# Matchmaking queues and active games storage in memory
_waiting_players = {}   # {"ttt": [(channel, name)], "c4": [(channel, name)]}
_active_games = {}

logger = logging.getLogger(__name__)


def _get_mode(room_name: str) -> str:
    """Derive game mode from the room name prefix."""
    if room_name.startswith("c4"):
        return "c4"
    return "ttt"


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.game_mode = _get_mode(self.room_name)
        user = self.scope.get("user")

        if user and user.is_authenticated:
            self.username = getattr(user, "display_name", None) or user.email.split("@")[0]
        else:
            short_id = self.channel_name.split("!")[-1][:4] if "!" in self.channel_name else "Anon"
            self.username = f"Player_{short_id}"

        await self.accept()

        if self.room_name in ("random", "c4_random"):
            await self.handle_random_match()
        else:
            self.room_group_name = f"game_{self.room_name}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.send_system_message("Connected to custom game room.")

    async def handle_random_match(self):
        global _waiting_players, _active_games
        queue = _waiting_players.setdefault(self.game_mode, [])

        if queue:
            partner_channel, partner_name = queue.pop(0)
            game_id = str(uuid.uuid4())
            self.room_group_name = f"game_{game_id}"

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.channel_layer.group_add(self.room_group_name, partner_channel)

            players = [(self.channel_name, self.username), (partner_channel, partner_name)]
            random.shuffle(players)
            player_x, player_o = players[0], players[1]

            if self.game_mode == "ttt":
                initial_state = {
                    "mode": "ttt",
                    "board": [None] * 9,
                    "current_turn": "X",
                    "player_x_channel": player_x[0],
                    "player_o_channel": player_o[0],
                    "player_x_name": player_x[1],
                    "player_o_name": player_o[1],
                    "winner": None,
                    "is_draw": False,
                }
            else:  # connect 4
                initial_state = {
                    "mode": "c4",
                    "board": [[None] * 7 for _ in range(6)],   # 6 rows, 7 cols
                    "current_turn": "R",
                    "player_r_channel": player_x[0],
                    "player_y_channel": player_o[0],
                    "player_r_name": player_x[1],
                    "player_y_name": player_o[1],
                    "winner": None,
                    "is_draw": False,
                }

            _active_games[self.room_group_name] = initial_state
            # track which game each channel belongs to
            _active_games[self.channel_name] = {"room": self.room_group_name}
            _active_games[partner_channel] = {"room": self.room_group_name}

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "game_start",
                    "room_group_name": self.room_group_name,
                    "state": initial_state,
                },
            )
        else:
            queue.append((self.channel_name, self.username))
            await self.send_system_message("Searching for an opponent...")

    async def disconnect(self, close_code):
        global _waiting_players, _active_games

        for mode_queue in _waiting_players.values():
            for i, (ch, _) in enumerate(mode_queue):
                if ch == self.channel_name:
                    mode_queue.pop(i)
                    break

        if self.channel_name in _active_games:
            info = _active_games.pop(self.channel_name, None)
            if info:
                room = info.get("room")
                if room and room in _active_games:
                    state = _active_games[room]
                    await self.channel_layer.group_send(
                        room, {"type": "partner_left", "message": f"{self.username} has left the game."}
                    )
                    # Cleanup partner ref
                    if state.get("mode") == "ttt":
                        partner = state["player_x_channel"] if state["player_o_channel"] == self.channel_name else state["player_o_channel"]
                    else:
                        partner = state["player_r_channel"] if state["player_y_channel"] == self.channel_name else state["player_y_channel"]
                    _active_games.pop(partner, None)
                    _active_games.pop(room, None)

        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")
            if action == "make_move":
                if not hasattr(self, "room_group_name"):
                    return
                state = _active_games.get(self.room_group_name)
                if not state or state.get("winner") or state.get("is_draw"):
                    return

                mode = state.get("mode", "ttt")

                if mode == "ttt":
                    await self._handle_ttt_move(data, state)
                else:
                    await self._handle_c4_move(data, state)

        except Exception as e:
            logger.error(f"GameConsumer receive error: {e}")

    # ── Tic-Tac-Toe ────────────────────────────────────────────────────────────

    async def _handle_ttt_move(self, data, state):
        current_turn = state["current_turn"]
        expected = state["player_x_channel"] if current_turn == "X" else state["player_o_channel"]
        if self.channel_name != expected:
            return

        index = data.get("index")
        if index is None or not (0 <= index <= 8):
            return
        if state["board"][index] is not None:
            return

        state["board"][index] = current_turn
        state["winner"] = self._check_ttt_winner(state["board"])
        if not state["winner"] and None not in state["board"]:
            state["is_draw"] = True
        state["current_turn"] = "O" if current_turn == "X" else "X"

        await self.channel_layer.group_send(
            self.room_group_name, {"type": "game_update", "state": state}
        )

    def _check_ttt_winner(self, board):
        wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
        for a, b, c in wins:
            if board[a] and board[a] == board[b] == board[c]:
                return board[a]
        return None

    # ── Connect 4 ──────────────────────────────────────────────────────────────

    async def _handle_c4_move(self, data, state):
        current_turn = state["current_turn"]
        expected = state["player_r_channel"] if current_turn == "R" else state["player_y_channel"]
        if self.channel_name != expected:
            return

        col = data.get("col")
        if col is None or not (0 <= col <= 6):
            return

        board = state["board"]
        # Drop piece to the lowest empty row in 'col'
        row = None
        for r in range(5, -1, -1):
            if board[r][col] is None:
                row = r
                break
        if row is None:
            return  # column full

        board[row][col] = current_turn
        state["winner"] = self._check_c4_winner(board)
        if not state["winner"] and all(board[0][c] is not None for c in range(7)):
            state["is_draw"] = True
        state["current_turn"] = "Y" if current_turn == "R" else "R"

        await self.channel_layer.group_send(
            self.room_group_name, {"type": "game_update", "state": state}
        )

    def _check_c4_winner(self, board):
        ROWS, COLS = 6, 7
        def check(piece):
            # horizontal
            for r in range(ROWS):
                for c in range(COLS - 3):
                    if all(board[r][c+i] == piece for i in range(4)):
                        return True
            # vertical
            for r in range(ROWS - 3):
                for c in range(COLS):
                    if all(board[r+i][c] == piece for i in range(4)):
                        return True
            # diagonal down-right
            for r in range(ROWS - 3):
                for c in range(COLS - 3):
                    if all(board[r+i][c+i] == piece for i in range(4)):
                        return True
            # diagonal down-left
            for r in range(ROWS - 3):
                for c in range(3, COLS):
                    if all(board[r+i][c-i] == piece for i in range(4)):
                        return True
            return False

        for piece in ("R", "Y"):
            if check(piece):
                return piece
        return None

    # ── Event handlers ──────────────────────────────────────────────────────────

    async def game_start(self, event):
        self.room_group_name = event["room_group_name"]
        state = event["state"]
        mode = state.get("mode", "ttt")

        if mode == "ttt":
            my_symbol = "X" if state["player_x_channel"] == self.channel_name else "O"
            partner_name = state["player_o_name"] if my_symbol == "X" else state["player_x_name"]
        else:
            my_symbol = "R" if state["player_r_channel"] == self.channel_name else "Y"
            partner_name = state["player_y_name"] if my_symbol == "R" else state["player_r_name"]

        await self.send(text_data=json.dumps({
            "type": "game_start",
            "my_symbol": my_symbol,
            "partner_name": partner_name,
            "state": state,
        }))

    async def game_update(self, event):
        await self.send(text_data=json.dumps({"type": "game_update", "state": event["state"]}))

    async def partner_left(self, event):
        await self.send(text_data=json.dumps({"type": "partner_left", "message": event.get("message", "Opponent disconnected.")}))

    async def send_system_message(self, message):
        await self.send(text_data=json.dumps({"type": "system_message", "message": message}))
