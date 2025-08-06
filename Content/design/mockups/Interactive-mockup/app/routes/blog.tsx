import { Link } from "@remix-run/react";
import Navbar from "~/components/Navbar";

export default function Blog() {
  const blogPosts = [
    {
      id: 1,
      title: "El Futuro de la Gestión Inmobiliaria Digital",
      excerpt: "Descubre cómo la tecnología está transformando la manera en que gestionamos propiedades y lotes en el siglo XXI.",
      author: "María González",
      date: "2024-03-15",
      category: "Tecnología",
      readTime: "5 min",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "Optimización de Documentos Legales en Bienes Raíces",
      excerpt: "Aprende las mejores prácticas para organizar y gestionar los documentos legales de tus propiedades de manera eficiente.",
      author: "Carlos Rodríguez",
      date: "2024-03-10",
      category: "Legal",
      readTime: "7 min",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      title: "Tendencias del Mercado Inmobiliario 2024",
      excerpt: "Un análisis completo de las tendencias que marcarán el mercado inmobiliario este año y su impacto en los desarrolladores.",
      author: "Ana Martínez",
      date: "2024-03-05",
      category: "Mercado",
      readTime: "6 min",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 4,
      title: "Automatización de Procesos en Real Estate",
      excerpt: "Cómo implementar sistemas automatizados para reducir tiempos y errores en la gestión de propiedades.",
      author: "Luis Herrera",
      date: "2024-02-28",
      category: "Automatización",
      readTime: "8 min",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 5,
      title: "Seguridad Digital en Transacciones Inmobiliarias",
      excerpt: "Protege tus datos y transacciones con las últimas tecnologías de seguridad digital en el sector inmobiliario.",
      author: "Patricia López",
      date: "2024-02-20",
      category: "Seguridad",
      readTime: "5 min",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 6,
      title: "Gestión Sostenible de Desarrollos Urbanos",
      excerpt: "Explora cómo integrar prácticas sostenibles en el desarrollo urbano y la gestión de propiedades.",
      author: "Roberto Silva",
      date: "2024-02-15",
      category: "Sostenibilidad",
      readTime: "9 min",
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
  ];

  const categories = ["Todas", "Tecnología", "Legal", "Mercado", "Automatización", "Seguridad", "Sostenibilidad"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar currentPath="/blog" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Blog de <span className="text-orange-400">Insights</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Descubre las últimas tendencias, tecnologías y mejores prácticas en gestión inmobiliaria
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === "Todas"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                } border border-gray-200`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
          <div className="md:flex">
            <div className="md:w-1/2">
              <img
                src={blogPosts[0].image}
                alt={blogPosts[0].title}
                className="w-full h-64 md:h-full object-cover"
              />
            </div>
            <div className="md:w-1/2 p-8">
              <div className="flex items-center mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Destacado
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ml-2">
                  {blogPosts[0].category}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{blogPosts[0].title}</h2>
              <p className="text-gray-600 mb-6">{blogPosts[0].excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <span>Por {blogPosts[0].author}</span>
                  <span className="mx-2">•</span>
                  <span>{blogPosts[0].date}</span>
                  <span className="mx-2">•</span>
                  <span>{blogPosts[0].readTime} lectura</span>
                </div>
                <button className="text-blue-600 hover:text-blue-800 font-medium">
                  Leer más →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.slice(1).map((post) => (
            <article key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <span>{post.author}</span>
                    <span className="mx-2">•</span>
                    <span>{post.date}</span>
                  </div>
                  <span>{post.readTime}</span>
                </div>
                <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm">
                  Leer artículo →
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Cargar más artículos
          </button>
        </div>
      </main>
    </div>
  );
}