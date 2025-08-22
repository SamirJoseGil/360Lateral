import { useState, useCallback } from 'react';

// Tipo para validadores genéricos
type Validator<T> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
};

// Tipo para el objeto de validadores completo
type Validators<T> = {
  [K in keyof T]?: Validator<T[K]>;
};

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validators: Validators<T> = {}
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verifica si el formulario es válido
  const validateField = useCallback((name: keyof T, value: any): string => {
    const validator = validators[name];
    if (!validator) return '';

    if (validator.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'Este campo es obligatorio';
    }

    if (validator.minLength && typeof value === 'string' && value.length < validator.minLength) {
      return `Debe tener al menos ${validator.minLength} caracteres`;
    }

    if (validator.maxLength && typeof value === 'string' && value.length > validator.maxLength) {
      return `No puede tener más de ${validator.maxLength} caracteres`;
    }

    if (validator.min !== undefined && typeof value === 'number' && value < validator.min) {
      return `El valor mínimo es ${validator.min}`;
    }

    if (validator.max !== undefined && typeof value === 'number' && value > validator.max) {
      return `El valor máximo es ${validator.max}`;
    }

    if (validator.pattern && typeof value === 'string' && !validator.pattern.test(value)) {
      return 'El formato no es válido';
    }

    if (validator.custom) {
      const customResult = validator.custom(value);
      if (typeof customResult === 'string') {
        return customResult;
      } else if (customResult === false) {
        return 'Valor inválido';
      }
    }

    return '';
  }, [validators]);

  // Validar todos los campos
  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const key in validators) {
      const error = validateField(key, values[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    // Marcamos todos los campos como tocados
    const allTouched = Object.keys(validators).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Record<keyof T, boolean>);

    setTouched(allTouched);
    
    return isValid;
  }, [validateField, values, validators]);

  // Manejar cambios en inputs
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Convertir el valor según el tipo de input
    let parsedValue: any = value;
    if ((e.target as HTMLInputElement).type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    
    setValues(prev => ({
      ...prev,
      [name]: parsedValue
    }));

    // Validar en tiempo real si el campo ya fue tocado
    if (touched[name as keyof T]) {
      const error = validateField(name as keyof T, parsedValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [touched, validateField]);

  // Manejar el evento blur (cuando el campo pierde el foco)
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Marcar el campo como tocado
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validar el campo
    const error = validateField(name as keyof T, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, [validateField]);

  // Establecer un valor programáticamente
  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Validar si el campo ya fue tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [touched, validateField]);

  // Reset de formulario
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Función para manejar el envío del formulario
  const handleSubmit = useCallback((onSubmit: (values: T) => void | Promise<void>) => {
    return async () => {
      setIsSubmitting(true);
      
      // Validar todos los campos antes de enviar
      const isValid = validateAll();
      
      if (isValid) {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Error en envío de formulario:', error);
        }
      }
      
      setIsSubmitting(false);
    };
  }, [validateAll, values]);

  // Verificar si el formulario es válido
  const isValid = Object.keys(errors).length === 0 && 
    Object.keys(validators).every(key => {
      if (validators[key as keyof T]?.required) {
        const value = values[key as keyof T];
        return value !== undefined && value !== null && value !== '';
      }
      return true;
    });

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    setValue,
    resetForm,
    handleSubmit
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