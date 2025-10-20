# Política de Seguridad - Lateral 360°

## Reportar Vulnerabilidades

Si descubres una vulnerabilidad de seguridad en Lateral 360°, por favor repórtala de forma responsable.

### Proceso de Reporte

1. **No crear issues públicos** para vulnerabilidades de seguridad
2. Enviar detalles por email a: **security@lateral360.com**
3. Incluir en tu reporte:
   - Descripción detallada de la vulnerabilidad
   - Pasos para reproducir el problema
   - Impacto potencial
   - Sugerencias de solución (si tienes)

### Tiempo de Respuesta

- Acuse de recibo: **24 horas**
- Evaluación inicial: **72 horas**
- Actualización de estado: **Semanal**
- Resolución objetivo: **30 días** (dependiendo de la severidad)

## Versiones Soportadas

| Versión | Soporte          |
| ------- | ---------------- |
| 1.0.x   | ✅ Actualmente   |
| < 1.0   | ❌ No soportado  |

## Prácticas de Seguridad

### Autenticación

- JWT con rotación de tokens
- Tokens de acceso de corta duración (1 hora)
- Refresh tokens seguros (7 días)
- HttpOnly cookies en producción
- Rate limiting en endpoints de auth

### Contraseñas

- Mínimo 8 caracteres
- Validación de complejidad
- Hashing con Django's PBKDF2
- Salt único por contraseña
- No se almacenan contraseñas en texto plano

### HTTPS/TLS

- TLS 1.2+ requerido en producción
- HSTS habilitado
- Certificados SSL válidos
- Redirección automática HTTP -> HTTPS

### CORS

- Configuración restrictiva
- Lista blanca de orígenes
- Credenciales solo para orígenes confiables

### Input Validation

- Validación en frontend y backend
- Sanitización de inputs
- Protección contra XSS
- Protección contra SQL injection
- Protección contra CSRF

### File Upload

- Validación de extensiones
- Límite de tamaño (10MB)
- Escaneo de malware (futuro)
- Almacenamiento seguro

### Logging

- Logs de acceso y errores
- No loggear información sensible
- Monitoreo de intentos fallidos
- Alertas automáticas

## Configuración Segura

### Variables de Entorno Críticas

```bash
# NUNCA commitear estos valores
SECRET_KEY=<strong-random-key>
DB_PASSWORD=<strong-password>
JWT_SECRET_KEY=<strong-key>
```

### Checklist de Seguridad

#### Desarrollo
- [ ] DEBUG=False en producción
- [ ] SECRET_KEY único y seguro
- [ ] ALLOWED_HOSTS configurado
- [ ] Base de datos con contraseña fuerte
- [ ] Variables de entorno en .env
- [ ] .env en .gitignore

#### Producción
- [ ] HTTPS/SSL configurado
- [ ] HSTS habilitado
- [ ] Secure cookies
- [ ] CORS restrictivo
- [ ] Rate limiting activo
- [ ] Logs de seguridad activos
- [ ] Backups automáticos
- [ ] Monitoreo activo

## Dependencias

### Actualización de Dependencias

```bash
# Backend
pip list --outdated
pip install --upgrade <package>

# Frontend
npm outdated
npm update
```

### Auditoría de Seguridad

```bash
# Backend
pip-audit

# Frontend
npm audit
npm audit fix
```

## Compliance

### GDPR

- Consentimiento explícito de usuarios
- Derecho al olvido implementado
- Exportación de datos personales
- Anonimización de datos antiguos

### Protección de Datos

- Encriptación en tránsito (TLS)
- Encriptación en reposo (BD)
- Acceso basado en roles
- Auditoría de accesos

## Incidentes de Seguridad

### Plan de Respuesta

1. **Detección**: Identificar el incidente
2. **Contención**: Limitar el impacto
3. **Erradicación**: Eliminar la amenaza
4. **Recuperación**: Restaurar servicios
5. **Lecciones aprendidas**: Documentar y mejorar

### Contactos de Emergencia

- **Security Team**: security@lateral360.com
- **CTO**: cto@lateral360.com
- **On-call**: +57 XXX XXX XXXX

## Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/4.2/topics/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Agradecimientos

Agradecemos a todos los investigadores de seguridad que reportan vulnerabilidades de forma responsable.

## Última Actualización

2024-01-15
