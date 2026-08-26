import "./App.css";
import "./app/shell.css";

import { AppShell } from "./app/AppShell";
import { ErrorBoundary } from "./app/ErrorBoundary";
import { ProfileProvider } from "./state/ProfileProvider";
import { SettingsProvider } from "./state/SettingsProvider";
import { I18nProvider } from "./i18n/I18nProvider";

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <SettingsProvider>
          <ProfileProvider>
            <AppShell />
          </ProfileProvider>
        </SettingsProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
