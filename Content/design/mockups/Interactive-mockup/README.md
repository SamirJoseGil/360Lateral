# 🎨 Lateral 360° - Interactive Mockups

Interactive mockups built with Remix and Tailwind CSS to prototype the Lateral 360° platform.

> **🚀 Live Demo:** [https://lateral360-mockup.vercel.app](https://lateral360-mockup.vercel.app) *(Update with your Vercel URL)*

## 📋 Table of Contents

- [🚀 Getting Started](#-getting-started)
- [📱 Available Views](#-available-views)
- [🎨 Design System](#-design-system)
- [📂 Project Structure](#-project-structure)
- [🛠 Development](#-development)
- [🚀 Deployment](#-deployment)
- [🔗 Related Repositories](#-related-repositories)

## 🚀 Getting Started

### Local Development

```bash
# Clone this repository
git clone https://github.com/SamirJoseGil/360Lateral-Mockup.git
cd 360Lateral-Mockup

# Install dependencies
npm install

# Start development server
npm run dev
```

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamirJoseGil/360Lateral-Mockup)

## 📱 Available Views

### 🏠 **Public Pages**
- **`/`** - Landing page with hero section and navigation
- **`/nosotros`** - About us page with company information
- **`/blog`** - Blog page with articles and insights
- **`/equipo`** - Team page with member profiles
- **`/ingresar`** - Login page for user authentication
- **`/registrarse`** - Registration page for new users

### 🏢 **Dashboard Pages** *(Authenticated)*
- **`/dashboard`** - Main dashboard with overview
- **`/lotes`** - Lots management and listing
- **`/crear-lote`** - Create new lot form
- **`/documentos`** - Document management system
- **`/documentos/:loteId`** - Lot-specific documents
- **`/subir-documentos/:loteId`** - Upload documents interface

### 🎯 **User Flows**
1. **Landing → Registration → Dashboard**
2. **Login → Dashboard → Lot Management**
3. **Create Lot → Upload Documents → Manage**
4. **Browse Lots → View Details → Documents**

## 🎨 Design System

### 🎨 **Brand Colors**
```css
/* Primary Colors */
--blue-900: #1e3a8a;     /* Primary Dark */
--blue-800: #1e40af;     /* Primary */
--blue-600: #2563eb;     /* Primary Light */

/* Accent Colors */
--orange-400: #fb923c;    /* Accent Light */
--orange-500: #f97316;    /* Accent */
--orange-600: #ea580c;    /* Accent Dark */

/* Neutral Colors */
--gray-50: #f9fafb;      /* Background */
--gray-600: #4b5563;     /* Text Secondary */
--gray-900: #111827;     /* Text Primary */
```

### 🔤 **Typography**
- **Font Family:** Inter (Google Fonts)
- **Headings:** font-bold, text-2xl to text-6xl
- **Body:** font-medium, text-sm to text-lg
- **Captions:** font-normal, text-xs to text-sm

### 🧩 **Components**
- **Buttons:** Rounded-lg, hover states, color variants
- **Cards:** Shadow-md, border-gray-200, hover effects
- **Forms:** Focus states, validation styles
- **Navigation:** Sticky navbar, responsive menu

## 📂 Project Structure

```
src
├── app
│   ├── components        # Shared components (Button, Card, etc.)
│   ├── routes            # Route files for pages
│   ├── styles            # Global styles and tailwind config
│   └── utils             # Utility functions and types
├── public                # Public assets (images, fonts, etc.)
└── package.json          # Project metadata and dependencies
```

## 🛠 Development

### Prerequisites
- Node.js >= 14.x
- npm >= 5.6

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server