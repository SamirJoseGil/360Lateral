import React from "react";

interface RoleSelectorProps {
    selectedRole: string;
    onChange: (role: string) => void;
}

export default function RoleSelector({ selectedRole, onChange }: RoleSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Propietario */}
            <label
                className={`relative flex flex-col items-center p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedRole === "owner"
                        ? "border-lateral-600 bg-lateral-50 shadow-lg ring-2 ring-lateral-200"
                        : "border-gray-300 hover:border-lateral-400 hover:shadow-md"
                }`}
            >
                <input
                    type="radio"
                    name="role_selector"
                    value="owner"
                    checked={selectedRole === "owner"}
                    onChange={(e) => onChange(e.target.value)}
                    className="sr-only"
                />
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                        selectedRole === "owner"
                            ? "bg-lateral-600 text-white"
                            : "bg-gray-200 text-gray-600"
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">Propietario</h3>
                <p className="text-sm text-gray-600 text-center">
                    Gestiona y valida tus lotes urbanos
                </p>
                {selectedRole === "owner" && (
                    <div className="absolute top-3 right-3">
                        <svg className="w-5 h-5 text-lateral-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </label>

            {/* Desarrollador */}
            <label
                className={`relative flex flex-col items-center p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedRole === "developer"
                        ? "border-lateral-600 bg-lateral-50 shadow-lg ring-2 ring-lateral-200"
                        : "border-gray-300 hover:border-lateral-400 hover:shadow-md"
                }`}
            >
                <input
                    type="radio"
                    name="role_selector"
                    value="developer"
                    checked={selectedRole === "developer"}
                    onChange={(e) => onChange(e.target.value)}
                    className="sr-only"
                />
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                        selectedRole === "developer"
                            ? "bg-lateral-600 text-white"
                            : "bg-gray-200 text-gray-600"
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">Desarrollador</h3>
                <p className="text-sm text-gray-600 text-center">
                    Busca oportunidades de inversión
                </p>
                {selectedRole === "developer" && (
                    <div className="absolute top-3 right-3">
                        <svg className="w-5 h-5 text-lateral-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </label>
        </div>
    );
}
