import asyncio
import websockets

async def test_ws():
    try:
        async with websockets.connect("ws://localhost:8000/ws/chat/random/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzczNjgyMzY5LCJpYXQiOjE3NzM2ODIwNjksImp0aSI6IjIwZWRiYjllMWI3YTQ3YjBhMDU5ZjYzNmJjYTUzYmY4IiwidXNlcl9pZCI6ImRjOGRmMzcyLWQ2ODUtNGMwMC05YzE4LTg3NjUxZDU1MGM5YSJ9.Y030LxojWDbqN5LBDCJP6BkwW8WYA49WrMrHlO4aoPs") as websocket:
            print("Connected!")
            await websocket.send('{"type":"message", "message":"hello"}')
            response = await websocket.recv()
            print("Response:", response)
    except Exception as e:
        print("Error:", type(e), e)

asyncio.run(test_ws())
