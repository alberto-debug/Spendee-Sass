# Spendee SaaS

A modern personal finance management application built with Spring Boot 3.5.5. Track your expenses, manage budgets, and gain insights into your financial habits with automated M-Pesa statement parsing.

## 🌟 Features

### Core Functionality
- **Transaction Management**: Create, read, update, and delete financial transactions
- **Category System**: Organize transactions with customizable categories
- **Dashboard Analytics**: Visualize your financial data with interactive charts
- **Financial Reports**: Generate detailed reports with date range filtering
- **PDF Export**: Download professional financial reports in PDF format

### Authentication & Security
- **Email/Password Authentication**: Secure user registration and login
- **OAuth2 Integration**: Sign in with Google
- **JWT Token-Based Security**: Stateless authentication with Spring Security
- **Role-Based Access Control**: Admin and user roles

### M-Pesa Integration
- **Automated Statement Parsing**: Upload M-Pesa PDF statements
- **Transaction Extraction**: Automatically extract transactions from statements
- **Duplicate Detection**: Smart duplicate transaction prevention
- **Bulk Import**: Process multiple transactions at once

### User Experience
- **Responsive Design**: Modern UI that works on desktop and mobile
- **Dark Theme**: Eye-friendly dark mode styling
- **Toast Notifications**: Real-time feedback for user actions
- **Currency Support**: Multiple currency symbols (USD, EUR, GBP, JPY, KES)
- **Date Formatting**: Customizable date format preferences
- **Profile Management**: Upload profile photos and manage settings

## 🛠️ Technology Stack

### Backend
- **Framework**: Spring Boot 3.5.5
- **Language**: Java 24
- **Security**: Spring Security + OAuth2 + JWT
- **Database**: MySQL 8
- **ORM**: Spring Data JPA / Hibernate
- **Migration**: Flyway
- **PDF Processing**: Apache PDFBox, iText
- **Build Tool**: Maven

### Frontend
- **Template Engine**: Thymeleaf
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Styling**: Custom CSS with modern design patterns

### Additional Tools
- **API Documentation**: Swagger/OpenAPI
- **Development**: Spring Boot DevTools with LiveReload
- **Logging**: SLF4J with Logback
- **Validation**: Bean Validation
- **Utilities**: Lombok

## 📋 Prerequisites

- **Java 24** or higher
- **Maven 3.6+**
- **MySQL 8.0+**
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/alberto-debug/Spendee-Sass.git
cd Spendee-Sass
```

### 2. Database Setup
Create a MySQL database:
```sql
CREATE DATABASE spendee_db;
```

### 3. Configure Environment Variables
Set the following environment variables or update `application.properties`:

```bash
export DATABASE_HOST=localhost
export DATABASE_PORT=3306
export DATABASE_NAME=spendee_db
export DATABASE_USER=root
export DATABASE_PASSWORD=your_password
```

Alternatively, edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/spendee_db
spring.datasource.username=root
spring.datasource.password=your_password
```

### 4. Build the Project
```bash
./mvnw clean install
```

### 5. Run the Application
```bash
./mvnw spring-boot:run
```

The application will start on `http://localhost:8080`

## 📖 API Documentation

Once the application is running, access the Swagger UI at:
```
http://localhost:8080/swagger-ui.html
```

## 🏗️ Project Structure

```
src/
├── main/
│   ├── java/com/alberto/Spendee/sass/
│   │   ├── Application.java                 # Main application class
│   │   ├── config/                          # Configuration classes
│   │   │   ├── SecurityConfig.java          # Security configuration
│   │   │   └── ViewConfig.java              # Template attributes config
│   │   ├── controller/                      # REST & View controllers
│   │   │   ├── AuthController.java          # Authentication endpoints
│   │   │   ├── TransactionController.java   # Transaction CRUD
│   │   │   ├── CategoryController.java      # Category management
│   │   │   ├── DashboardController.java     # Dashboard data
│   │   │   ├── ReportController.java        # Financial reports
│   │   │   ├── MpesaStatementController.java # M-Pesa parsing
│   │   │   └── SettingsController.java      # User settings
│   │   ├── domain/                          # Entity models
│   │   │   ├── user/                        # User entities
│   │   │   └── transaction/                 # Transaction entities
│   │   ├── dto/                             # Data Transfer Objects
│   │   ├── repository/                      # JPA repositories
│   │   ├── service/                         # Business logic
│   │   │   ├── MpesaStatementParserService.java
│   │   │   └── PdfReportService.java
│   │   └── infra/                           # Infrastructure/utilities
│   └── resources/
│       ├── application.properties           # App configuration
│       ├── static/                          # Static assets (CSS, JS)
│       │   ├── css/
│       │   └── js/
│       └── templates/                       # Thymeleaf templates
│           ├── auth/                        # Authentication pages
│           ├── dashboard/                   # Dashboard views
│           └── layout/                      # Layout templates
└── test/                                    # Test classes
```

## 🔑 Key Features Explained

### Transaction Management
Manage your income and expenses with detailed categorization:
- Add manual transactions with amount, date, category, and description
- Edit or delete existing transactions
- Filter transactions by date range, category, or type
- View transaction history with pagination

### Dashboard Analytics
Get a complete overview of your finances:
- Total income, expenses, and balance calculations
- Monthly and yearly summaries
- Income vs expense comparison charts
- Trend indicators with percentage changes
- Recent transactions widget
- Category breakdown visualization

### M-Pesa Statement Import
Automatically import transactions from M-Pesa statements:
1. Download your M-Pesa statement PDF from Safaricom app
2. Upload the PDF through the dashboard
3. System automatically extracts all transactions
4. Transactions are categorized and saved
5. Duplicates are automatically detected and skipped

### Financial Reports
Generate comprehensive financial reports:
- Filter by custom date ranges
- Category breakdown analysis
- Income vs expense comparisons
- Time series visualizations
- Export to professional PDF format

### User Settings
Customize your experience:
- Change password
- Update profile information
- Upload profile photo
- Set preferred currency (USD, EUR, GBP, JPY, KES)
- Configure date format preferences

## 🔒 Security Features

- **Password Encryption**: BCrypt password hashing
- **JWT Authentication**: Stateless token-based authentication
- **OAuth2 Support**: Google OAuth2 integration
- **CSRF Protection**: Cross-Site Request Forgery protection
- **SQL Injection Prevention**: Parameterized queries with JPA
- **XSS Protection**: Template engine auto-escaping
- **Session Management**: Secure session handling

## 🧪 Testing

Run tests with:
```bash
./mvnw test
```

## 📱 Screenshots

### Dashboard
Modern dashboard with financial overview and interactive charts

### Transactions
Easy-to-use transaction management interface

### Reports
Comprehensive financial reports with visualization

### M-Pesa Import
One-click M-Pesa statement import feature

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Alberto Junior**
- GitHub: [@alberto-debug](https://github.com/alberto-debug)

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- Safaricom for M-Pesa services
- All contributors and users of this project

## 📞 Support

For support, email support@spendee.com or open an issue in the GitHub repository.

---

**Built with ❤️ using Spring Boot**

