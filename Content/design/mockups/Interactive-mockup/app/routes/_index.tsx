import { Link } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";
import Navbar from "~/components/Navbar";

export const meta: MetaFunction = () => {
  return [
    { title: "360° LATERAL - Gestión Inmobiliaria Digital" },
    { name: "description", content: "Plataforma líder en gestión integral de propiedades inmobiliarias" },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 relative overflow-hidden">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;)] repeat"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/10 backdrop-blur-sm">
        <Navbar currentPath="/" />
      </div>

      {/* Main Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 text-center">
        {/* City skyline with network overlay effect */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Network lines effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Animated connection lines */}
            <g className="animate-pulse">
              <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" />
              <line x1="20%" y1="60%" x2="80%" y2="30%" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="1" />
              <line x1="30%" y1="10%" x2="70%" y2="90%" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1" />
            </g>
          </svg>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
            Somos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Resultores
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Conectamos innovación y resultados para transformar tu visión en realidad
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Link
              to="/ingresar"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200"
            >
              Ingresar
            </Link>
            
            <Link
              to="/registrarse"
              className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-orange-500 text-orange-400 font-semibold rounded-lg hover:bg-orange-500 hover:text-white transform hover:scale-105 transition-all duration-200"
            >
              Registrarse
            </Link>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-2 h-2 bg-white rounded-full animate-bounce"></div>
        <div className="absolute bottom-60 right-10 w-5 h-5 bg-blue-300 rounded-full animate-pulse delay-300"></div>
      </main>
    </div>
  );
}