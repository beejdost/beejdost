import type { FC } from 'react';
import { AppRouter } from './router/AppRouter';
import './i18n/config';
import './styles/index.css';

export const App: FC = () => {
  return <AppRouter />;
};

export default App;
