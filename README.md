#  Historical Token Price Oracle with Interpolation Engine

A full-stack application that enables users to query the historical price of ERC-20 tokens on Ethereum and Polygon networks. If the exact price is not available, it calculates an interpolated value using surrounding data points. It also provides a scheduling feature to fetch the complete daily price history of a token from its creation date to the present.

---

##  Features

### Frontend (Next.js + Tailwind + Zustand)
- **Token Price Form**: Enter `tokenAddress`, select `network`, and input `timestamp`
- **Result Display**: Shows price with source (cache, alchemy, interpolated)
- **Schedule Button**: Triggers full historical price fetch
- **Progress Bar**: Visual feedback for schedule completion

### Backend (Node.js + Express + Redis + BullMQ)
- **GET /price**: Query price for a token at a specific time
- **POST /schedule**: Start background job to fetch token's full history
- **Redis Caching**: 5-minute TTL to reduce latency
- **BullMQ Scheduler**: Fetches and stores prices daily in MongoDB
- **Interpolation Engine**: Estimates price between two known values
- **Alchemy SDK**: Used for historical price and first transaction date

---

## 🛠️ Tech Stack

| Component      | Tech                      | Purpose                                  |
|----------------|---------------------------|------------------------------------------|
| Frontend       | Next.js, Tailwind CSS     | UI & server-side rendering               |
| State Mgmt     | Zustand                   | Manage form & loading states             |
| Backend        | Node.js, Express          | RESTful API endpoints                    |
| Scheduler      | BullMQ                    | Job scheduling for historical data fetch |
| Cache          | Redis (TTL: 5 mins)       | Low-latency response                     |
| Database       | MongoDB                   | Persistent price storage                 |
| Web3 Provider  | Alchemy SDK               | Access on-chain historical data          |

---

## 🔗 API Documentation

### 1. `GET /price`

#### Request:
```json
{
  "token": "0xA0b869...c2d6",
  "network": "ethereum",
  "timestamp": 1678901234
}

**Use your preferred IDE**
Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


