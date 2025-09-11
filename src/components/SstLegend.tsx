export function SstLegend({ badge }: { badge?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        bottom: 12,
        padding: "8px 10px",
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        borderRadius: 8,
        backdropFilter: "blur(6px)",
        fontSize: 12,
        lineHeight: 1.2
      }}
    >
      <div style={{ fontWeight: 600 }}>Sea Surface Temp</div>
      {badge && <div style={{ opacity: 0.85 }}>{badge}</div>}
    </div>
  );
}
