import "./App.css";
import "./app/shell.css";

import { AppShell } from "./app/AppShell";
import { ProfileProvider } from "./state/ProfileProvider";
import { I18nProvider } from "./i18n/I18nProvider";

function App() {
  return (
    <I18nProvider>
      <ProfileProvider>
        <AppShell />
      </ProfileProvider>
    </I18nProvider>
  );
}

export default App;
