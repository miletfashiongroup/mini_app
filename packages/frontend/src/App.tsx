import AppRoutes from './routes';
import TabBar from './components/TabBar';
import useTelegramTheme from './hooks/useTelegramTheme';

const App = () => {
  useTelegramTheme();

  return (
    <div className="pb-20 min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <main className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
        <AppRoutes />
      </main>
      <TabBar />
    </div>
  );
};

export default App;
