import { Link } from "@remix-run/react";
import { useState } from "react";

interface NavbarProps {
  currentPath?: string;
}

export default function Navbar({ currentPath = "/" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Standard navigation links
  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Nosotros", href: "/nosotros" },
    { name: "Blog", href: "/blog" },
    { name: "Equipo", href: "/equipo" },
  ];

  const getLinkStyles = (href: string) => {
    const isActive = currentPath === href;
    return `px-3 py-2 rounded-lg font-medium transition-colors ${
      isActive 
        ? "text-white font-semibold bg-white/20" 
        : "text-blue-100 hover:text-white hover:bg-white/10"
    }`;
  };

  return (
    <nav className="bg-blue-900/80 backdrop-blur-sm border-b border-blue-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img 
              src="https://360lateral.com/wp-content/uploads/2024/10/8bcc33ac470ffa6c421628be38d51d0f.png" 
              className="h-10 w-auto max-w-80" 
              alt="360° LATERAL" 
              decoding="async"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={getLinkStyles(link.href)}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            <Link
              to="/ingresar"
              className="px-4 py-2 text-blue-100 hover:text-white font-medium transition-colors"
            >
              Ingresar
            </Link>
            <Link
              to="/registrarse"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Registrarse
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-blue-100 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-blue-700/50 bg-blue-900/95 backdrop-blur-sm">
            <div className="px-4 py-4 space-y-2">
              {/* Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPath === link.href
                      ? "text-white font-semibold bg-white/20"
                      : "text-blue-100 hover:text-white hover:bg-white/10"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {/* Auth Section */}
              <div className="pt-4 border-t border-blue-700/50 space-y-2">
                <Link
                  to="/ingresar"
                  className="block w-full text-center px-4 py-2 text-blue-100 border border-blue-300/50 hover:bg-white/10 rounded-lg font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ingresar
                </Link>
                <Link
                  to="/registrarse"
                  className="block w-full text-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}