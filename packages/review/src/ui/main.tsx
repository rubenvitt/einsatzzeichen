/**
 * Einstiegspunkt der Oberfläche. Fail-closed: fehlt der Wurzelknoten, bricht der Start mit einer
 * Meldung ab, statt eine leere Seite zu zeigen.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const container = document.getElementById('app');
if (container === null) {
  throw new Error('Der Wurzelknoten #app fehlt in index.html.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
