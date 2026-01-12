# E-Commerce Internship Project

> Note: This project is being developed as part of a practice assignment during my internship. It serves as a playground for learning full-stack development, database management, and cloud deployment.

## 🛠 Tech Stack
**Frontend:**
- Next.js 14 (App Router)
- Tailwind CSS
- React Query / Context API (State Management)

**Backend:**
- Node.js & Express.js
- Prisma ORM (Data Access Layer)
- JWT (Authentication)
- PayPal API (Payment Integration)

**Database:**
- MySQL (Production via TiDB Cloud)
- Optional: Docker (for local development)

## 🚀 Getting Started Locally
This project uses a **hybrid development workflow**. You run the Frontend and Backend locally on your machine, while the database runs in the cloud (TiDB) to save setup time.

1. **Prerequisites**
- Node.js (v18 or higher)
- npm or yarn
- Git

2. **Clone the Repository**
```Bash
git clone https://github.com/aryannaik225/Nodejs-ecommerce.git
cd Nodejs-ecommerce
```

3. **Backend Setup (crud folder)**
The backend handles API requests, authentication, and database connections.
1. Navigate to the backend folder:
```Bash
cd crud
```

2. Install dependencies:
```Bash
npm install
```

3. **Environment Variables**: Create a .env file in the crud folder and add the following:

```Code snippet

PORT=4000
DATABASE_URL="mysql://<your-tidb-user>:<password>@<host>:4000/test?sslaccept=strict"
JWT_SECRET="your_secret_key"
PAYPAL_CLIENT_ID="your_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_secret"
```

4. **Generate Prisma Client**: This syncs your local code with the database schema.
```Bash
npx prisma generate
```

5. **Start the Server:**
```Bash
npm run dev
# The server should start on http://localhost:4000
```

4. **Frontend Setup (`ecommerce-nodejs` folder)**
1. Open a new terminal and navigate to the frontend folder:
```Bash
cd ecommerce-nodejs
```

2. Install dependencies:
```Bash
npm install
```

3. **Environment Variables**: Create a `.env.local` file in the `ecommerce-nodejs` folder:

```Code snippet
# Point this to your local backend
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"

# PayPal Client ID (for the button to render)
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your_paypal_client_id"
```

4. Start the Frontend:
```Bash
npm run dev
# The app should be running at http://localhost:3000
```

## 🗄️ Database Setup (Two Options)

### Option A: TiDB Cloud (Recommended)
The project is currently configured to run with TiDB Cloud.
1. Ensure your `DATABASE_URL` in the backend `.env` points to your TiDB instance.
2. Prisma will automatically connect to it. No local installation required.

### Option B: Local Docker (For Offline Dev)
If you prefer running the database locally instead of connecting to the cloud, you can use Docker.

1. Make sure Docker Desktop is running.

2. Run the MySQL container:

```Bash
docker run --name ecom-db -d -p 3307:3306 -e MYSQL_ROOT_PASSWORD='test' mysql:8.0
```

3. Update your backend `.env`:
```Code snippet
DATABASE_URL="mysql://root:test@localhost:3307/ecom"
```

4. Push the schema to your local DB:
```Bash
npx prisma db push
```

## 🤝 Contributing
**Contributions are currently closed.** As this is an active internship learning project, I am not accepting pull requests or outside contributions at this time. However, feel free to browse the code or fork it for your own educational purposes.