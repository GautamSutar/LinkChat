# import rest_framework import serializers
# from .models import Session

# class SessionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Session
#         Fields = (
#             'id', 'email', 'display_name', 'avatar_url',
#             'gender', 'free_calls_left', 'coins_balance'
#         )
#         read_only_fields = ('email', 'id', 'free_calls_left', 'coins_balance')