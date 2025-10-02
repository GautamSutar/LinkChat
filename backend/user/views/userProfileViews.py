from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from ..serializers import UserProfileSerializer
import cloudinary
import cloudinary.uploader
import cloudinary.api


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AvatarUploadView(APIView):

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        avatar_file = request.data.get("avatar")
        if not avatar_file:
            return Response(
                {"error": "No avatar file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            upload_result = cloudinary.uploader.upload(
                avatar_file,
                folder="avatars",
                public_id=str(request.user.id),
                overwrite=True,
                resource_type="image",
            )
            secure_url = upload_result.get("secure_url")
            if not secure_url:
                raise Exception("Cloudinary upload failed: No secure URL returned.")

            return Response({"avatar_url": secure_url}, status=status.HTTP_201_CREATED)

        except Exception as e:

            return Response(
                {"error": f"Something went wrong during file upload: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
