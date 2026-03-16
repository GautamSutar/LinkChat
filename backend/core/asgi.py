import os
from django.core.asgi import get_asgi_application
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django_asgi_app = get_asgi_application()
from channels.routing import ProtocolTypeRouter, URLRouter
from core.middleware import TokenAuthMiddleware
import chat.routing
import video.routing
import game.routing

websocket_urlpatterns = chat.routing.websocket_urlpatterns + video.routing.websocket_urlpatterns + game.routing.websocket_urlpatterns

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,

        "websocket": TokenAuthMiddleware(
            URLRouter(
                websocket_urlpatterns
            )
        ),
    }
)