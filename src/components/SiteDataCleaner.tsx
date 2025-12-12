import React, { useState } from "react";
import { SiteIcon } from "./Icons";

interface SiteDataCleanerProps {
  onClean: (domain: string) => void;
  onCurrentSite?: () => void;
}

const SiteDataCleaner: React.FC<SiteDataCleanerProps> = ({
  onClean,
  onCurrentSite,
}) => {
  const [domain, setDomain] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      onClean(domain.trim());
      setDomain("");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        padding: "12px",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        marginTop: "16px",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}
      >
        <SiteIcon size={16} />
        <span style={{ fontWeight: 500, fontSize: "13px", marginLeft: "8px" }}>
          Specific Site Cleaner
        </span>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border-color)",
            fontSize: "14px",
            backgroundColor: "var(--bg-color)",
            color: "var(--text-color)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="submit"
            disabled={!domain.trim()}
            style={{
              flex: 1,
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              padding: "8px 16px",
              borderRadius: "var(--radius)",
              fontSize: "13px",
              fontWeight: 500,
              opacity: domain.trim() ? 1 : 0.5,
              border: "none",
              cursor: domain.trim() ? "pointer" : "not-allowed",
            }}
          >
            Clean
          </button>

          {onCurrentSite && (
            <button
              type="button"
              onClick={onCurrentSite}
              style={{
                flex: 1,
                fontSize: "13px",
                padding: "8px 16px",
                backgroundColor: "var(--muted)",
                color: "var(--text-color)",
                border: "none",
                borderRadius: "var(--radius)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Current Site
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SiteDataCleaner;
