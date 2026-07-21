# Docker setup

This project can run as three containers:

- `db`: MySQL 8.4
- `backend`: Spring Boot API on port `8080`
- `frontend`: Next.js dev server on port `3000`

## Prepare environment values

Create a local `.env` file from the example before running Docker:

```powershell
Copy-Item .env.example .env
```

Then edit `.env` and replace at least these values before using the stack seriously:

- `MYSQL_ROOT_PASSWORD`
- `JWT_SECRET`
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`

## Build without starting

```powershell
docker compose build
```

## Run locally later

```powershell
docker compose up -d
```

Open the frontend at:

```text
http://localhost:3000
```

The backend is exposed at:

```text
http://localhost:8080
```

MySQL is exposed to the host on port `3307` by default to avoid conflicts with a locally installed MySQL server. Inside Docker, the backend still connects to MySQL at `db:3306`.

## Stop later

```powershell
docker compose down
```

To remove the MySQL data volume too:

```powershell
docker compose down -v
```

## Notes

- Docker uses the Spring `docker` profile from `backend/src/main/resources/application-docker.properties`.
- The backend connects to MySQL with host `db`, because that is the Compose service name.
- Uploaded files are stored in the shared `uploaded_files` volume. The backend writes to `/app/uploads`, and the frontend reads the same files from `/app/public/uploads`.
- The frontend container runs `npm run dev -- --hostname 0.0.0.0 --port 3000`.
- The frontend source directory is mounted into the container, with separate Docker volumes for `node_modules` and `.next`.
- If `NEXT_PUBLIC_API_URL` changes while the dev server is running, restart the frontend container.
- For production, set `SESSION_COOKIE_SECURE=true` and use HTTPS.
