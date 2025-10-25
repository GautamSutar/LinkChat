import socketio
from aiohttp import web

sio = socketio.AsyncServer(
    cors_allowed_origins="*"
)
app = web.Application()
sio.attach(app)

@sio.on("connect")
def handle_connect(sid, environ):
    print("Connected:", sid)


@sio.on("message")
async def handle_message(sid, data):
    print("Message from", sid, ":", data)
    await sio.emit("message", data)


if __name__ == "__main__":
    web.run_app(
        app, host="localhost", port=8001
    )
