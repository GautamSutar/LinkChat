cd backend

source venv/Scripts/activate

python manage.py runserver

daphne core.asgi:application --port 8001

python manage.py makemigrations

python manage.py migrate