import asyncio
import websockets

async def test_ws():
    try:
        async with websockets.connect("ws://localhost:8000/ws/chat/random/?token=dummy") as websocket:
            print("Connected! Waiting for 5 seconds...")
            await asyncio.sleep(5)
            print("Done waiting.")
    except Exception as e:
        print("Error:", type(e), e)

asyncio.run(test_ws())
