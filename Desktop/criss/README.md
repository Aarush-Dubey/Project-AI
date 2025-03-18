# Django Book API

This project implements a simple RESTful API for managing books using Django and Django REST Framework.

## Features
- CRUD operations for Book model
- Custom POST method on `/books/{id}/` for updating a book
- Pagination and filtering by `author` and `published_date`

## Tech Stack
- **Backend Framework:** Django, Django REST Framework
- **Database:** SQLite (default)
- **API Testing:** Postman

## Setup Instructions

1. **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/django-book-api.git
    cd django-book-api
    ```



2. **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *Ensure your `requirements.txt` includes `Django`, `djangorestframework`, and `django-filter`.*

3. **Apply migrations:**
    ```bash
    python manage.py migrate
    ```

4. **Run the development server:**
    ```bash
    python manage.py runserver
    ```

5. **Test the API:**
    - Use Postman or any other API client to test the endpoints:
      - `GET /books/`
      - `POST /books/` to create a book
      - `GET /books/{id}/` to retrieve a book
      - `POST /books/{id}/` to update a book
      - `DELETE /books/{id}/` to delete a book

## Deployment
You can run the project locally or deploy it to your preferred cloud hosting service.

## Hosted Version
*(Optional)* If you have deployed the project online, include the hosted link here.
