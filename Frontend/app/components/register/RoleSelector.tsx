interface RoleSelectorProps {
    selectedRole: string;
    onChange: (role: string) => void;
}

export function RoleSelector({ selectedRole, onChange }: RoleSelectorProps) {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tipo de Cuenta</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Selecciona el tipo de cuenta que mejor se adapte a tus necesidades
                </p>
            </div>

            <div className="space-y-3">
                {/* Owner */}
                <div
                    className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${
                        selectedRole === "owner"
                            ? 'border-lateral-500 bg-lateral-50'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => onChange("owner")}
                >
                    <div className="flex items-start">
                        <input
                            id="role-owner"
                            type="radio"
                            value="owner"
                            checked={selectedRole === "owner"}
                            onChange={(e) => onChange(e.target.value)}
                            className="mt-1 h-4 w-4 text-lateral-600 focus:ring-lateral-500 border-gray-300"
                        />
                        <div className="ml-3 flex-1">
                            <label htmlFor="role-owner" className="block text-sm font-medium text-gray-900 cursor-pointer">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    Propietario / Comisionista
                                </div>
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                                Registro y gestión de lotes, solicitudes de análisis urbanístico
                            </p>
                        </div>
                    </div>
                </div>

                {/* Developer */}
                <div
                    className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${
                        selectedRole === "developer"
                            ? 'border-lateral-500 bg-lateral-50'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => onChange("developer")}
                >
                    <div className="flex items-start">
                        <input
                            id="role-developer"
                            type="radio"
                            value="developer"
                            checked={selectedRole === "developer"}
                            onChange={(e) => onChange(e.target.value)}
                            className="mt-1 h-4 w-4 text-lateral-600 focus:ring-lateral-500 border-gray-300"
                        />
                        <div className="ml-3 flex-1">
                            <label htmlFor="role-developer" className="block text-sm font-medium text-gray-900 cursor-pointer">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    Desarrollador
                                </div>
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                                Búsqueda de lotes, análisis de oportunidades de inversión
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
