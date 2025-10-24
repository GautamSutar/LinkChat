from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics, permissions
from django.db import IntegrityError
from ..models import User
from ..serializers import (
    UserSignupSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
)
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

import logging

logger = logging.getLogger(__name__)


class UserSignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSignupSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            print("raw data:", request.data)
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(
                {"message": "User created successfully", "user": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Signup failed: {str(e)}")
            return Response(
                {"error": "Something went wrong during signup."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserLoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Login failed: {str(e)}")
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
