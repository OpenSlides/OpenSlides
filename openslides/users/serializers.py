from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for a users.models.User objects.
    """
    class Meta:
        model = User
        fields = (
            'username',
            'first_name',
            'last_name')
