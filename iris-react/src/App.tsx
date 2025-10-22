import { Route, Routes } from "react-router-dom";
import SegmentationPage from "./pages/SegmentationPage";
import { UIProvider, useUI } from "./context/UIContext";

function AppChrome() {
  const { loaderText, message, dialogue, hideDialogue } = useUI();
  const hasLoader = loaderText !== null;

  return (
    <>
      <div id="block-screen" className="block-screen" style={{ display: dialogue ? "block" : "none" }} />
      <div id="dialogue" className="dialogue" style={{ display: dialogue ? "block" : "none" }}>
        <div className="dialogue-content">
          <div id="dialogue-header" className="dialogue-header">
            {dialogue?.closable !== false && (
              <span id="dialogue-close" className="dialogue-close" onClick={hideDialogue} role="button" tabIndex={0}>
                &times;
              </span>
            )}
            <h2 id="dialogue-title">{dialogue?.title ?? ""}</h2>
          </div>
          <div id="dialogue-body" className="dialogue-body">
            {dialogue?.content}
          </div>
        </div>
      </div>

      <div id="loader" className="loader" style={{ display: hasLoader ? "block" : "none" }}>
        <div
          style={{
            textAlign: "center",
            width: "200px",
            margin: 0,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <div className="loader-spin" />
          <div id="loader-text">{loaderText ?? "Loading..."}</div>
        </div>
      </div>

      <div id="message" className="message" style={{ display: message ? "block" : "none" }}>
        {message}
      </div>

      <Routes>
        <Route path="/" element={<SegmentationPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <UIProvider>
      <AppChrome />
    </UIProvider>
  );
}

export default App;
