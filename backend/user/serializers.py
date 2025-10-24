from rest_framework.serializers import ModelSerializer
from user.models import User
from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


class UserSignupSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "display_name", "password", "gender"]
        extra_kwargs = {"password": {"write_only": True}}
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")
        user = authenticate(email=email, password=password)

        if user is None:
            raise serializers.ValidationError("Invalid email or password")
        
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "display_name": user.display_name,
                "email": user.email,
                "gender": user.gender,
            },
        }


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "display_name",
            "avatar_url",
            "gender",
            "free_calls_left",
            "coins_balance",
        )
        read_only_fields = ("email", "id", "free_calls_left", "coins_balance")



