from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Park, ParkingSpot, History


class ParkingSpotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingSpot
        fields = ['id', 'code', 'status', 'chassis', 'x', 'y', 'w', 'h']


class ParkSerializer(serializers.ModelSerializer):
    spots = ParkingSpotSerializer(many=True, read_only=True)
    total_spots = serializers.SerializerMethodField()
    occupied_spots = serializers.SerializerMethodField()
    free_spots = serializers.SerializerMethodField()

    class Meta:
        model = Park
        fields = ['id', 'name', 'spots', 'total_spots', 'occupied_spots', 'free_spots']

    def get_total_spots(self, obj):
        return obj.spots.count()

    def get_occupied_spots(self, obj):
        return obj.spots.filter(status='occupé').count()

    def get_free_spots(self, obj):
        return obj.spots.filter(status='libre').count()


class ParkListSerializer(serializers.ModelSerializer):
    """Serializer léger pour la liste des parcs (sans les places)"""
    total_spots = serializers.SerializerMethodField()
    occupied_spots = serializers.SerializerMethodField()
    free_spots = serializers.SerializerMethodField()

    class Meta:
        model = Park
        fields = ['id', 'name', 'total_spots', 'occupied_spots', 'free_spots']

    def get_total_spots(self, obj):
        return obj.spots.count()

    def get_occupied_spots(self, obj):
        return obj.spots.filter(status='occupé').count()

    def get_free_spots(self, obj):
        return obj.spots.filter(status='libre').count()


class HistorySerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    park = serializers.SerializerMethodField()

    class Meta:
        model = History
        fields = [
            'id', 'timestamp', 'user', 'park',
            'action', 'spot_code', 'old_chassis', 'new_chassis'
        ]

    def get_user(self, obj):
        return obj.user.username if obj.user else 'Inconnu'

    def get_park(self, obj):
        return obj.park.name if obj.park else 'Inconnu'


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'role']

    def get_role(self, obj):
        return 'admin' if obj.username == 'MAN' else 'security'
