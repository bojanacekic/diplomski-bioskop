# Smart Cinema

Smart Cinema is a cinema information system built with a microservice architecture. It covers the complete customer journey from browsing movies and reserving seats to purchasing PDF tickets and validating their QR codes at the cinema entrance.

## Features

- User registration, JWT authentication and role-based authorization
- User profile and password management
- Password reset through a time-limited email link
- Movie, hall and screening management
- Seat selection and grouped reservations
- Reservation confirmation emails
- Online and cash ticket purchases
- PDF tickets with a unique QR code for each seat
- Single-use ticket validation
- Movie ratings and personalized recommendations
- Local AI customer support
- Browser-compatible routing with refresh, Back and Forward support
- Automatic logout when the session expires or the application is restarted

## Technologies

- Frontend: React 19 and Vite
- Backend: ASP.NET Core 8 Web API
- Database: Microsoft SQL Server 2025 / SQL Server Express
- ORM and migrations: Entity Framework Core
- Authentication and authorization: JWT
- API routing: YARP Reverse Proxy
- Email delivery: SMTP
- Local AI inference: LM Studio
- Version control: Git and GitHub

## Services

| Service | Default port | Database |
| --- | ---: | --- |
| Auth microservice | 5000 | `DiplomskiAuthDb` |
| API Gateway | 5001 | — |
| Movies microservice | 5002 | `DiplomskiMoviesDb` |
| Hall management microservice | 5003 | `DiplomskiHallsDb` |
| Screenings microservice | 5004 | `DiplomskiScreeningsDb` |
| Reservations microservice | 5005 | `DiplomskiReservationsDb` |
| Ticket purchases microservice | 5006 | `DiplomskiTicketsDb` |
| Payments microservice | 5007 | `DiplomskiPaymentsDb` |
| Ratings and recommendations microservice | 5008 | `DiplomskiRatingsRecommendationsDb` |
| AI support microservice | 5009 | — |
| React frontend | 5173 | — |

The frontend communicates with backend services through the API Gateway at `http://localhost:5001`.

## Prerequisites

- .NET 8 SDK
- Node.js and npm
- SQL Server Express running on `localhost\SQLEXPRESS`
- LM Studio for AI support
- An SMTP account for reservation and password-reset emails

The rest of the application can run while LM Studio is offline, but AI support will report that the local model is unavailable.


## AI support configuration

Install LM Studio, start its Local Server and load the `qwen3-4b-instruct-2507` model.


## Run the application

From the project root, install frontend dependencies when running the project for the first time:

```powershell
cd frontend
npm install
cd ..
```

Start all backend services, the API Gateway and the frontend:

```powershell
.\start-all.ps1
```

The script opens a separate PowerShell window for every application. Entity Framework Core applies pending database migrations during service startup.

Open [http://localhost:5173](http://localhost:5173).

To stop an application, focus its PowerShell window and press `Ctrl + C`.

## Run with Docker

Docker Desktop can run the frontend, all backend services and SQL Server together.
Create your local Docker environment file first:

```powershell
Copy-Item .env.docker.example .env.docker
```

Change `MSSQL_SA_PASSWORD` and `JWT_SECRET_KEY` in `.env.docker` before the first database
startup, then start everything:

```powershell
docker compose --env-file .env.docker up --build
```

Open [http://localhost:5173](http://localhost:5173). The gateway is available at
[http://localhost:5001](http://localhost:5001), while SQL Server is exposed on port `1433`.
Database data is kept in the `smart-cinema-sqlserver-2025-data` Docker volume. Stop the application with
`Ctrl + C`, or run `docker compose --env-file .env.docker down` from another terminal.

Do not add `-v` to the `down` command unless you intentionally want to delete all Docker
database data. Existing SQL Express data can be migrated with `COPY_ONLY` backups; keep the
backup files until you have verified the Docker copy.

LM Studio remains a host application. Start its local server and enable access from the
local network; containers connect to it through `host.docker.internal`. SMTP values are
optional for startup, but email features require valid credentials in `.env.docker`.

## Run individual applications

Frontend only:

```powershell
cd frontend
npm run dev
```
