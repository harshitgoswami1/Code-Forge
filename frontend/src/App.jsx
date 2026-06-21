import { useBuilder } from "./hooks/useBuilder.js";
import StartScreen from "./components/StartScreen.jsx";
import AppShell from "./components/AppShell.jsx";

export default function App() {
  const builder = useBuilder();

  if (!builder.session) {
    return (
      <StartScreen
        onStart={builder.start}
        status={builder.status}
        error={builder.error}
      />
    );
  }

  return <AppShell {...builder} />;
}
