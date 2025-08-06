# 360 Lateral - Interactive Mockups

Interactive mockups built with Remix and Tailwind CSS to prototype the 360 Lateral platform.

## 🚀 Getting Started

Navigate to the interactive mockup directory:

```sh
cd Interactive-mockup
```

Install dependencies:

```sh
npm install
```

Run the development server:

```sh
npm run dev
```

## 📱 Available Views

- **Index** (`/`) - Main landing page with hero section
- **Login** (`/ingresar`) - User authentication page  
- **Register** (`/registrarse`) - User registration page

## 🎨 Design System

The mockup follows the 360 Lateral brand guidelines:

- **Primary Colors**: Blue gradient (`from-blue-900 to-blue-600`)
- **Accent Color**: Orange (`orange-500/600`)
- **Typography**: Inter font family
- **Components**: Built with Tailwind CSS utilities

## 📂 Project Structure

```
Interactive-mockup/
├── app/
│   ├── routes/
│   │   ├── _index.tsx     # Main landing page
│   │   ├── ingresar.tsx   # Login page
│   │   └── registrarse.tsx # Registration page
│   ├── root.tsx           # App root with layout
│   └── tailwind.css       # Tailwind imports
├── package.json
└── README.md
```

## 🛠 Development

The mockup is built with:
- [Remix](https://remix.run/docs) - Full-stack web framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## 🚀 Deployment

Build for production:

```sh
npm run build
```

Start production server:

```sh
npm start
```
