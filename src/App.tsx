import { useState } from "react";
import ActionButton from "./components/ActionButton";
import TimeRangeSelector from "./components/TimeRangeSelector";
import SiteDataCleaner from "./components/SiteDataCleaner";
import { HistoryIcon, DownloadIcon, TrashIcon } from "./components/Icons";
import {
  clearBrowserHistory,
  clearDownloadHistory,
  clearEverything,
  clearSiteData,
  getCurrentTabUrl,
  type TimeRange,
} from "./utils/chrome-api";
import packageJson from "../package.json";

function App() {
  const [timeRange, setTimeRange] = useState<TimeRange>("last_hour");
  const [status, setStatus] = useState<string | null>(null);

  const handleClearCurrentSite = async () => {
    setStatus("Getting current site...");
    const url = await getCurrentTabUrl();
    if (!url) {
      setStatus("Could not get current site.");
      setTimeout(() => setStatus(null), 2000);
      return;
    }
    await handleAction(`site data for ${new URL(url).hostname}`, () =>
      clearSiteData(url)
    );
  };

  const handleAction = async (
    actionName: string,
    actionFn: () => Promise<void>
  ) => {
    setStatus(`Cleaning ${actionName}...`);
    try {
      await actionFn();
      setStatus(`Successfully cleared ${actionName}!`);
      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error(error);
      setStatus("Error occurred.");
      setTimeout(() => setStatus(null), 2000);
    }
  };

  return (
    <div className="container" style={{ gap: "8px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
          paddingBottom: "8px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "-0.5px",
              whiteSpace: "nowrap",
            }}
          >
            Quick Clear
          </h1>
          <span
            style={{
              fontSize: "10px",
              backgroundColor: "var(--muted)",
              color: "var(--muted-foreground)",
              padding: "2px 6px",
              borderRadius: "999px",
              fontWeight: 500,
            }}
          >
            v{packageJson.version}
          </span>
        </div>
      </header>

      <TimeRangeSelector
        value={timeRange}
        onChange={(v) => setTimeRange(v as TimeRange)}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <ActionButton
          title="Clear Browser History"
          description="Removes visited pages history"
          icon={<HistoryIcon size={24} />}
          onClick={() =>
            handleAction("history", () => clearBrowserHistory(timeRange))
          }
          variant="primary"
        />

        <ActionButton
          title="Clear Downloads"
          description="Removes download history"
          icon={<DownloadIcon size={24} />}
          onClick={() =>
            handleAction("downloads", () => clearDownloadHistory(timeRange))
          }
          variant="info" // Using info/purpleish style
        />

        <div style={{ margin: "4px 0" }} />

        <ActionButton
          title="Clear Everything"
          description="Cookies, cache, history, downloads..."
          icon={<TrashIcon size={24} />}
          onClick={() =>
            handleAction("everything", () => clearEverything(timeRange))
          }
          variant="danger"
        />
      </div>

      <SiteDataCleaner
        onClean={(domain) =>
          handleAction(`site data for ${domain}`, () => clearSiteData(domain))
        }
        onCurrentSite={handleClearCurrentSite}
      />
      {status && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--muted-foreground)",
            fontWeight: 500,
            textAlign: "center",
            marginTop: "8px",
            minHeight: "18px",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}

export default App;
