# EcoMan Parking

EcoMan Parking est une application full-stack de gestion digitalisée de parcs automobiles. Elle permet de suivre en temps réel l'occupation des places de parking à travers plusieurs sites à l'aide d'une carte 2D interactive.

## Fonctionnalités principales

* **Carte Interactive (SVG)** : Vue 2D détaillée des parcs avec possibilité de zoomer, de se déplacer librement sur la carte et d'interagir avec les places.
* **Gestion des véhicules** : Assigner un numéro de châssis à une place, libérer une place, ou transférer un véhicule vers un autre emplacement.
* **Recherche** : Retrouver instantanément l'emplacement exact d'un véhicule grâce à son numéro de châssis.
* **Système d'authentification et rôles** : 
  * Administrateur : Accès total au système, à l'historique complet et à l'export Excel des données.
  * Agent de sécurité : Accès à la carte pour la gestion quotidienne des entrées et sorties.
* **Historique et Traçabilité** : Journalisation complète de toutes les actions effectuées sur les places de parking.

## Technologies

* **Frontend** : React.js (Vite), Vanilla CSS, Axios
* **Backend** : Python, Django, Django REST Framework
* **Authentification** : JWT (JSON Web Tokens)
* **Base de données** : SQLite

## Installation et lancement en local

### 1. Backend (Django)

Ouvrir un terminal et se placer à la racine du projet :

```bash
cd backend

# Activer l'environnement virtuel (sur Windows)
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Appliquer les migrations
python manage.py migrate

# Démarrer le serveur de développement
python manage.py runserver
```

Le backend sera accessible sur `http://localhost:8000/`.

### 2. Frontend (React)

Ouvrir un deuxième terminal à la racine du projet :

```bash
cd frontend

# Installer les paquets
npm install

# Lancer l'application
npm run dev
```

L'application web sera accessible sur `http://localhost:5173/`.
