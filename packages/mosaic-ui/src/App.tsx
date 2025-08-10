import { AppRouter } from './router/index';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/globals.css';

function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;