import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // FIC: AÑADIR: Configuración de Build para optimizar el manejo de assets grandes
  /*
  build: {
    // Definir un límite bajo para que las assets pequeñas sean inlined
    assetsInlineLimit: 4096, // Valor por defecto. Puedes bajarlo a 0 si es necesario
    rollupOptions: {
      // Opcional: Ignorar las advertencias de tamaño, aunque no resuelve el problema de Azure,
      // ayuda a ver si el problema es la advertencia de tamaño o la cantidad de archivos.
      output: {
        manualChunks(id) {
          // Separar grandes dependencias en sus propios chunks para evitar un bundle gigante.
          if (id.includes('node_modules')) {
            // Separa react y react-dom en su propio chunk
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Separa UI5 webcomponents en un chunk
            if (id.includes('@ui5/webcomponents')) {
                return 'vendor-ui5';
            }
            return 'vendor'; // Todos los demás node_modules
          }
        }
      }
    }
  }
  */
});