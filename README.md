# VoteApp

A full-stack polling application built with **Django REST Framework** (backend) and **React** (frontend), featuring real-time voting with open and restricted voting modes, persistent result storage, and Redis-based vote aggregation.

## Features

✅ **User Authentication**
- User registration and login with JWT tokens
- Automatic token refresh (15-min access, 1-day refresh)
- Secure password handling

✅ **Poll Management**
- Create polls with multiple choice options
- Two voting modes: **Open** (anyone can vote) and **Restricted** (token-based access)
- Set poll start/end times for scheduling
- Delete polls with cascading Redis cleanup

✅ **Voting System**
- Open polls: Anonymous voting with auto-generated voter tokens
- Restricted polls: Creator generates tokens for voters
- Vote deduplication (prevent double voting)
- Live results updated every 2 seconds
- Automatic finalization to database when poll closes

✅ **Results & Analytics**
- Real-time vote counts displayed as numbers and percentages
- Results stored in Redis (fast) and persisted to SQLite (durable)
- Historical result storage in `PollResult` table

✅ **Architecture**
- **Redis Aggregate Pattern**: Votes aggregated in Redis HASHes per poll
- **Separation of Concerns**: Transient voting data in Redis, persistent poll metadata in SQLite
- **Signal-based Finalization**: Auto-saves poll results when poll closes
- **REST API**: Clean, RESTful endpoints for all operations

## Tech Stack

### Backend
- **Django 4.x** - Web framework
- **Django REST Framework** - API layer
- **SimpleJWT** - JWT authentication
- **Redis** - Vote aggregation & caching
- **SQLite** - Poll metadata & user data
- **Django Channels** - WebSocket support (development setup)

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **CSS (vanilla)** - Styling (no frameworks)

### Database
- **SQLite** - Polls, Users, Choices, Results
- **Redis** - Vote counts, voter tracking, token management

## Project Structure

```
VoteApp/
├── voteapp/                    # Django project
│   ├── manage.py
│   ├── db.sqlite3              # (auto-generated)
│   ├── voteapp/                # Project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── middleware.py       # CORS middleware
│   └── polls/                  # Main app
│       ├── models.py           # Poll, Choice, PollResult
│       ├── views.py            # API views
│       ├── serializers.py      # DRF serializers
│       ├── urls.py             # API routes
│       ├── services.py         # Business logic
│       ├── redis_votes.py      # Redis voting logic
│       ├── redis_client.py     # Redis connection
│       ├── signals.py          # Auto-finalize signal
│       └── migrations/         # DB migrations
│
├── vote-frontend/              # React app
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AllPolls.jsx
│   │   │   ├── CreatePoll.jsx
│   │   │   └── PollDetail.jsx
│   │   ├── api/
│   │   │   ├── auth.js         # Auth API calls
│   │   │   └── polls.js        # Poll API calls
│   │   ├── styles/
│   │   │   └── main.css        # Global styles
│   │   ├── App.jsx             # Router & layout
│   │   └── main.jsx
│   └── package.json
│
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Setup & Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- Redis (running locally or remotely)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/MafoudohEmmanuelle/VoteApp.git
   cd VoteApp
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   cd voteapp
   pip install -r requirements.txt
   ```

4. **Setup environment variables**
   ```bash
   cp ../.env.example ../.env
   ```
   Edit `.env` with your settings:
   ```
   DJANGO_SECRET_KEY=your-secret-key-here
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Start Redis** (in another terminal)
   ```bash
   redis-server
   ```

7. **Run Django development server**
   ```bash
   python manage.py runserver
   ```
   Backend runs at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd vote-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start React development server**
   ```bash
   npm run dev
   ```
   Frontend runs at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user (returns JWT tokens)
- `POST /api/auth/logout/` - Logout user
- `POST /api/auth/token/refresh/` - Refresh access token

### Polls
- `GET /api/polls/` - List all polls (optional filter by owner)
- `POST /api/polls/` - Create new poll
- `GET /api/polls/{public_id}/` - Get poll details
- `DELETE /api/polls/{public_id}/` - Delete poll
- `POST /api/polls/{public_id}/vote/` - Cast a vote
- `POST /api/polls/{public_id}/finalize/` - Finalize poll results (manual trigger)
- `GET /api/polls/{public_id}/tokens/` - Get unused tokens (restricted polls)
- `POST /api/polls/{public_id}/generate-tokens/` - Generate voter tokens

## How to Use

### Creating a Poll
1. Login or register
2. Click "Create Poll"
3. Enter title, description, and add choices
4. Select voting mode:
   - **Open**: Anyone can vote
   - **Restricted**: Only token holders can vote
5. Set poll duration
6. Submit - tokens auto-generated for restricted polls

### Voting
1. Navigate to a poll or use the shared link
2. For restricted polls, enter the token
3. Select a choice and submit
4. Watch live results update

### Managing Polls
- **Dashboard**: View your 2 most recent polls
- **All Polls**: View all your polls with full details
- **Expand card**: See results, copy link, copy token, delete poll
- **Tokens**: For restricted polls, copy tokens to share with voters

## Redis Aggregate Pattern

This app implements the **Redis Aggregate Pattern** where:

- **Votes** are stored in Redis HASHes (`poll:{uuid}:votes`) with choice counts
- **Voters** are tracked in Redis SETs to prevent duplicates
- **Tokens** are managed in Redis for access control
- **Results** are finalized to SQLite (`PollResult` table) when polls close

This provides:
- ⚡ Fast vote counting (O(1) increments)
- 📊 Real-time result aggregation
- 🔒 Vote deduplication without database overhead
- 💾 Durable result storage after finalization

## Database Schema

### Poll Model
```python
- public_id (UUID)
- title
- description
- created_by (ForeignKey → User)
- starts_at / ends_at
- voting_mode (open/restricted)
- status (draft/scheduled/open/closed)
- is_public
```

### Choice Model
```python
- poll (ForeignKey → Poll)
- text
- order
```

### PollResult Model
```python
- poll (OneToOneField → Poll)
- results (JSONField: {choice_id: count})
- total_votes
- finalized_at
```

## Key Features Explained

### Auto-Finalization
When a poll's `ends_at` time passes and `update_status()` is called, a Django signal automatically:
1. Detects status change to "closed"
2. Retrieves aggregate vote counts from Redis
3. Stores results in `PollResult` table
4. Keeps data safe and queryable

### Token Management
- **Open polls**: Backend generates unique tokens per vote
- **Restricted polls**: Creator generates tokens, voters provide them
- Tokens tracked in Redis to prevent reuse

### Live Results
Frontend polls `/api/polls/{id}/` every 2 seconds to get fresh vote counts from Redis.

## Error Handling

- **401 Unauthorized**: Expired token → Auto-refresh or redirect to login
- **403 Forbidden**: Not poll creator or unauthorized voter
- **404 Not Found**: Poll doesn't exist
- **400 Bad Request**: Poll closed, token invalid, already voted, etc.

## Development

### Running Tests
```bash
cd voteapp
python manage.py test
```

### Creating Superuser
```bash
python manage.py createsuperuser
```

### Database Shell
```bash
python manage.py shell
```

## Future Enhancements

- [ ] WebSocket support for instant live results (Daphne/Channels in production)
- [ ] Poll comments/discussions
- [ ] Export results to CSV/PDF
- [ ] Poll templates
- [ ] Email notifications
- [ ] Advanced analytics dashboard

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Author

**Emmanuelle Mafoudoh** - [GitHub](https://github.com/MafoudohEmmanuelle)

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ using Django, React, and Redis**
