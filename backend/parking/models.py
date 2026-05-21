from django.db import models
from django.contrib.auth.models import User


class Park(models.Model):
    """Les 4 parcs de l'entreprise"""
    name = models.CharField(max_length=50, unique=True, verbose_name="Nom du parc")

    class Meta:
        verbose_name = "Parc"
        verbose_name_plural = "Parcs"
        ordering = ['name']

    def __str__(self):
        return self.name


class ParkingSpot(models.Model):
    """Une place de parking dans un parc"""
    STATUS_LIBRE = 'libre'
    STATUS_OCCUPE = 'occupé'
    STATUS_CHOICES = [
        (STATUS_LIBRE, 'Libre'),
        (STATUS_OCCUPE, 'Occupé'),
    ]

    park = models.ForeignKey(
        Park,
        on_delete=models.CASCADE,
        related_name='spots',
        verbose_name="Parc"
    )
    code = models.CharField(max_length=20, verbose_name="Code place")
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=STATUS_LIBRE,
        verbose_name="Statut"
    )
    chassis = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name="Numéro de châssis"
    )

    # Coordonnées SVG pour la carte 2D interactive
    x = models.FloatField(default=0, verbose_name="Position X")
    y = models.FloatField(default=0, verbose_name="Position Y")
    w = models.FloatField(default=64, verbose_name="Largeur")
    h = models.FloatField(default=40, verbose_name="Hauteur")

    class Meta:
        verbose_name = "Place de parking"
        verbose_name_plural = "Places de parking"
        unique_together = ('park', 'code')
        ordering = ['park', 'code']

    def __str__(self):
        return f"{self.park.name} - {self.code} ({self.status})"

    def is_libre(self):
        return self.status == self.STATUS_LIBRE

    def is_occupe(self):
        return self.status == self.STATUS_OCCUPE


class History(models.Model):
    """Journal de toutes les actions effectuées"""
    ACTION_ASSIGNATION = 'Assignation'
    ACTION_LIBERATION = 'Libération'
    ACTION_TRANSFERT = 'Transfert'

    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Date et heure")
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Utilisateur"
    )
    park = models.ForeignKey(
        Park,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Parc"
    )
    action = models.CharField(max_length=100, verbose_name="Action")
    spot_code = models.CharField(max_length=20, verbose_name="Code place")
    old_chassis = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name="Ancien châssis"
    )
    new_chassis = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name="Nouveau châssis"
    )

    class Meta:
        verbose_name = "Historique"
        verbose_name_plural = "Historiques"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp} - {self.action} - {self.spot_code}"
