import re
import io
import openpyxl
from django.http import HttpResponse
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Park, ParkingSpot, History
from .serializers import (
    ParkSerializer, ParkListSerializer,
    ParkingSpotSerializer, HistorySerializer, UserSerializer
)


def clean_chassis(s):
    """Garder uniquement les chiffres du numéro de châssis"""
    if not s:
        return None
    return "".join(re.findall(r'\d+', str(s))) or None


# ============================================================
# Authentification
# ============================================================

class MeView(APIView):
    """Retourne les infos de l'utilisateur connecté"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ============================================================
# Parcs
# ============================================================

class ParkListView(APIView):
    """Liste de tous les parcs avec statistiques"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        parks = Park.objects.all()
        serializer = ParkListSerializer(parks, many=True)
        return Response(serializer.data)


class ParkDetailView(APIView):
    """Détail d'un parc avec toutes ses places"""
    permission_classes = [IsAuthenticated]

    def get(self, request, park_name):
        try:
            park = Park.objects.get(name=park_name)
        except Park.DoesNotExist:
            return Response({'error': f'Parc "{park_name}" introuvable.'}, status=404)

        serializer = ParkSerializer(park)
        return Response(serializer.data)


# ============================================================
# Places de parking
# ============================================================

class AssignSpotView(APIView):
    """Assigner un numéro de châssis à une place libre"""
    permission_classes = [IsAuthenticated]

    def post(self, request, spot_id):
        try:
            spot = ParkingSpot.objects.get(id=spot_id)
        except ParkingSpot.DoesNotExist:
            return Response({'error': 'Place introuvable.'}, status=404)

        if spot.status == 'occupé':
            return Response({'error': f'La place {spot.code} est déjà occupée par le châssis {spot.chassis}.'}, status=400)

        chassis = clean_chassis(request.data.get('chassis', ''))
        if not chassis:
            return Response({'error': 'Numéro de châssis invalide.'}, status=400)

        # Vérifier si ce châssis existe déjà dans n'importe quel parc
        existing = ParkingSpot.objects.filter(chassis=chassis).first()
        if existing:
            return Response({
                'error': f'Ce châssis est déjà assigné à la place {existing.code} dans le parc {existing.park.name}.'
            }, status=400)

        # Assigner
        spot.status = 'occupé'
        spot.chassis = chassis
        spot.save()

        # Enregistrer dans l'historique
        History.objects.create(
            user=request.user,
            park=spot.park,
            action=History.ACTION_ASSIGNATION,
            spot_code=spot.code,
            new_chassis=chassis
        )

        return Response(ParkingSpotSerializer(spot).data, status=200)


class ReleaseSpotView(APIView):
    """Libérer une place occupée"""
    permission_classes = [IsAuthenticated]

    def post(self, request, spot_id):
        try:
            spot = ParkingSpot.objects.get(id=spot_id)
        except ParkingSpot.DoesNotExist:
            return Response({'error': 'Place introuvable.'}, status=404)

        if spot.status == 'libre':
            return Response({'error': f'La place {spot.code} est déjà libre.'}, status=400)

        old_chassis = spot.chassis

        # Libérer
        spot.status = 'libre'
        spot.chassis = None
        spot.save()

        # Enregistrer dans l'historique
        History.objects.create(
            user=request.user,
            park=spot.park,
            action=History.ACTION_LIBERATION,
            spot_code=spot.code,
            old_chassis=old_chassis
        )

        return Response(ParkingSpotSerializer(spot).data, status=200)


# ============================================================
# Transfert
# ============================================================

