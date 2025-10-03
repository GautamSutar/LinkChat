cd backend

source venv/Scripts/activate

python manage.py runserver

daphne core.asgi:application --port 8001

python manage.py makemigrations

python manage.py migrate

daphne -b 0.0.0.0 -p 8000 core.asgi:application