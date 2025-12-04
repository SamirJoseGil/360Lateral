import { Form, useActionData, Link, useNavigation } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useState, useEffect } from "react";
import { getUser, commitAuthCookies } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

// Componentes reutilizables
import FormInput from "~/components/FormInput";
import PasswordInput from "~/components/PasswordInput";
import RoleSelector from "~/components/RoleSelector";

// Función helper para obtener la ruta del dashboard según el rol
function getDashboardRoute(role: string): string {
    switch (role) {
        case "admin":
            return "/admin";
        case "owner":
            return "/owner";
        case "developer":
            return "/developer";
        default:
            return "/";
    }
}

// Loader para redirigir si ya está autenticado
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);

    // Si el usuario ya está autenticado, redirigir según su rol
    if (user) {
        const dashboardRoute = getDashboardRoute(user.role);
        return redirect(dashboardRoute);
    }

    return json({});
}

// Acción de registro CORREGIDA para usar sesión del servidor
export async function action({ request }: ActionFunctionArgs) {
    console.log("=== REGISTER ACTION START ===");
    const formData = await request.formData();

    // ✅ CRÍTICO: Log de TODOS los campos recibidos
    console.log("📋 Form data keys:", Array.from(formData.keys()));
    console.log("📋 Form data values:", Object.fromEntries(formData.entries()));

    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const username = (formData.get("username") as string)?.trim() || "";
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;
    const first_name = (formData.get("first_name") as string)?.trim();
    const last_name = (formData.get("last_name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const role = (formData.get("role") as string)?.trim();
    
    // ✅ CRÍTICO: Obtener campos de desarrollador DIRECTAMENTE del formData
    const developer_type = formData.get("developer_type") as string;
    const person_type = formData.get("person_type") as string;
    const legal_name = formData.get("legal_name") as string;
    const document_type = formData.get("document_type") as string;
    const document_number = formData.get("document_number") as string;

    // ✅ CRÍTICO: Log detallado de campos de desarrollador
    console.log("👨‍💻 Developer fields received:");
    console.log("  - developer_type:", developer_type);
    console.log("  - person_type:", person_type);
    console.log("  - legal_name:", legal_name);
    console.log("  - document_type:", document_type);
    console.log("  - document_number:", document_number);

    // Validaciones del lado del cliente
    const errors: Record<string, string> = {};

    // ✅ NUEVO: Validar que el rol no sea admin
    if (role === 'admin') {
        console.log("❌ Attempt to register as admin blocked");
        return json({
            success: false,
            errors: { 
                role: 'No puedes registrarte como administrador. Contacta a un superusuario.' 
            },
            values: { email, username, first_name, last_name, phone, role }
        }, { status: 400 });
    }

    if (!email) {
        errors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "El formato del email es inválido";
    }

    if (!first_name) errors.first_name = "El nombre es obligatorio";
    if (!last_name) errors.last_name = "El apellido es obligatorio";
    if (!password) errors.password = "La contraseña es obligatoria";
    if (!role) {
        errors.role = "El rol es obligatorio";
    } else if (!['owner', 'developer'].includes(role)) {
        errors.role = "Rol inválido. Solo puedes registrarte como Propietario o Desarrollador";
    }
    if (!phone) {
        errors.phone = "El teléfono es obligatorio";
    } else if (!/^[+]?[\d\s\-\(\)]{10,}$/.test(phone)) {
        errors.phone = "El formato del teléfono es inválido";
    }

    if (password !== passwordConfirm) {
        errors.passwordConfirm = "Las contraseñas no coinciden";
    }

    if (password && password.length < 8) {
        errors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    // ✅ NUEVO: Validar campos de desarrollador si el rol es developer
    if (role === 'developer') {
        if (!developer_type) {
            errors.developer_type = "El tipo de desarrollador es obligatorio";
        }
        if (!person_type) {
            errors.person_type = "El tipo de persona es obligatorio";
        }
        if (person_type === 'juridica' && !legal_name) {
            errors.legal_name = "El nombre de la empresa es obligatorio";
        }
        if (!document_type) {
            errors.document_type = "El tipo de documento es obligatorio";
        }
        if (!document_number) {
            errors.document_number = "El número de documento es obligatorio";
        } else if (!/^\d+$/.test(document_number)) {
            errors.document_number = "El documento debe contener solo números";
        }
        
        // Validar documento según tipo de persona
        if (person_type === 'juridica' && document_type !== 'NIT') {
            errors.document_type = "Personas jurídicas deben usar NIT";
        }
        if (person_type === 'natural' && document_type === 'NIT') {
            errors.document_type = "Personas naturales no pueden usar NIT";
        }
    }

    if (Object.keys(errors).length > 0) {
        console.log("❌ Validation errors:", errors);
        return json({
            success: false,
            errors,
            values: { 
                email, username, first_name, last_name, phone, role,
                developer_type, person_type, legal_name, document_type, document_number
            }
        }, { status: 400 });
    }

    try {
        // ✅ CORREGIDO: Preparar payload
        const registerPayload: any = {
            email,
            password,
            password_confirm: passwordConfirm,
            first_name,
            last_name,
            phone,
            role,
        };
        
        if (username) {
            registerPayload.username = username;
        }
        
        // ✅ CRÍTICO: Agregar campos de desarrollador SOLO si existen Y no están vacíos
        if (role === 'developer') {
            if (developer_type && developer_type !== '') {
                registerPayload.developer_type = developer_type;
                console.log("✅ Added developer_type to payload:", developer_type);
            } else {
                console.error("❌ developer_type is missing or empty!");
            }
            
            if (person_type && person_type !== '') {
                registerPayload.person_type = person_type;
                console.log("✅ Added person_type to payload:", person_type);
            } else {
                console.error("❌ person_type is missing or empty!");
            }
            
            if (person_type === 'juridica' && legal_name && legal_name !== '') {
                registerPayload.legal_name = legal_name;
                console.log("✅ Added legal_name to payload:", legal_name);
            }
            
            if (document_type && document_type !== '') {
                registerPayload.document_type = document_type;
                console.log("✅ Added document_type to payload:", document_type);
            } else {
                console.error("❌ document_type is missing or empty!");
            }
            
            if (document_number && document_number !== '') {
                registerPayload.document_number = document_number;
                console.log("✅ Added document_number to payload:", document_number);
            } else {
                console.error("❌ document_number is missing or empty!");
            }
        }

        console.log("📤 Final payload:", JSON.stringify(registerPayload, null, 2));

        const registerResponse = await fetch(`${API_URL}/api/auth/register/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(registerPayload),
        });

        console.log(`📥 API response status: ${registerResponse.status}`);

        const responseText = await registerResponse.text();
        console.log("📥 API raw response:", responseText);

        let registerData;
        try {
            registerData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.error("❌ JSON parse error:", parseError);
            return json({
                success: false,
                errors: { general: "Error en la respuesta del servidor" },
                values: { email, username, first_name, last_name, phone, role, developer_type, person_type }
            }, { status: 500 });
        }

        if (!registerResponse.ok) {
            console.error("❌ Registration failed:", registerData);

            const backendErrors: Record<string, string> = {};

            // Procesar errores del backend
            if (registerData.errors) {
                Object.keys(registerData.errors).forEach(field => {
                    const fieldError = registerData.errors[field];
                    backendErrors[field] = Array.isArray(fieldError)
                        ? fieldError[0]
                        : fieldError;
                });
            }

            if (registerData.message && !backendErrors.general) {
                backendErrors.general = registerData.message;
            }

            if (Object.keys(backendErrors).length === 0) {
                backendErrors.general = "Error en el registro. Por favor, verifica los datos.";
            }

            return json({
                success: false,
                errors: backendErrors,
                values: { 
                    email, username, first_name, last_name, phone, role,
                    developer_type, person_type, legal_name, document_type, document_number
                }
            }, { status: registerResponse.status });
        }

        // Registro exitoso
        console.log("Registration successful");

        if (!registerData.success || !registerData.data) {
            console.error("Invalid response structure:", registerData);
            return json({
                success: false,
                errors: { general: "Respuesta inválida del servidor" },
                values: { email, username, first_name, last_name, phone, role, developer_type, person_type }
            }, { status: 500 });
        }

        const { refresh, access, user } = registerData.data;

        console.log(`Registration complete for: ${user.email} (role: ${user.role})`);

        // ✅ En registro, siempre recordar por 7 días
        const headers = await commitAuthCookies(
            { access, refresh },
            true // ✅ Siempre recordar en registro
        );

        const finalRedirectTo = getDashboardRoute(user.role);

        console.log(`Redirecting to: ${finalRedirectTo}`);
        console.log("=== REGISTER ACTION END (SUCCESS) ===");

        return redirect(finalRedirectTo, { headers });

    } catch (error) {
        console.error("❌ Registration error:", error);
        console.log("=== REGISTER ACTION END (ERROR) ===");

        let errorMessage = "Error de conexión al servidor";

        if (error instanceof TypeError && error.message.includes('fetch')) {
            errorMessage = "No se pudo conectar al servidor. Verifica tu conexión.";
        }

        return json({
            success: false,
            errors: { general: errorMessage },
            values: { 
                email, username, first_name, last_name, phone, role,
                developer_type, person_type, legal_name, document_type, document_number
            }
        }, { status: 500 });
    }
}

type RegisterActionData = {
    success?: boolean;
    errors?: Record<string, string>;
    values?: Record<string, string>;
};

export default function Register() {
    const actionData = useActionData<RegisterActionData>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [formData, setFormData] = useState({
        first_name: actionData?.values?.first_name || "",
        last_name: actionData?.values?.last_name || "",
        email: actionData?.values?.email || "",
        username: actionData?.values?.username || "",
        phone: actionData?.values?.phone || "",
        role: actionData?.values?.role || "owner",
        password: "",
        passwordConfirm: "",
        developer_type: actionData?.values?.developer_type || "",
        person_type: actionData?.values?.person_type || "",
        legal_name: actionData?.values?.legal_name || "",
        document_type: actionData?.values?.document_type || "",
        document_number: actionData?.values?.document_number || "",
    });

    // ✅ NUEVO: Estado para validaciones en tiempo real
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    // ✅ NUEVO: Validar campo individual actualizado
    const validateField = (field: string, value: string): string => {
        switch (field) {
            case 'first_name':
                if (!value.trim()) return 'El nombre es obligatorio';
                if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
                return '';

            case 'last_name':
                if (!value.trim()) return 'El apellido es obligatorio';
                if (value.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres';
                return '';

            case 'email':
                if (!value.trim()) return 'El email es obligatorio';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'El formato del email es inválido';
                return '';

            case 'phone':
                if (!value.trim()) return 'El teléfono es obligatorio';
                if (!/^[+]?[\d\s\-\(\)]{10,}$/.test(value)) return 'Ingresa un teléfono válido (mín. 10 dígitos)';
                return '';

            case 'password':
                if (!value) return 'La contraseña es obligatoria';
                if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
                if (!/[A-Z]/.test(value)) return 'Debe incluir al menos una mayúscula';
                if (!/[a-z]/.test(value)) return 'Debe incluir al menos una minúscula';
                if (!/[0-9]/.test(value)) return 'Debe incluir al menos un número';
                return '';

            case 'passwordConfirm':
                if (!value) return 'Confirma tu contraseña';
                if (value !== formData.password) return 'Las contraseñas no coinciden';
                return '';

            case 'developer_type':
                if (formData.role === 'developer' && !value) {
                    return 'El tipo de desarrollador es obligatorio';
                }
                return '';

            case 'person_type':
                if (formData.role === 'developer' && !value) {
                    return 'El tipo de persona es obligatorio';
                }
                return '';

            case 'legal_name':
                // ✅ Solo obligatorio para persona jurídica
                if (formData.role === 'developer' && formData.person_type === 'juridica' && !value.trim()) {
                    return 'El nombre de la empresa es obligatorio';
                }
                if (formData.role === 'developer' && formData.person_type === 'juridica' && value.trim().length < 3) {
                    return 'Debe tener al menos 3 caracteres';
                }
                return '';

            case 'document_type':
                if (formData.role === 'developer' && !value) {
                    return 'El tipo de documento es obligatorio';
                }
                // Validar documento según tipo de persona
                if (formData.role === 'developer' && formData.person_type === 'juridica' && value !== 'NIT') {
                    return 'Personas jurídicas deben usar NIT';
                }
                if (formData.role === 'developer' && formData.person_type === 'natural' && value === 'NIT') {
                    return 'Personas naturales no pueden usar NIT';
                }
                return '';

            case 'document_number':
                if (formData.role === 'developer' && !value) {
                    return 'El número de documento es obligatorio';
                }
                if (formData.role === 'developer' && !/^\d+$/.test(value)) {
                    return 'El documento debe contener solo números';
                }
                if (formData.role === 'developer' && value.length < 6) {
                    return 'El documento debe tener al menos 6 dígitos';
                }
                return '';

            default:
                return '';
        }
    };

    // ✅ CORREGIDO: Manejar cambio con validación Y limpieza de errores
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // ✅ CRÍTICO: Limpiar error del servidor cuando el usuario corrige el campo
        if (actionData?.errors?.[field]) {
            // Si hay un error del servidor, forzar revalidación
            const error = validateField(field, value);
            setClientErrors(prev => ({
                ...prev,
                [field]: error
            }));
            setTouched(prev => ({ ...prev, [field]: true }));
        } else if (touched[field]) {
            // Validar si el campo ya fue tocado
            const error = validateField(field, value);
            setClientErrors(prev => ({
                ...prev,
                [field]: error
            }));
        }
    };

    // ✅ NUEVO: Manejar blur (cuando el usuario sale del campo)
    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, formData[field as keyof typeof formData]);
        setClientErrors(prev => ({
            ...prev,
            [field]: error
        }));
    };

    // ✅ NUEVO: Obtener error (priorizar errores del servidor)
    const getError = (field: string): string | undefined => {
        return actionData?.errors?.[field] || clientErrors[field];
    };

    // ✅ NUEVO: Verificar si el formulario es válido
    const isFormValid = (): boolean => {
        const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'password', 'passwordConfirm'];

        for (const field of requiredFields) {
            const value = formData[field as keyof typeof formData];
            const error = validateField(field, value);
            if (error) return false;
        }

        return true;
    };

    // ✅ NUEVO: Calcular fortaleza de contraseña
    const getPasswordStrength = (password: string): { level: number; text: string; color: string } => {
        if (!password) return { level: 0, text: '', color: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) return { level: 1, text: 'Débil', color: 'bg-red-500' };
        if (strength <= 4) return { level: 2, text: 'Media', color: 'bg-yellow-500' };
        return { level: 3, text: 'Fuerte', color: 'bg-green-500' };
    };

    const emailIcon = (
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-lateral-600 via-lateral-500 to-naranja-500 flex items-center justify-center p-4">
            {/* Botón de regresar */}
            <Link
                to="/"
                className="absolute top-8 left-8 text-white hover:text-naranja-300 transition-colors duration-200 flex items-center gap-2 group"
            >
                <svg
                    className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Volver al inicio</span>
            </Link>

            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-4">
                        <span className="text-4xl font-display font-bold text-white">
                            360<span className="text-naranja-300">Lateral</span>
                        </span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Crear cuenta nueva</h1>
                    <p className="text-lateral-100">Únete a la plataforma de gestión urbanística</p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* ✅ NUEVO: Mostrar errores generales si existen */}
                    {actionData?.errors?.general && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded animate-shake">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <h3 className="text-sm font-semibold text-red-800">Error en el registro</h3>
                                    <p className="text-sm text-red-700 mt-1">{actionData.errors.general}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <Form method="post" className="space-y-6" noValidate>
                        {/* Información Personal */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                                <svg className="w-5 h-5 text-lateral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Información Personal
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* ✅ MEJORADO: Input con validación visual */}
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="first_name"
                                            name="first_name"
                                            type="text"
                                            value={formData.first_name}
                                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                                            onBlur={() => handleBlur('first_name')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${getError('first_name')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : touched.first_name && formData.first_name
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                                } focus:ring-4 focus:outline-none`}
                                            placeholder="Tu nombre"
                                            required
                                        />
                                        {/* ✅ NUEVO: Icono de validación */}
                                        {touched.first_name && formData.first_name && !getError('first_name') && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    {/* ✅ MEJORADO: Mensaje de error más atractivo */}
                                    {getError('first_name') && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {getError('first_name')}
                                        </p>
                                    )}
                                </div>

                                {/* Apellido con validación */}
                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Apellido <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="last_name"
                                            name="last_name"
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                                            onBlur={() => handleBlur('last_name')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${getError('last_name')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : touched.last_name && formData.last_name
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                                } focus:ring-4 focus:outline-none`}
                                            placeholder="Tu apellido"
                                            required
                                        />
                                        {touched.last_name && formData.last_name && !getError('last_name') && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    {getError('last_name') && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {getError('last_name')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Email con validación */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Correo electrónico <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        {emailIcon}
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        onBlur={() => handleBlur('email')}
                                        className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 transition-all duration-200 ${getError('email')
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                : touched.email && formData.email && !getError('email')
                                                    ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                    : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                            } focus:ring-4 focus:outline-none`}
                                        placeholder="tu@email.com"
                                        required
                                    />
                                    {touched.email && formData.email && !getError('email') && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {getError('email') && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {getError('email')}
                                    </p>
                                )}
                            </div>

                            {/* Teléfono y Empresa */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Teléfono */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            onBlur={() => handleBlur('phone')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${getError('phone')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : touched.phone && formData.phone && !getError('phone')
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                                } focus:ring-4 focus:outline-none`}
                                            placeholder="+57 300 123 4567"
                                            required
                                        />
                                        {touched.phone && formData.phone && !getError('phone') && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    {getError('phone') && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {getError('phone')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tipo de Cuenta */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                                <svg className="w-5 h-5 text-lateral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Tipo de Cuenta
                            </h3>
                            <RoleSelector
                                selectedRole={formData.role}
                                onChange={(role) => handleInputChange('role', role)}
                            />
                            <input type="hidden" name="role" value={formData.role} />
                            
                            {/* ✅ NUEVO: Error de rol cerca del selector */}
                            {getError('role') && (
                                <p className="text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {getError('role')}
                                </p>
                            )}
                        </div>

                        {/* ✅ Campos específicos para DESARROLLADOR */}
                        {formData.role === 'developer' && (
                            <div className="space-y-4 bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                                <h3 className="text-lg font-semibold text-blue-900 pb-2 border-b border-blue-200 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Información del Desarrollador
                                </h3>

                                {/* ✅ NUEVO: Mensaje de advertencia si hay errores */}
                                {(getError('developer_type') || getError('person_type') || getError('document_type') || getError('document_number')) && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-red-800 font-medium">
                                                    Por favor, completa todos los campos obligatorios de desarrollador antes de continuar.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tipo de Desarrollador y Tipo de Persona */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="developer_type" className="block text-sm font-medium text-gray-700 mb-1">
                                            Tipo de Desarrollador <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="developer_type"
                                            name="developer_type"
                                            value={formData.developer_type}
                                            onChange={(e) => {
                                                handleInputChange('developer_type', e.target.value);
                                                // ✅ NUEVO: Marcar como tocado inmediatamente
                                                setTouched(prev => ({ ...prev, developer_type: true }));
                                            }}
                                            onBlur={() => handleBlur('developer_type')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                                getError('developer_type')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50'
                                                    : touched.developer_type && formData.developer_type
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                            } focus:ring-4 focus:outline-none`}
                                            required
                                        >
                                            <option value="">Selecciona tipo</option>
                                            <option value="constructora">Constructora</option>
                                            <option value="fondo_inversion">Fondo de Inversión</option>
                                            <option value="inversionista">Inversionista</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                        {getError('developer_type') && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in font-medium">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {getError('developer_type')}
                                            </p>
                                        )}
                                        {/* ✅ NUEVO: Icono de éxito */}
                                        {touched.developer_type && formData.developer_type && !getError('developer_type') && (
                                            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Seleccionado correctamente
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="person_type" className="block text-sm font-medium text-gray-700 mb-1">
                                            Tipo de Persona <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="person_type"
                                            name="person_type"
                                            value={formData.person_type}
                                            onChange={(e) => {
                                                handleInputChange('person_type', e.target.value);
                                                // ✅ NUEVO: Marcar como tocado inmediatamente
                                                setTouched(prev => ({ ...prev, person_type: true }));
                                            }}
                                            onBlur={() => handleBlur('person_type')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                                getError('person_type')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50'
                                                    : touched.person_type && formData.person_type
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                            } focus:ring-4 focus:outline-none`}
                                            required
                                        >
                                            <option value="">Selecciona tipo</option>
                                            <option value="natural">Persona Natural</option>
                                            <option value="juridica">Persona Jurídica</option>
                                        </select>
                                        {getError('person_type') && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in font-medium">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {getError('person_type')}
                                            </p>
                                        )}
                                        {touched.person_type && formData.person_type && !getError('person_type') && (
                                            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Seleccionado correctamente
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* ✅ CORREGIDO: Nombre de Empresa SOLO para jurídica */}
                                {formData.person_type === 'juridica' && (
                                    <div>
                                        <label htmlFor="legal_name" className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre de la Empresa <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="legal_name"
                                            name="legal_name"
                                            type="text"
                                            value={formData.legal_name}
                                            onChange={(e) => handleInputChange('legal_name', e.target.value)}
                                            onBlur={() => handleBlur('legal_name')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                                getError('legal_name')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : touched.legal_name && formData.legal_name
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                            } focus:ring-4 focus:outline-none`}
                                            placeholder="Nombre de tu empresa"
                                            required
                                        />
                                        {getError('legal_name') && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {getError('legal_name')}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Tipo de Documento y Número */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="document_type" className="block text-sm font-medium text-gray-700 mb-1">
                                            Tipo de Documento <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="document_type"
                                            name="document_type"
                                            value={formData.document_type}
                                            onChange={(e) => handleInputChange('document_type', e.target.value)}
                                            onBlur={() => handleBlur('document_type')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                                getError('document_type')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                            } focus:ring-4 focus:outline-none`}
                                            required
                                        >
                                            <option value="">Selecciona tipo</option>
                                            {formData.person_type === 'juridica' ? (
                                                <option value="NIT">NIT</option>
                                            ) : (
                                                <>
                                                    <option value="CC">Cédula de Ciudadanía</option>
                                                    <option value="CE">Cédula de Extranjería</option>
                                                    <option value="PASSPORT">Pasaporte</option>
                                                    <option value="TI">Tarjeta de Identidad</option>
                                                </>
                                            )}
                                        </select>
                                        {getError('document_type') && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {getError('document_type')}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="document_number" className="block text-sm font-medium text-gray-700 mb-1">
                                            Número de Documento <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="document_number"
                                            name="document_number"
                                            type="text"
                                            value={formData.document_number}
                                            onChange={(e) => handleInputChange('document_number', e.target.value)}
                                            onBlur={() => handleBlur('document_number')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                                getError('document_number')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : touched.document_number && formData.document_number
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                            } focus:ring-4 focus:outline-none`}
                                            placeholder="Solo números"
                                            required
                                        />
                                        {getError('document_number') && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {getError('document_number')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Info adicional */}
                                <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                                    <p className="text-sm text-blue-800 flex items-start gap-2">
                                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <span>
                                            {formData.person_type === 'natural' ? (
                                                <>Se usará tu nombre y apellido como identificación.</>
                                            ) : (
                                                <>
                                                    Ingresa el nombre legal de tu empresa.
                                                    <strong className="block mt-1">Personas jurídicas deben usar NIT.</strong>
                                                </>
                                            )}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Seguridad */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                                <svg className="w-5 h-5 text-lateral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Seguridad de la Cuenta
                            </h3>

                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de usuario <span className="text-gray-400 text-xs">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        onBlur={() => handleBlur('username')}
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                            getError('username')
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50'
                                                : touched.username && formData.username
                                                    ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                    : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                        } focus:ring-4 focus:outline-none`}
                                        placeholder="usuario123 (opcional - se genera automático)"
                                    />
                                    {/* ✅ Icono de éxito */}
                                    {touched.username && formData.username && !getError('username') && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {/* ✅ Mostrar error de username */}
                                {getError('username') && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in font-medium">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {getError('username')}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Si no lo ingresas, se generará uno automáticamente
                                </p>
                            </div>

                            {/* Contraseñas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Password con indicador de fortaleza */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            onBlur={() => handleBlur('password')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${getError('password')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                                } focus:ring-4 focus:outline-none`}
                                            placeholder="Min. 8 caracteres"
                                            required
                                        />
                                    </div>

                                    {/* ✅ NUEVO: Indicador de fortaleza */}
                                    {formData.password && (
                                        <div className="mt-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-300 ${getPasswordStrength(formData.password).color}`}
                                                        style={{ width: `${(getPasswordStrength(formData.password).level / 3) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-gray-600">
                                                    {getPasswordStrength(formData.password).text}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {getError('password') && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {getError('password')}
                                    </p>
                                    )}
                                </div>

                                {/* Confirmar Password */}
                                <div>
                                    <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirmar contraseña <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="passwordConfirm"
                                            name="passwordConfirm"
                                            type="password"
                                            value={formData.passwordConfirm}
                                            onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
                                            onBlur={() => handleBlur('passwordConfirm')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${getError('passwordConfirm')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : touched.passwordConfirm && formData.passwordConfirm && !getError('passwordConfirm')
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                                } focus:ring-4 focus:outline-none`}
                                            placeholder="Repite tu contraseña"
                                            required
                                        />
                                        {touched.passwordConfirm && formData.passwordConfirm && !getError('passwordConfirm') && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    {getError('passwordConfirm') && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {getError('passwordConfirm')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Términos */}
                        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="mt-1 h-4 w-4 text-lateral-600 focus:ring-lateral-500 border-gray-300 rounded"
                            />
                            <label htmlFor="terms" className="text-sm text-gray-700">
                                Acepto los{" "}
                                <a href="https://360lateral.com/wp-content/uploads/2024/12/Politica-de-tratamiento-de-datos-I-V3-2024-I-360Lateral.pdf" className="text-lateral-600 hover:text-lateral-500 font-medium" target="_blank" rel="noopener noreferrer">
                                    términos y condiciones
                                </a>{" "}y la{" "}
                                <a href="https://360lateral.com/wp-content/uploads/2024/12/Politica-de-tratamiento-de-datos-I-V3-2024-I-360Lateral.pdf" className="text-lateral-600 hover:text-lateral-500 font-medium" target="_blank" rel="noopener noreferrer">
                                    política de privacidad
                                </a>
                            </label>
                        </div>

                        {/* Botón Submit con validación visual */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !isFormValid()}
                            className={`w-full px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg flex items-center justify-center ${isFormValid() && !isSubmitting
                                    ? 'bg-gradient-to-r from-lateral-600 to-lateral-700 hover:from-lateral-700 hover:to-lateral-800 text-white hover:shadow-xl transform hover:scale-[1.02]'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creando cuenta...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Crear cuenta
                                </>
                            )}
                        </button>

                        {/* ✅ MEJORADO: Indicador de errores más visible */}
                        {!isFormValid() && Object.keys(clientErrors).length > 0 && (
                            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-orange-700">
                                            Por favor, corrige los errores marcados en rojo antes de continuar
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Form>

                    {/* Link de login */}
                    <div className="text-center mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            ¿Ya tienes una cuenta?{" "}
                            <Link to="/login" className="font-medium text-lateral-600 hover:text-lateral-500 transition-colors duration-200">
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* ✅ NUEVO: Estilos para animaciones */}
            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}