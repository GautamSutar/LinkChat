from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager


class CustomUserManager(BaseUserManager):

    def create_user(self, email, password=None, gender="O", **extra_fields):
        if not email:
            raise ValueError("Email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, gender=gender, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    # def create_superuser(self, email, password=None, gender="O", **extra_fields):
    #     # Only for dev/admin, not needed for your free version users
    #     extra_fields.setdefault("is_staff", True)
    #     extra_fields.setdefault("is_superuser", True)
    #     return self.create_user(email, password, gender, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    gender_choices = [("M", "Male"), ("F", "Female"), ("O", "Other")]
    gender = models.CharField(max_length=1, choices=gender_choices, default="O")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = CustomUserManager()
    def __str__(self):
        return self.email
