from django.contrib import admin
from .models import Park, ParkingSpot, History


@admin.register(Park)
class ParkAdmin(admin.ModelAdmin):
    list_display = ['name', 'get_total', 'get_occupied', 'get_free']
    search_fields = ['name']

    def get_total(self, obj):
        return obj.spots.count()
    get_total.short_description = 'Total places'

    def get_occupied(self, obj):
        return obj.spots.filter(status='occupé').count()
    get_occupied.short_description = 'Occupées'

    def get_free(self, obj):
        return obj.spots.filter(status='libre').count()
    get_free.short_description = 'Libres'


@admin.register(ParkingSpot)
class ParkingSpotAdmin(admin.ModelAdmin):
    list_display = ['code', 'park', 'status', 'chassis']
    list_filter = ['park', 'status']
    search_fields = ['code', 'chassis']
    ordering = ['park', 'code']


@admin.register(History)
class HistoryAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'park', 'action', 'spot_code', 'old_chassis', 'new_chassis']
    list_filter = ['park', 'action', 'user']
    search_fields = ['spot_code', 'old_chassis', 'new_chassis']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
