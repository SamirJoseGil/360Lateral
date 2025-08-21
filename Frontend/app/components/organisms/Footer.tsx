export default function Footer() {
    return (
        <>
            {/* Footer */}
            <footer className="bg-white/80 backdrop-blur-md border-t border-blue-100">
                <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:py-14 lg:px-8">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="space-y-6 xl:col-span-1">
                            <span className="text-2xl font-bold text-blue-700">Lateral 360°</span>
                            <p className="text-gray-500 text-base">
                                Transformamos la gestión inmobiliaria con tecnología innovadora.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 xl:col-span-2">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                                    Producto
                                </h3>
                                <ul className="mt-4 space-y-4">
                                    <li>
                                        <a
                                            href="#"
                                            className="text-base text-gray-500 hover:text-blue-700 transition"
                                        >
                                            Características
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-base text-gray-500 hover:text-blue-700 transition"
                                        >
                                            Precios
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                                    Soporte
                                </h3>
                                <ul className="mt-4 space-y-4">
                                    <li>
                                        <a
                                            href="#"
                                            className="text-base text-gray-500 hover:text-blue-700 transition"
                                        >
                                            Términos
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-base text-gray-500 hover:text-blue-700 transition"
                                        >
                                            Contacto
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}