from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from channels.db import database_sync_to_async
from user.models import User

@database_sync_to_async
def get_user(token_key: str):
    try:
        print(f"DEBUG: Validating token starts: {token_key[:15]}...")
        token = AccessToken(token_key)
        user_id = token.payload.get("user_id")
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                print(f"DEBUG: Token valid. Found user: {user.display_name} ({user.email})")
                return user
            except User.DoesNotExist:
                print(f"DEBUG: Token valid but user {user_id} not found in DB.")
                return AnonymousUser()
        
        print("DEBUG: Token valid, but no user_id found in payload.")
        return AnonymousUser()
    except TokenError as e:
        print(f"DEBUG: TokenError: {str(e)}")
        return AnonymousUser()
    except Exception as e:
        print(f"DEBUG: Unexpected error in token validation: {str(e)}")
        import traceback
        traceback.print_exc()
        return AnonymousUser()

class TokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner
    async def __call__(self, scope, receive, send):
        query_string = parse_qs(scope.get("query_string", b"").decode("utf-8"))
        token = query_string.get("token")
        if token:
            scope["user"] = await get_user(token[0])
        else:
            scope["user"] = AnonymousUser()
        return await self.inner(scope, receive, send)
