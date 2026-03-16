import asyncio
import websockets

async def test_ws():
    try:
        async with websockets.connect(
            "ws://localhost:8000/ws/chat/random/?token=dummy",
            origin="http://localhost:5173"
        ) as websocket:
            print("Connected!")
            await asyncio.sleep(1)
    except Exception as e:
        print("Error:", type(e), e)

asyncio.run(test_ws())
