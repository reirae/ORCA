import DbViewer from "./pages/DbViewer";
import AdminLogs from "./pages/AdminLogs";
import Chat from "./pages/Chat";

function App() {
  return (
    <div>
      <Chat />
      <hr />
      <DbViewer />
      <hr />
      <AdminLogs />
    </div>
  );
}

export default App;