# BrewOps - Tea Inventory Management System

A comprehensive tea inventory management system built with React.js frontend and Node.js/Express backend, designed for tea production companies to manage inventory, orders, suppliers, and analytics.

## 🚀 Features

- **Multi-Role Dashboard System**
  - Admin Dashboard with user management and system oversight
  - Manager Dashboard with inventory reports and analytics
  - Staff Dashboard for order processing
  - Supplier Dashboard for supply management

- **Inventory Management**
  - Real-time inventory tracking
  - Tea grade classification (Premium, Standard, Basic)
  - Source distribution analytics
  - Monthly trend analysis

- **Order Management**
  - Order processing workflow
  - Status tracking (Pending, Confirmed, Processing, Completed)
  - Staff order assignments

- **Analytics & Reporting**
  - Interactive charts and graphs
  - Tea type performance metrics
  - Supplier performance tracking
  - Export functionality (PDF, Excel)

- **Real-time Communication**
  - Message system between roles
  - Live notifications
  - Status updates

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **React Router** - Navigation
- **Chart.js** - Data visualization
- **Lucide React** - Icons
- **Lottie React** - Animations
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **MySQL** (v8.0 or higher)
- **Git**

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/thennakoontakk/BrewOps-next.git
cd BrewOps-next
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies (if separate package.json exists in server folder)
cd server
npm install
cd ..
```

### 3. Database Setup

1. **Create MySQL Database:**
   ```sql
   CREATE DATABASE softora_app;
   ```

2. **Configure Database Connection:**
   - Copy `.env.example` to `.env` (if exists) or create a new `.env` file
   - Update the database configuration in `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=softora_app
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024

# Server Configuration (Backend)
PORT=5000

# Frontend Configuration (for React app)
REACT_APP_BACKEND_URL=http://localhost:5000
```

3. **Database Tables:**
   The application will automatically create the necessary tables when you first run the server. The database includes tables for:
   - Users (with role-based access)
   - Inventory items
   - Orders
   - Messages
   - Suppliers

### 4. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=softora_app
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Server Configuration
PORT=5000

# Frontend Configuration
REACT_APP_BACKEND_URL=http://localhost:5000
```

## 🚀 Running the Application

### Option 1: Run Frontend and Backend Separately

1. **Start the Backend Server:**
   ```bash
   npm run server
   # or
   cd server && node server.js
   ```

2. **Start the Frontend (in a new terminal):**
   ```bash
   npm start
   ```

### Option 2: Run Both Concurrently (if configured)

```bash
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## 👥 Default User Accounts

After setting up the database, you can create user accounts through the registration page or use these default credentials (if seeded):

- **Admin:** admin@brewops.com / admin123
- **Manager:** manager@brewops.com / manager123
- **Staff:** staff@brewops.com / staff123
- **Supplier:** supplier@brewops.com / supplier123

## 📁 Project Structure

```
BrewOps-next/
├── public/                 # Static files
├── src/
│   ├── components/         # Reusable components
│   │   ├── InventoryReports.jsx
│   │   ├── InventoryReports.css
│   │   ├── Messages.jsx
│   │   ├── navigationBar.jsx
│   │   ├── sidebar.jsx
│   │   └── ...
│   ├── pages/             # Page components
│   │   ├── AdminDashboard.jsx
│   │   ├── StaffDashboard.jsx
│   │   ├── SupplierDashboard.jsx
│   │   ├── login.jsx
│   │   └── ...
│   ├── styles/            # CSS files
│   ├── utils/             # Utility functions
│   └── assets/            # Images, animations
├── server/                # Backend code
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── database.js        # Database configuration
│   └── server.js          # Main server file
├── package.json
├── .env                   # Environment variables
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Inventory
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Add inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

## 🎨 Features Overview

### Dashboard Analytics
- Real-time inventory metrics
- Interactive charts for data visualization
- Tea type performance analysis
- Monthly trend tracking
- Export capabilities (PDF/Excel)

### Role-Based Access Control
- **Admin:** Full system access, user management
- **Manager:** Inventory oversight, analytics, reporting
- **Staff:** Order processing, inventory updates
- **Supplier:** Supply management, order fulfillment

### Modern UI/UX
- Responsive design for all devices
- Modern gradient-based color scheme
- Smooth animations and transitions
- Intuitive navigation and user experience

## 🔧 Development

### Available Scripts

- `npm start` - Start the React development server
- `npm run build` - Build the app for production
- `npm test` - Run tests
- `npm run server` - Start the backend server
- `npm run dev` - Run both frontend and backend concurrently

### Code Style

The project follows standard React and Node.js conventions:
- ES6+ JavaScript
- Functional components with hooks
- Modular CSS with component-specific stylesheets
- RESTful API design

## 🚀 Deployment

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy the `build` folder to your hosting service (Netlify, Vercel, etc.)

### Backend Deployment
1. Deploy to a Node.js hosting service (Heroku, DigitalOcean, AWS, etc.)
2. Set up environment variables on the hosting platform
3. Configure the database connection for production

### Environment Configuration
Make sure to update the `REACT_APP_BACKEND_URL` in your production environment to point to your deployed backend URL.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions, please contact:
- Email: support@brewops.com
- GitHub Issues: [Create an issue](https://github.com/thennakoontakk/BrewOps-next/issues)

## 🙏 Acknowledgments

- React.js community for excellent documentation
- Chart.js for powerful data visualization
- Lucide React for beautiful icons
- All contributors who helped build this project

---

**BrewOps** - Streamlining tea inventory management with modern technology.
