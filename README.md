# Smart Cinema

Smart Cinema is a cinema information system built with a microservice architecture. It supports user authentication, movie and hall management, screening scheduling, and seat reservations.

## Technologies

- Frontend: React and Vite
- Backend: ASP.NET Core 8 Web API
- Database: Microsoft SQL Server Express
- ORM: Entity Framework Core
- Authentication and authorization: JSON Web Tokens (JWT)
- Service routing: API Gateway
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
| React frontend | 5173 | — |


## Prerequisites

- .NET 8 SDK
- Node.js and npm
- SQL Server Express running on `localhost\SQLEXPRESS`


## Run the application

From the project root, start all backend services, the API Gateway, and the frontend:

```powershell
.\start-all.ps1
```

The script opens a separate PowerShell window for every application. On the first run, Entity Framework Core creates and migrates the service databases.

Open the frontend at [http://localhost:5173](http://localhost:5173).

To stop an application, focus its PowerShell window and press `Ctrl + C`.

## Frontend only

```powershell
cd frontend
npm install
npm run dev
```
