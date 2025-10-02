from django.urls import path
from user.views.authViews import UserSignupView, UserLoginView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from user.views.userProfileViews import UserProfileView, AvatarUploadView

urlpatterns = [
    # path("all/", UserListView.as_view(), name="user-list"),
    path("signup/", UserSignupView.as_view(), name="user-signup"),
    path("obtainToken/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("login/", UserLoginView.as_view(), name="user-login"),
    path("getUser/", UserProfileView.as_view(), name="user-retrieve"),
    path("upload-avatar/", AvatarUploadView.as_view(), name="upload-avatar"),
]
