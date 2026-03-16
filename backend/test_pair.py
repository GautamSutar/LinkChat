import asyncio
import websockets
import json

async def user_a():
    try:
        async with websockets.connect("ws://localhost:8000/ws/chat/random/?token=userA") as ws:
            print("User A connected!")
            # Wait for search message
            print("User A rx:", await ws.recv())
            # Wait for match message
            print("User A rx:", await ws.recv())
            
            # Send message
            await ws.send(json.dumps({"type": "message", "message": "Hi from A!"}))
            # Wait for bounce back
            while True:
                msg = await ws.recv()
                print("User A rx:", msg)
    except Exception as e:
        print("User A Error:", e)

async def user_b():
    await asyncio.sleep(1) # wait for A to join first
    try:
        async with websockets.connect("ws://localhost:8000/ws/chat/random/?token=userB") as ws:
            print("User B connected!")
            # Should get match message immediately
            print("User B rx:", await ws.recv())
            
            # Wait for A's message
            while True:
                msg = await ws.recv()
                print("User B rx:", msg)
    except Exception as e:
        print("User B Error:", e)

async def main():
    await asyncio.gather(user_a(), user_b())

asyncio.run(main())
