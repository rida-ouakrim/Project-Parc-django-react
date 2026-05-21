"""
Commande Django pour importer les données de l'ancienne base SQLite du prototype Streamlit
vers la nouvelle base Django.
"""
import sqlite3
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from parking.models import Park, ParkingSpot, History


# Mapping des tables SQLite vers les noms de parcs Django
TABLE_TO_PARK = {
    'places': 'ECOMAIL',
    'places_TISSIR': 'TISSIR',
    'places_SEFAMAR': 'SEFAMAR',
    'places_V_VLOG': 'V VLOG',
}


class Command(BaseCommand):
    help = "Importe les données de l'ancienne base SQLite (prototype Streamlit) dans Django"

    def add_arguments(self, parser):
        parser.add_argument(
            'db_path',
            type=str,
            help="Chemin vers le fichier SQLite à importer (ex: parking.db)"
        )

    def handle(self, *args, **options):
        db_path = options['db_path']

        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
        except Exception as e:
            self.stderr.write(f"Erreur connexion: {e}")
            return

        # ==========================================
        # 1. Importer les utilisateurs
        # ==========================================
        self.stdout.write("\n📋 Import des utilisateurs...")
        try:
            users_data = cursor.execute("SELECT username, password, role FROM users").fetchall()
            for username, password, role in users_data:
                user, created = User.objects.get_or_create(username=username)
                if created:
                    user.set_password(password)
                    if role == 'admin':
                        user.is_staff = True
                        user.is_superuser = True
                    user.save()
                    self.stdout.write(f"  ✓ Utilisateur '{username}' créé (rôle: {role})")
                else:
                    self.stdout.write(f"  → Utilisateur '{username}' existe déjà")
        except Exception as e:
            self.stdout.write(f"  ⚠ Pas de table users: {e}")

        # ==========================================
        # 2. Importer les places (status + chassis)
        # ==========================================
        self.stdout.write("\n📋 Import des places de parking...")

        for table_name, park_name in TABLE_TO_PARK.items():
            try:
                park = Park.objects.get(name=park_name)
            except Park.DoesNotExist:
                self.stderr.write(f"  ❌ Parc '{park_name}' non trouvé. Lance d'abord: manage.py seed_spots")
                continue

            try:
                rows = cursor.execute(
                    f"SELECT code_place, status, chassis FROM {table_name}"
                ).fetchall()
            except Exception as e:
                self.stderr.write(f"  ❌ Table '{table_name}' introuvable: {e}")
                continue

            updated = 0
            for code_place, status, chassis in rows:
                try:
                    spot = ParkingSpot.objects.get(park=park, code=code_place)
                    # Normaliser le statut (l'encodage peut poser problème)
                    if status and ('occup' in status.lower() or 'occ' in status.lower()):
                        spot.status = 'occupé'
                    else:
                        spot.status = 'libre'
                    spot.chassis = chassis if chassis else None
                    spot.save()
                    updated += 1
                except ParkingSpot.DoesNotExist:
                    pass  # Place qui n'existe plus dans la définition actuelle

            self.stdout.write(
                self.style.SUCCESS(f"  ✓ {park_name}: {updated} places mises à jour")
            )

        # ==========================================
        # 3. Importer l'historique
        # ==========================================
        self.stdout.write("\n📋 Import de l'historique...")
        try:
            history_rows = cursor.execute(
                "SELECT timestamp, username, park_name, action, code_place, old_chassis, new_chassis FROM history ORDER BY id"
            ).fetchall()

            imported = 0
            for timestamp, username, park_name, action, code_place, old_ch, new_ch in history_rows:
                user = User.objects.filter(username=username).first()
                park = Park.objects.filter(name=park_name).first()

                History.objects.create(
                    user=user,
                    park=park,
                    action=action or '',
                    spot_code=code_place or '',
                    old_chassis=old_ch,
                    new_chassis=new_ch,
                )
                imported += 1

            self.stdout.write(
                self.style.SUCCESS(f"  ✓ {imported} entrées d'historique importées")
            )
        except Exception as e:
            self.stderr.write(f"  ❌ Erreur import historique: {e}")

        conn.close()
        self.stdout.write(self.style.SUCCESS("\n✅ Import terminé avec succès !"))
