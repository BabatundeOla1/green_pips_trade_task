# GreenPipsTradingTask

Green Pips Trading: Supabase Auth & File Service

This project provides authentication and file management APIs powered by Supabase and Deno.
It allows users to sign up, sign in, upload files, and generate signed URLs for secure access.




##TECH STACK:
Deno – Runtime environment.
Supabase – Authentication, database, and storage.
TypeScript – Strongly typed server logic.




##CLONE THE REPOSITORY:
git clone https://github.com/BabatundeOla1/green_pips_trade_task.git
cd green-pips-trading-task


##INSTALL DEPENDENCIES
deno task cache


##ENVIRONMENT VARIABLES
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key


##RUN THE SERVER
deno run --allow-net --allow-env service.ts

The server starts on: http://localhost:8787



##ENDPOINTS: 

##SIGNUP: 
This endpoint creates a new user with email and password.

Endpoint:
POST http://localhost:8787/signup

Request (JSON):

{
  "email": "username@gmail.com",
  "password": "123456789"
}


Response:

{
  "data": {
    "user": {
      "id": "eb3ab671-0e9e-4a56-9d96-c87f74f278e4",
      "email": "username@gmail.com",
      "created_at": "2025-09-20T08:05:48.484544Z"
    },
    "session": null
  }
}



##SIGNIN:
This endpoint authenticates an existing user.

Endpoint:
POST http://localhost:8787/signin

Request (JSON):

{
  "email": "username@gmail.com",
  "password": "123456789"
}


Response (with access_token from supabase for authorization):

{
  "data": {
    "user": {
      "id": "c4e270ec-b97e-4a67-8833-0ea1f790f50c",
      "email": "username@gmail.com"
    },
    "session": {
      "access_token": "************",
      "token_type": "bearer",
      "expires_in": 3600,
      "refresh_token": "**********"
    }
  }
}



##UPLOAD FILE:
Thos endpoint upload files to Supabase storage (requires authentication).

Endpoint:
POST http://localhost:8787/uploadFile

Headers:
Authorization: Bearer <access_token>


Request (form-data):
file: <your_file>


Response:

{
  "filePath": "user-c4e270ec-b97e-4a67-8833-0ea1f790f50c/damie1.jpe"
}





##GET SIGNED URL:
This endpoint Generates a temporary signed URL for accessing uploaded files.

Endpoint:
POST http://localhost:8787/getSignedUrl

Headers:
Authorization: Bearer <access_token>

Enrolled user can get a signed URL.
Request (JSON):
{
  "filePath": "user-c4e270ec-b97e-4a67-8833-0ea1f790f50c/damie1.jpe",
  "expiresIn": 3600
}


(expiresIn is optional, defaults to 60 seconds if omitted.)

Response:
{
  "url": "https://<project>.supabase.co/storage/v1/object/sign/files/.../damie1.jpe?token=eyJra...",
  "expiresIn": 3600
}

Different user cannot
Request with another user’s filePath:
Request:
{
    "filePath": "user-4352c24d-61d7-4af5-8626-4a1cb383ffba/damie1.jpe",
    "expiresIn": "60"
}

Response:
{
  "error": "Forbidden",
  "code": 403
}
