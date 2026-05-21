from django.core.management.base import BaseCommand
from parking.models import Park, ParkingSpot


def get_ecomail_spots():
    """Coordonnées exactes du parc ECOMAIL tirées du prototype Streamlit"""
    spots = []

    # C15 to C1
    curr_x = 20
    for i in range(15, 0, -1):
        spots.append({"code": f"C{i}", "x": curr_x, "y": 20, "w": 64, "h": 100})
        curr_x += 64

    # B64, B65
    curr_y = 500
    for i in range(64, 66):
        spots.append({"code": f"B{i}", "x": 20, "y": curr_y, "w": 100, "h": 40})
        curr_y += 40

    # Middle Block B1 to B63
    base_y = 250
    for row in range(21):
        y = base_y + row * 43
        spots.append({"code": f"B{row*3 + 3}", "x": 350, "y": y, "w": 100, "h": 43})
        spots.append({"code": f"B{row*3 + 2}", "x": 450, "y": y, "w": 100, "h": 43})
        spots.append({"code": f"B{row*3 + 1}", "x": 550, "y": y, "w": 100, "h": 43})

    # A25 to A1
    curr_y = 200
    for i in range(25, 0, -1):
        spots.append({"code": f"A{i}", "x": 860, "y": curr_y, "w": 120, "h": 36})
        curr_y += 36

    # D47 to D40 (pairs)
    m_x = 980
    y_box = 20
    for i in range(46, 39, -2):
        spots.append({"code": f"D{i}",   "x": m_x,      "y": y_box, "w": 75, "h": 25})
        spots.append({"code": f"D{i+1}", "x": m_x + 75, "y": y_box, "w": 75, "h": 25})
        y_box += 25

    # Auto 1 et Auto 2
    spots.append({"code": "Auto 1", "x": m_x, "y": 120, "w": 150, "h": 30})
    spots.append({"code": "Auto 2", "x": m_x, "y": 150, "w": 150, "h": 30})

    # D39 to D28 (pairs)
    y_box = 180
    for i in range(38, 27, -2):
        spots.append({"code": f"D{i}",   "x": m_x,      "y": y_box, "w": 75, "h": 33})
        spots.append({"code": f"D{i+1}", "x": m_x + 75, "y": y_box, "w": 75, "h": 33})
        y_box += 33

    # W21 to W1
    w_y = 378
    for i in range(21, 0, -1):
        spots.append({"code": f"W{i}", "x": m_x, "y": w_y, "w": 150, "h": 38.1})
        w_y += 38.1

    # Provisoires Prv1, Prv2, Prv3
    spots.append({"code": "Prv1", "x": 1140, "y": -35, "w": 65, "h": 45})
    spots.append({"code": "Prv2", "x": 1215, "y": -35, "w": 65, "h": 45})
    spots.append({"code": "Prv3", "x": 1290, "y": -35, "w": 65, "h": 45})

    # D27 to D2 (pairs, côté droit)
    d_x = 1250
    curr_y = 20
    for i in range(26, 1, -2):
        spots.append({"code": f"D{i}",   "x": d_x,      "y": curr_y, "w": 70, "h": 37})
        spots.append({"code": f"D{i+1}", "x": d_x + 70, "y": curr_y, "w": 70, "h": 37})
        curr_y += 37

    # D1 et S35
    spots.append({"code": "D1",  "x": d_x,      "y": curr_y, "w": 70, "h": 37})
    spots.append({"code": "S35", "x": d_x + 70, "y": curr_y, "w": 70, "h": 37})

    # S34 to S1 (CAMION SITRAK)
    s_y = 540
    for row in range(17):
        left_s  = 33 - 2 * row
        right_s = 34 - 2 * row
        spots.append({"code": f"S{left_s}",  "x": d_x,      "y": s_y, "w": 70, "h": 37})
        spots.append({"code": f"S{right_s}", "x": d_x + 70, "y": s_y, "w": 70, "h": 37})
        s_y += 37

    # S36 to S61 (rangée horizontale en bas)
    start_x = 20
    start_y = 1318
    s_w = 1370 / 26
    s_idx = 61
    for col in range(26):
        spots.append({"code": f"S{s_idx}", "x": start_x + col * s_w, "y": start_y, "w": s_w, "h": 85})
        s_idx -= 1

    # S62 to S68
    start_x2 = 350
    start_y2 = 1180
    s_w2 = 300 / 7
    s_idx2 = 62
    for col in range(7):
        spots.append({"code": f"S{s_idx2}", "x": start_x2 + col * s_w2, "y": start_y2, "w": s_w2, "h": 75})
        s_idx2 += 1

    return spots


def get_generic_spots(rows=20, cols=15):
    """Grille générique pour TISSIR, SEFAMAR, V VLOG"""
    spots = []
    num = 1
    for row in range(rows):
        for col in range(cols):
            spots.append({
                "code": f"P{num}",
                "x": 30 + col * 62,
                "y": 50 + row * 55,
                "w": 55,
                "h": 40,
            })
            num += 1
    return spots


PARKS_CONFIG = {
    "ECOMAIL":  get_ecomail_spots,
    "TISSIR":   get_generic_spots,
    "SEFAMAR":  get_generic_spots,
    "V VLOG":   get_generic_spots,
}


class Command(BaseCommand):
    help = "Initialise les parcs et les places de parking dans la base de données"

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Supprimer toutes les places existantes avant de recréer',
        )

    def handle(self, *args, **options):
        reset = options['reset']

        for park_name, spots_fn in PARKS_CONFIG.items():
            park, created = Park.objects.get_or_create(name=park_name)
            action = "créé" if created else "trouvé"
            self.stdout.write(f"  Parc {park_name} {action}.")

            if reset:
                deleted, _ = ParkingSpot.objects.filter(park=park).delete()
                self.stdout.write(f"    {deleted} places supprimées.")

            spots_data = spots_fn()
            existing_codes = set(ParkingSpot.objects.filter(park=park).values_list('code', flat=True))

            created_count = 0
            for s in spots_data:
                if s['code'] not in existing_codes:
                    ParkingSpot.objects.create(
                        park=park,
                        code=s['code'],
                        status='libre',
                        chassis=None,
                        x=s['x'],
                        y=s['y'],
                        w=s['w'],
                        h=s['h'],
                    )
                    created_count += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"    ✓ {created_count} nouvelles places créées pour {park_name} "
                    f"(total: {len(spots_data)})"
                )
            )

        self.stdout.write(self.style.SUCCESS("\n✅ Seed terminé avec succès !"))
