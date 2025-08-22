import { useState, useCallback } from 'react';

interface ValidationRule<T> {
  validate: (value: T, formData: Record<string, any>) => boolean;
  message: string;
}

interface FieldConfig<T = any> {
  required?: boolean;
  rules?: ValidationRule<T>[];
}

interface FormConfig {
  [key: string]: FieldConfig;
}

interface FormErrors {
  [key: string]: string[];
}

interface UseFormReturn<T> {
  data: T;
  errors: FormErrors;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: any) => void;
  setData: (newData: Partial<T>) => void;
  validateField: (field: keyof T) => boolean;
  validateAll: () => boolean;
  clearErrors: (field?: keyof T) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
}

export function useForm<T extends Record<string, any>>(
  initialData: T,
  config: FormConfig = {}
): UseFormReturn<T> {
  const [data, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setSubmitting] = useState(false);

  const validateField = useCallback((field: keyof T): boolean => {
    const fieldConfig = config[field as string];
    if (!fieldConfig) return true;

    const fieldErrors: string[] = [];
    const value = data[field];

    // Required validation
    if (fieldConfig.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      fieldErrors.push('Este campo es requerido');
    }

    // Custom rules validation
    if (fieldConfig.rules && value) {
      fieldConfig.rules.forEach(rule => {
        if (!rule.validate(value, data)) {
          fieldErrors.push(rule.message);
        }
      });
    }

    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors
    }));

    return fieldErrors.length === 0;
  }, [data, config]);

  const validateAll = useCallback((): boolean => {
    const allErrors: FormErrors = {};
    let isFormValid = true;

    Object.keys(config).forEach(field => {
      const fieldConfig = config[field];
      if (!fieldConfig) return;

      const fieldErrors: string[] = [];
      const value = data[field as keyof T];

      // Required validation
      if (fieldConfig.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        fieldErrors.push('Este campo es requerido');
        isFormValid = false;
      }

      // Custom rules validation
      if (fieldConfig.rules && value) {
        fieldConfig.rules.forEach(rule => {
          if (!rule.validate(value, data)) {
            fieldErrors.push(rule.message);
            isFormValid = false;
          }
        });
      }

      if (fieldErrors.length > 0) {
        allErrors[field] = fieldErrors;
      }
    });

    setErrors(allErrors);
    return isFormValid;
  }, [data, config]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const setData = useCallback((newData: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  }, []);

  const clearErrors = useCallback((field?: keyof T) => {
    if (field) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    } else {
      setErrors({});
    }
  }, []);

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setSubmitting(false);
  }, [initialData]);

  const isValid = Object.keys(errors).length === 0;

  return {
    data,
    errors,
    isValid,
    isSubmitting,
    setValue,
    setData,
    validateField,
    validateAll,
    clearErrors,
    setSubmitting,
    reset,
  };
}

// Validaciones comunes
export const commonValidations = {
  email: {
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Formato de email inválido'
  },
  minLength: (length: number) => ({
    validate: (value: string) => value.length >= length,
    message: `Debe tener al menos ${length} caracteres`
  }),
  maxLength: (length: number) => ({
    validate: (value: string) => value.length <= length,
    message: `No puede tener más de ${length} caracteres`
  }),
  strongPassword: {
    validate: (value: string) => {
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && value.length >= 8;
    },
    message: 'Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
  },
  passwordMatch: (confirmField: string) => ({
    validate: (value: string, formData: Record<string, any>) => value === formData[confirmField],
    message: 'Las contraseñas no coinciden'
  }),
  username: {
    validate: (value: string) => /^[a-zA-Z0-9_-]{3,}$/.test(value),
    message: 'Solo letras, números, guiones y guiones bajos. Mínimo 3 caracteres'
  },
  phone: {
    validate: (value: string) => /^\+?[\d\s()-]{10,}$/.test(value),
    message: 'Formato de teléfono inválido'
  }
};