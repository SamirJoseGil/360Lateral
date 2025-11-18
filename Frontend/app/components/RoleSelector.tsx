import React from "react";

interface RoleSelectorProps {
    selectedRole: string;
    onChange: (role: string) => void;
}

const roles = [
    {
        value: "owner",
        label: "Propietario / Comisionista",
        description: "Registro y gestión de lotes, solicitudes de análisis urbanístico",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        color: "green"
    },
    {
        value: "developer",
        label: "Desarrollador",
        description: "Búsqueda de lotes, análisis de oportunidades de inversión",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
        color: "blue"
    }
];

export default function RoleSelector({ selectedRole, onChange }: RoleSelectorProps) {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de cuenta <span className="text-red-500">*</span>
            </label>
            {roles.map((role) => (
                <div
                    key={role.value}
                    className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${selectedRole === role.value
                            ? 'border-lateral-500 bg-lateral-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                    onClick={() => onChange(role.value)}
                >
                    <div className="flex items-start">
                        <input
                            type="radio"
                            value={role.value}
                            checked={selectedRole === role.value}
                            onChange={(e) => onChange(e.target.value)}
                            className="mt-1 h-4 w-4 text-lateral-600 focus:ring-lateral-500 border-gray-300"
                        />
                        <div className="ml-3 flex-1">
                            <div className="flex items-center">
                                <div className={`w-8 h-8 bg-${role.color}-100 rounded-lg flex items-center justify-center mr-3 text-${role.color}-600`}>
                                    {role.icon}
                                </div>
                                <span className="block text-sm font-medium text-gray-900">{role.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
