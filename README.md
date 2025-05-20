# Monorepo with React Native Frontend and Node.js Backend

This repository contains a monorepo setup with:

- **Frontend**: React Native application built with Expo (TypeScript)
- **Backend**: Node.js server built with Express (TypeScript)
- **Database**: MongoDB

## Directory Structure

```
/
├── frontend/  # React Native (Expo) application
├── backend/   # Node.js (Express) server
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended due to some package requirements)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- MongoDB instance running (locally or cloud-hosted)

### variable updates

1. Create OAuth google client id at https://console.cloud.google.com

- GOOGLE_CLIENT_ID=your-new-google-client-id.apps.googleusercontent.com

2. Create OAuth apple service id and key at https://developer.apple.com/account

- APPLE_CLIENT_ID=com.your.bundle.id
- APPLE_TEAM_ID=XXXXXX
- APPLE_KEY_ID=XXXXXX
- APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

3. Project ID, need to create new EAS project id and replace 77ad8fe8-9387-4b6f-9a8e-4449b7d1e0bc everywhere

4. Update bundleIdentifier and package in app.json

    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.appframework.stylelist"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.appframework.stylelist"
    },

### Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  Start the Expo development server:
    ```bash
    npm start
    # or
    yarn start
    ```
    This will open the Expo DevTools in your browser. You can then run the app on an emulator/simulator or a physical device using the Expo Go app.

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend` directory and add your MongoDB connection string:
    ```env
    MONGO_URI=your_mongodb_connection_string
    ```
    Replace `your_mongodb_connection_string` with your actual MongoDB URI (e.g., `mongodb://localhost:27017/mydatabase`).

4.  Start the development server:
    ```bash
    npm run dev
    ```
    The server will start, typically on `http://localhost:3000`.

5.  To build the TypeScript code:
    ```bash
    npm run build
    ```
    This will compile the TypeScript files into the `dist` directory.

## Further Development

- **Frontend**: Develop your React Native screens and components in the `frontend` directory.
- **Backend**: Implement your API endpoints, database models (Mongoose schemas), and business logic in the `backend/src` directory. 