class TransferVehicleView(APIView):
    """Transférer un véhicule d'une place vers une autre"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        chassis = clean_chassis(request.data.get('chassis', ''))
        dest_spot_id = request.data.get('dest_spot_id')

        if not chassis:
            return Response({'error': 'Numéro de châssis invalide.'}, status=400)
        if not dest_spot_id:
            return Response({'error': 'Place de destination requise.'}, status=400)

        # Trouver la place source
        source_spot = ParkingSpot.objects.filter(chassis=chassis).first()
        if not source_spot:
            return Response({'error': f'Châssis {chassis} introuvable dans aucun parc.'}, status=404)

        # Trouver la place destination
        try:
            dest_spot = ParkingSpot.objects.get(id=dest_spot_id)
        except ParkingSpot.DoesNotExist:
            return Response({'error': 'Place de destination introuvable.'}, status=404)

        if dest_spot.status == 'occupé':
            return Response({'error': f'La place {dest_spot.code} est déjà occupée.'}, status=400)

        if source_spot.id == dest_spot.id:
            return Response({'error': 'La source et la destination sont identiques.'}, status=400)

        # Effectuer le transfert
        source_spot.status = 'libre'
        source_spot.chassis = None
        source_spot.save()

        dest_spot.status = 'occupé'
        dest_spot.chassis = chassis
        dest_spot.save()

        # Enregistrer dans l'historique
        History.objects.create(
            user=request.user,
            park=dest_spot.park,
            action=f'Transfert (depuis {source_spot.park.name} - {source_spot.code})',
            spot_code=dest_spot.code,
            old_chassis=chassis,
            new_chassis=chassis
        )

        return Response({
            'message': f'Véhicule {chassis} transféré vers {dest_spot.park.name} - {dest_spot.code}',
            'source': ParkingSpotSerializer(source_spot).data,
            'destination': ParkingSpotSerializer(dest_spot).data,
        }, status=200)


# ============================================================
# Recherche
# ============================================================

class SearchVehicleView(APIView):
    """Rechercher un véhicule par numéro de châssis dans tous les parcs"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        chassis = clean_chassis(request.query_params.get('chassis', ''))
        if not chassis:
            return Response({'error': 'Paramètre "chassis" requis.'}, status=400)

        spot = ParkingSpot.objects.filter(chassis=chassis).select_related('park').first()
        if not spot:
            return Response({'found': False, 'message': f'Châssis {chassis} introuvable.'}, status=200)

        return Response({
            'found': True,
            'spot': ParkingSpotSerializer(spot).data,
            'park_name': spot.park.name,
            'park_id': spot.park.id,
        }, status=200)


# ============================================================
# Statistiques globales
# ============================================================

class GlobalStatsView(APIView):
    """Statistiques globales de tous les parcs"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        parks = Park.objects.all()
        stats = []
        total_all = 0
        occupied_all = 0

        for park in parks:
            total = park.spots.count()
            occupied = park.spots.filter(status='occupé').count()
            free = total - occupied
            total_all += total
            occupied_all += occupied
            stats.append({
                'park_id': park.id,
                'park_name': park.name,
                'total': total,
                'occupied': occupied,
                'free': free,
            })

        return Response({
            'parks': stats,
            'global': {
                'total': total_all,
                'occupied': occupied_all,
                'free': total_all - occupied_all,
            }
        })


# ============================================================
# Historique (admin only)
# ============================================================

class HistoryView(APIView):
    """Journal de toutes les actions - réservé à l'admin"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.username != 'MAN':
            return Response({'error': 'Accès refusé. Réservé aux administrateurs.'}, status=403)

        history = History.objects.select_related('user', 'park').all()[:500]
        serializer = HistorySerializer(history, many=True)
        return Response(serializer.data)


# ============================================================
# Export Excel (admin only)
# ============================================================

class ExportExcelView(APIView):
    """Export complet en Excel - réservé à l'admin"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.username != 'MAN':
            return Response({'error': 'Accès refusé.'}, status=403)

        wb = openpyxl.Workbook()

        # Onglet Historique
        ws_history = wb.active
        ws_history.title = 'Historique'
        ws_history.append(['Date', 'Utilisateur', 'Parc', 'Action', 'Place', 'Ancien Châssis', 'Nouveau Châssis'])

        for h in History.objects.select_related('user', 'park').all():
            ws_history.append([
                h.timestamp.strftime('%Y-%m-%d %H:%M:%S') if h.timestamp else '',
                h.user.username if h.user else '',
                h.park.name if h.park else '',
                h.action,
                h.spot_code,
                h.old_chassis or '',
                h.new_chassis or '',
            ])

        # Un onglet par parc
        for park in Park.objects.all():
            ws = wb.create_sheet(title=park.name[:31])
            ws.append(['Place', 'Statut', 'Châssis'])
            for spot in park.spots.all():
                ws.append([spot.code, spot.status, spot.chassis or ''])

        # Retourner le fichier
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="ecoman_parking_export.xlsx"'
        return response


# ============================================================
# Places libres d'un parc (pour le transfert)
# ============================================================

class FreeSpotsView(APIView):
    """Liste des places libres d'un parc (pour sélection dans le transfert)"""
    permission_classes = [IsAuthenticated]

    def get(self, request, park_name):
        try:
            park = Park.objects.get(name=park_name)
        except Park.DoesNotExist:
            return Response({'error': f'Parc "{park_name}" introuvable.'}, status=404)

        free_spots = park.spots.filter(status='libre')
        serializer = ParkingSpotSerializer(free_spots, many=True)
        return Response(serializer.data)
