
## Frontend Setup (Vite)

### 2. Install Frontend Dependencies
Navigate to the `frontend` directory and install the required dependencies:
```bash
cd frontend
npm install
```

### 3. Create a `.env` File
In the `frontend` directory, create a `.env` file with the following content:
```env
VITE_BASE_URL=YOUR_BACKEND_SERVER_URL
```
Replace `YOUR_BACKEND_SERVER_URL` with the URL where your backend is hosted (e.g., `http://localhost:8000`).

### 4. Run the Frontend Development Server
To start the development server for the frontend, run:
```bash
npm run dev
```

The development server will start, and you can access it at the URL displayed in your terminal (e.g., `http://localhost:5173`).
