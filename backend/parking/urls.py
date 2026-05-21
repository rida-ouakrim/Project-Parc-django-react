from django.urls import path
from . import views

urlpatterns = [
    # Infos utilisateur connecté
    path('me/', views.MeView.as_view(), name='me'),

    # Parcs
    path('parks/', views.ParkListView.as_view(), name='park-list'),
    path('parks/<str:park_name>/', views.ParkDetailView.as_view(), name='park-detail'),
    path('parks/<str:park_name>/free-spots/', views.FreeSpotsView.as_view(), name='park-free-spots'),

    # Actions sur les places
    path('spots/<int:spot_id>/assign/', views.AssignSpotView.as_view(), name='spot-assign'),
    path('spots/<int:spot_id>/release/', views.ReleaseSpotView.as_view(), name='spot-release'),

    # Transfert
    path('transfer/', views.TransferVehicleView.as_view(), name='transfer'),

    # Recherche
    path('search/', views.SearchVehicleView.as_view(), name='search'),

    # Statistiques
    path('stats/', views.GlobalStatsView.as_view(), name='stats'),

    # Historique (admin)
    path('history/', views.HistoryView.as_view(), name='history'),

    # Export Excel (admin)
    path('export/excel/', views.ExportExcelView.as_view(), name='export-excel'),
]
