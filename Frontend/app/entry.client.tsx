/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { logger, traceNavigation } from "~/utils/logger";

// Inicializar el sistema de logging
logger.info('App', '🚀 Inicializando aplicación cliente');
traceNavigation();

startTransition(() => {
  logger.debug('Hydration', 'Iniciando hydration');
  try {
    hydrateRoot(
      document,
      <StrictMode>
        <RemixBrowser />
      </StrictMode>
    );
    logger.info('Hydration', 'Hydration completada');
  } catch (error) {
    logger.error('Hydration', 'Error durante hydration', { error });
  }
});
