import os
import base64
import random
import string
from email.mime.text import MIMEText

from django.shortcuts import render, redirect
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

def generate_ticket_id(length=8):
   
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def create_message(sender, to, subject, message_text):
    
    message = MIMEText(message_text)
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    return {'raw': raw_message}

def send_ticket_email(recipient, name, ticket_id):

    creds = None
    token_path = 'token.json'
    
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=8080, prompt='consent')
        
        with open(token_path, "w") as token:
            token.write(creds.to_json())
    
    try:
        service = build("gmail", "v1", credentials=creds)
        sender = "aarush4399@gmail.com"  
        subject = "Your E-Week Ticket"
        body = (
            f"Hi {name},\n\n"
            f"Thank you for signing up for E-Week 2025!\n"
            f"Your Ticket ID is {ticket_id}.\n\n"
            "We look forward to seeing you at the event.\n\n"
            "Best regards,\nE-Week Team"
        )
        message = create_message(sender, recipient, subject, body)
        response = service.users().messages().send(userId="me", body=message).execute()
        print("Email sent, response:", response)
    except HttpError as error:
        print("An error occurred while sending email:", error)

def index(request):
    return render(request, "ticket/index.html")

def signup(request):
    
    if request.method == "POST":
        name = request.POST.get('name')
        email = request.POST.get('email')
        ticket_id = generate_ticket_id()
        
        send_ticket_email(email, name, ticket_id)
        return redirect('confirmation')
    return render(request, "ticket/signup.html")

def confirmation(request):
    return render(request, "ticket/confirmation.html")
