import React from "react";

interface FormInputProps {
    id: string;
    name: string;
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    required?: boolean;
    placeholder?: string;
    autoComplete?: string;
    icon?: React.ReactNode;
}

export default function FormInput({
    id,
    name,
    label,
    type = "text",
    value,
    onChange,
    error,
    required = false,
    placeholder,
    autoComplete,
    icon
}: FormInputProps) {
    return (
        <div className="space-y-1">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    id={id}
                    name={name}
                    type={type}
                    required={required}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    className={`w-full ${icon ? 'pl-10' : ''} px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lateral-500 focus:border-lateral-500 transition-colors duration-200 ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}
