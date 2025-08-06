import { Link } from "@remix-run/react";
import Navbar from "~/components/Navbar";

export default function Equipo() {
  const teamMembers = [
    {
      id: 1,
      name: "María González",
      position: "CEO & Fundadora",
      bio: "Experta en tecnología inmobiliaria con más de 15 años de experiencia en desarrollo de software y gestión de propiedades.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      linkedin: "#",
      email: "maria@360lateral.com"
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      position: "CTO",
      bio: "Ingeniero de software especializado en arquitecturas escalables y sistemas distribuidos para el sector inmobiliario.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      linkedin: "#",
      email: "carlos@360lateral.com"
    },
    {
      id: 3,
      name: "Ana Martínez",
      position: "Directora de Producto",
      bio: "Especialista en UX/UI con amplia experiencia en el diseño de interfaces para aplicaciones empresariales complejas.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      linkedin: "#",
      email: "ana@360lateral.com"
    },
    {
      id: 4,
      name: "Luis Herrera",
      position: "Director Comercial",
      bio: "Experto en ventas B2B y desarrollo de negocios en el sector inmobiliario con un enfoque en soluciones tecnológicas.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      linkedin: "#",
      email: "luis@360lateral.com"
    },
    {
      id: 5,
      name: "Patricia López",
      position: "Jefa de Desarrollo",
      bio: "Desarrolladora full-stack con especialización en React, Node.js y arquitecturas cloud para aplicaciones empresariales.",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      linkedin: "#",
      email: "patricia@360lateral.com"
    },
    {
      id: 6,
      name: "Roberto Silva",
      position: "Especialista Legal",
      bio: "Abogado especializado en derecho inmobiliario y compliance, con experiencia en digitalizaciónde procesos legales.",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      linkedin: "#",
      email: "roberto@360lateral.com"
    }
  ];

  const departments = [
    {
      name: "Desarrollo",
      count: 12,
      color: "bg-blue-100 text-blue-800"
    },
    {
      name: "Producto",
      count: 8,
      color: "bg-green-100 text-green-800"
    },
    {
      name: "Comercial",
      count: 6,
      color: "bg-orange-100 text-orange-800"
    },
    {
      name: "Legal",
      count: 4,
      color: "bg-purple-100 text-purple-800"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar currentPath="/equipo" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Nuestro <span className="text-orange-400">Equipo</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Conoce a los profesionales que hacen posible la innovación en gestión inmobiliaria
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {departments.map((dept) => (
            <div key={dept.name} className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${dept.color} mb-3`}>
                {dept.name}
              </div>
              <div className="text-3xl font-bold text-gray-900">{dept.count}</div>
              <div className="text-gray-600 text-sm">profesionales</div>
            </div>
          ))}
        </div>

        {/* Leadership Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Equipo Directivo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-w-1 aspect-h-1">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{member.position}</p>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{member.bio}</p>
                  
                  <div className="flex items-center space-x-3">
                    <a
                      href={member.linkedin}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      aria-label={`LinkedIn de ${member.name}`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a
                      href={`mailto:${member.email}`}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                      aria-label={`Email de ${member.name}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Join Us Section */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl text-white p-12 text-center">
          <h2 className="text-3xl font-bold mb-6">¿Quieres ser parte del equipo?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Estamos siempre en búsqueda de talento excepcional que comparta nuestra pasión 
            por la innovación y la excelencia en el sector inmobiliario.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
              Ver Vacantes
            </button>
            <button className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-900 transition-colors font-medium">
              Enviar CV
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}