// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from "react";

const VS_URL = "https://www.videosynergie.com";
const VS_LOGO = "https://i.imgur.com/ciCS5KO.png";

const C = {
  bg: "#f0f4f8",
  white: "#ffffff",
  accent: "#00b4d8",
  accentDark: "#0096c7",
  accentSoft: "#00b4d812",
  accentBorder: "#00b4d835",
  surface: "#ffffff",
  surfaceAlt: "#f7f9fb",
  border: "#dde4ec",
  borderLight: "#e8edf3",
  text: "#1e293b",
  textMuted: "#64748b",
  textDim: "#94a3b8",
  danger: "#ef4444",
  dangerBg: "#fef2f2",
  success: "#10b981",
  successBg: "#ecfdf5",
  shadow: "rgba(0,0,0,0.06)",
  shadowMd: "rgba(0,0,0,0.1)",
};

const PRESETS = {
  seyes: {
    name: "Seyes (grands carreaux)",
    bg: "#FFFFF5",
    layers: [
      { id: "1", name: "Lignes principales H", axisH: true, axisV: false, stepY: 80, stepX: 80, thickness: 1.5, color: "#7B68C8", style: "solid", opacity: 0.9, visible: true },
      { id: "2", name: "Interlignes H", axisH: true, axisV: false, stepY: 20, stepX: 20, thickness: 0.5, color: "#B8A9E8", style: "solid", opacity: 0.6, visible: true },
      { id: "3", name: "Lignes verticales", axisH: false, axisV: true, stepY: 80, stepX: 80, thickness: 0.5, color: "#B8A9E8", style: "solid", opacity: 0.6, visible: true },
    ],
    margin: { enabled: true, position: 80, color: "#FF6B8A", thickness: 1.5, style: "solid" },
  },
  petitsCarreaux: {
    name: "Petits carreaux (5mm)",
    bg: "#FFFFFF",
    layers: [
      { id: "1", name: "Quadrillage 5mm", axisH: true, axisV: true, stepY: 20, stepX: 20, thickness: 0.5, color: "#A0C4E8", style: "solid", opacity: 0.7, visible: true },
    ],
    margin: { enabled: false, position: 80, color: "#FF6B8A", thickness: 1.5, style: "solid" },
  },
  millimetre: {
    name: "Millimétré",
    bg: "#FFFFFF",
    layers: [
      { id: "1", name: "Lignes cm", axisH: true, axisV: true, stepY: 40, stepX: 40, thickness: 1, color: "#D4885A", style: "solid", opacity: 0.8, visible: true },
      { id: "2", name: "Lignes 5mm", axisH: true, axisV: true, stepY: 20, stepX: 20, thickness: 0.5, color: "#D4885A", style: "solid", opacity: 0.5, visible: true },
      { id: "3", name: "Lignes mm", axisH: true, axisV: true, stepY: 4, stepX: 4, thickness: 0.3, color: "#D4885A", style: "solid", opacity: 0.3, visible: true },
    ],
    margin: { enabled: false, position: 80, color: "#FF6B8A", thickness: 1.5, style: "solid" },
  },
  lignesSimples: {
    name: "Lignes simples",
    bg: "#FFFFFF",
    layers: [
      { id: "1", name: "Lignes", axisH: true, axisV: false, stepY: 32, stepX: 32, thickness: 0.8, color: "#AABBCC", style: "solid", opacity: 0.7, visible: true },
    ],
    margin: { enabled: true, position: 80, color: "#FF6B8A", thickness: 1.5, style: "solid" },
  },
  vierge: {
    name: "Vierge",
    bg: "#FFFFFF",
    layers: [],
    margin: { enabled: false, position: 80, color: "#FF6B8A", thickness: 1.5, style: "solid" },
  },
};

const PAGE_FORMATS = {
  A4: { w: 794, h: 1122, label: "A4" },
  A3: { w: 1122, h: 1587, label: "A3" },
  "16:9": { w: 960, h: 540, label: "16:9 (ENI)" },
  "4:3": { w: 800, h: 600, label: "4:3" },
  custom: { w: 800, h: 600, label: "Personnalisé" },
};

const uid = () => Math.random().toString(36).slice(2, 9);

const defaultLayer = () => ({
  id: uid(), name: "Nouveau niveau", axisH: true, axisV: false,
  stepY: 40, stepX: 40, thickness: 1, color: "#7B68C8",
  style: "solid", opacity: 0.8, visible: true,
});

export default function App() {
  const [bg, setBg] = useState("#FFFFF5");
  const [bgImage, setBgImage] = useState(null);
  const [layers, setLayers] = useState(PRESETS.seyes.layers.map(l => ({ ...l, id: uid() })));
  const [margin, setMargin] = useState({ ...PRESETS.seyes.margin });
  const [gridScale, setGridScale] = useState(1);
  const [quality, setQuality] = useState(4);
  const [format, setFormat] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [customW, setCustomW] = useState(800);
  const [customH, setCustomH] = useState(600);
  const [openLayer, setOpenLayer] = useState(null);
  const [showMargin, setShowMargin] = useState(false);
  const canvasRef = useRef(null);
  const previewContainerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [panelTab, setPanelTab] = useState("layers");

  useEffect(() => {
    if (format === "custom") return;
    const { w, h } = PAGE_FORMATS[format];
    setOrientation(w > h ? "landscape" : "portrait");
  }, [format]);

  const getPageSize = useCallback(() => {
    let w, h;
    if (format === "custom") { w = customW; h = customH; }
    else { w = PAGE_FORMATS[format].w; h = PAGE_FORMATS[format].h; }
    if (orientation === "landscape") return { w: Math.max(w, h), h: Math.min(w, h) };
    return { w: Math.min(w, h), h: Math.max(w, h) };
  }, [format, orientation, customW, customH]);

  const renderToCanvas = useCallback((targetCanvas, resScale, gScale) => {
    const { w, h } = getPageSize();
    const s = resScale;
    const g = gScale;
    const cw = w * s, ch = h * s;
    targetCanvas.width = cw; targetCanvas.height = ch;
    const ctx = targetCanvas.getContext("2d");
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);
    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = layer.thickness * s;
      if (layer.style === "dashed") ctx.setLineDash([6 * s, 4 * s]);
      else if (layer.style === "dotted") ctx.setLineDash([2 * s, 3 * s]);
      else ctx.setLineDash([]);
      if (layer.axisH && layer.stepY > 0) {
        const step = layer.stepY * g * s;
        for (let y = step; y < ch; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
      }
      if (layer.axisV && layer.stepX > 0) {
        const step = layer.stepX * g * s;
        for (let x = step; x < cw; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
      }
      ctx.restore();
    }
    if (margin.enabled) {
      ctx.save();
      ctx.strokeStyle = margin.color;
      ctx.lineWidth = margin.thickness * s;
      if (margin.style === "dashed") ctx.setLineDash([6 * s, 4 * s]);
      else if (margin.style === "dotted") ctx.setLineDash([2 * s, 3 * s]);
      else ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(margin.position * g * s, 0); ctx.lineTo(margin.position * g * s, ch); ctx.stroke();
      ctx.restore();
    }
  }, [layers, bg, margin, getPageSize]);

  const drawCanvas = useCallback(() => {
    if (canvasRef.current) renderToCanvas(canvasRef.current, 1, gridScale);
  }, [renderToCanvas, gridScale]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleBgImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBgImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const updateLayer = (id, key, val) => setLayers(p => p.map(l => l.id === id ? { ...l, [key]: val } : l));
  const addLayer = () => { const nl = defaultLayer(); setLayers(p => [...p, nl]); setOpenLayer(nl.id); };
  const removeLayer = (id) => { setLayers(p => p.filter(l => l.id !== id)); if (openLayer === id) setOpenLayer(null); };
  const moveLayer = (id, dir) => setLayers(p => {
    const i = p.findIndex(l => l.id === id);
    if ((dir === -1 && i === 0) || (dir === 1 && i === p.length - 1)) return p;
    const n = [...p]; [n[i], n[i + dir]] = [n[i + dir], n[i]]; return n;
  });

  const applyPreset = (key) => {
    const p = key.startsWith("saved_") ? savedPresets[parseInt(key.replace("saved_", ""))] : PRESETS[key];
    if (!p) return;
    setBg(p.bg); setLayers(p.layers.map(l => ({ ...l, id: uid() }))); setMargin({ ...p.margin }); setOpenLayer(null);
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    setSavedPresets(p => [...p, { name: presetName.trim(), bg, layers: layers.map(l => ({ ...l })), margin: { ...margin } }]);
    setPresetName(""); setShowSavePreset(false);
  };

  const generateSVG = () => {
    const { w, h } = getPageSize();
    const g = gridScale;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    svg += `<rect width="${w}" height="${h}" fill="${bg}"/>`;
    for (const layer of layers) {
      if (!layer.visible) continue;
      let da = layer.style === "dashed" ? ` stroke-dasharray="6,4"` : layer.style === "dotted" ? ` stroke-dasharray="2,3"` : "";
      let op = layer.opacity < 1 ? ` opacity="${layer.opacity}"` : "";
      const stepY = layer.stepY * g, stepX = layer.stepX * g;
      if (layer.axisH && stepY > 0) for (let y = stepY; y < h; y += stepY)
        svg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${layer.color}" stroke-width="${layer.thickness}"${da}${op}/>`;
      if (layer.axisV && stepX > 0) for (let x = stepX; x < w; x += stepX)
        svg += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${layer.color}" stroke-width="${layer.thickness}"${da}${op}/>`;
    }
    if (margin.enabled) {
      let da = margin.style === "dashed" ? ` stroke-dasharray="6,4"` : margin.style === "dotted" ? ` stroke-dasharray="2,3"` : "";
      svg += `<line x1="${margin.position * g}" y1="0" x2="${margin.position * g}" y2="${h}" stroke="${margin.color}" stroke-width="${margin.thickness}"${da}/>`;
    }
    svg += `</svg>`; return svg;
  };

  const exportFile = (type) => {
    if (type === "svg") {
      const b = new Blob([generateSVG()], { type: "image/svg+xml" });
      const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "lignage.svg"; a.click(); URL.revokeObjectURL(u);
    } else if (type === "pdf") {
      const { w, h } = getPageSize(); const s = generateSVG();
      const pw = window.open("", "_blank");
      if (pw) {
        pw.document.write(`<html><head><title>Lignage - Vidéo Synergie</title><style>@page{size:${w}px ${h}px;margin:0}body{margin:0;padding:0}</style></head><body>`);
        pw.document.write(`<img src="data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(s)))}" style="width:${w}px;height:${h}px"/>`);
        pw.document.write(`</body></html>`); pw.document.close(); setTimeout(() => pw.print(), 500);
      }
    } else {
      const ec = document.createElement("canvas"); renderToCanvas(ec, quality, gridScale);
      const mime = type === "jpg" ? "image/jpeg" : "image/png";
      ec.toBlob((b) => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `lignage.${type}`; a.click(); URL.revokeObjectURL(u); }, mime, 0.95);
    }
  };

  const { w: pw, h: ph } = getPageSize();
  const padding = 48;
  const previewScale = Math.min((containerSize.w - padding) / pw, (containerSize.h - padding) / ph);

  const inp = {
    width: "100%", padding: "7px 10px", background: C.white, border: `1px solid ${C.border}`,
    borderRadius: 7, fontSize: 13, color: C.text, boxSizing: "border-box", outline: "none",
    transition: "border-color 0.2s",
  };
  const btnPrimary = {
    padding: "9px 16px", background: C.accent, color: C.white, border: "none",
    borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
    boxShadow: `0 2px 8px ${C.accent}30`,
  };
  const btnSmall = (bgc = C.surfaceAlt, tc = C.textMuted) => ({
    padding: "4px 10px", background: bgc, color: tc, border: `1px solid ${C.borderLight}`,
    borderRadius: 6, cursor: "pointer", fontSize: 12, transition: "all 0.15s",
  });
  const sel = { ...inp, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2394a3b8' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28 };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", background: C.bg, color: C.text }}>
      {/* TOP BAR */}
      <div style={{
        display: "flex", alignItems: "center", padding: "10px 24px", background: C.white,
        borderBottom: `1px solid ${C.border}`, boxShadow: `0 1px 3px ${C.shadow}`, gap: 16, flexShrink: 0,
      }}>
        <a href={VS_URL} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src={VS_LOGO} alt="Vidéo Synergie" style={{ height: 44, objectFit: "contain" }} />
        </a>
        <div style={{ width: 1, height: 32, background: C.border }} />
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>
            Générateur de Lignage
          </h1>
          <p style={{ fontSize: 11, color: C.textDim, margin: 0 }}>Créez vos fonds personnalisés pour ENI</p>
        </div>
        <div style={{ flex: 1 }} />
        <a href={VS_URL} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: C.accent, textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          videosynergie.com
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2H2.5C1.95 2 1.5 2.45 1.5 3v6.5c0 .55.45 1 1 1H9c.55 0 1-.45 1-1V7.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 1.5h3.5V5M6 6.5l4.5-4.5" stroke="currentColor" strokeWidth="1.2"/></svg>
        </a>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SIDEBAR */}
        <div style={{
          width: 350, minWidth: 350, background: C.white, borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: `2px 0 8px ${C.shadow}`,
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            {[["layers", "Niveaux"], ["page", "Page"], ["presets", "Presets"]].map(([k, label]) => (
              <button key={k} onClick={() => setPanelTab(k)}
                style={{
                  flex: 1, padding: "11px 0", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: panelTab === k ? C.white : C.surfaceAlt,
                  color: panelTab === k ? C.accent : C.textMuted,
                  borderBottom: panelTab === k ? `2.5px solid ${C.accent}` : "2.5px solid transparent",
                  transition: "all 0.2s",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
            {panelTab === "layers" && (
              <div>
                {layers.map((l) => (
                  <div key={l.id} style={{
                    background: C.white, borderRadius: 10, marginBottom: 8,
                    border: `1px solid ${openLayer === l.id ? C.accent : C.border}`,
                    boxShadow: openLayer === l.id ? `0 0 0 3px ${C.accentBorder}` : `0 1px 3px ${C.shadow}`,
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", padding: "9px 10px", gap: 6, cursor: "pointer" }}
                      onClick={() => setOpenLayer(openLayer === l.id ? null : l.id)}>
                      <button onClick={(e) => { e.stopPropagation(); updateLayer(l.id, "visible", !l.visible); }}
                        style={{ ...btnSmall(), padding: "3px 7px", fontSize: 13, opacity: l.visible ? 1 : 0.35 }}>
                        👁
                      </button>
                      <div style={{ width: 14, height: 14, borderRadius: 4, background: l.color, border: `1px solid ${C.border}`, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); moveLayer(l.id, -1); }} style={btnSmall()}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveLayer(l.id, 1); }} style={btnSmall()}>▼</button>
                      <button onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }} style={btnSmall(C.dangerBg, C.danger)}>✕</button>
                    </div>
                    {openLayer === l.id && (
                      <div style={{ padding: "10px 12px 14px", borderTop: `1px solid ${C.borderLight}`, display: "flex", flexDirection: "column", gap: 10, background: C.surfaceAlt, borderRadius: "0 0 10px 10px" }}>
                        <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Nom
                          <input value={l.name} onChange={e => updateLayer(l.id, "name", e.target.value)} style={inp} />
                        </label>
                        <div style={{ display: "flex", gap: 14 }}>
                          <label style={{ fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
                            <input type="checkbox" checked={l.axisH} onChange={e => updateLayer(l.id, "axisH", e.target.checked)} style={{ accentColor: C.accent }} /> Horizontal
                          </label>
                          <label style={{ fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
                            <input type="checkbox" checked={l.axisV} onChange={e => updateLayer(l.id, "axisV", e.target.checked)} style={{ accentColor: C.accent }} /> Vertical
                          </label>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, flex: 1 }}>Pas Y (px)
                            <input type="number" min={1} value={l.stepY} onChange={e => updateLayer(l.id, "stepY", Math.max(1, +e.target.value))} style={inp} />
                          </label>
                          <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, flex: 1 }}>Pas X (px)
                            <input type="number" min={1} value={l.stepX} onChange={e => updateLayer(l.id, "stepX", Math.max(1, +e.target.value))} style={inp} />
                          </label>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, flex: 1 }}>Épaisseur
                            <input type="number" min={0.1} step={0.1} value={l.thickness} onChange={e => updateLayer(l.id, "thickness", Math.max(0.1, +e.target.value))} style={inp} />
                          </label>
                          <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, flex: 1 }}>Couleur
                            <div style={{ display: "flex", gap: 4 }}>
                              <input type="color" value={l.color} onChange={e => updateLayer(l.id, "color", e.target.value)}
                                style={{ width: 36, height: 32, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", padding: 2, background: C.white }} />
                              <input value={l.color} onChange={e => updateLayer(l.id, "color", e.target.value)} style={{ ...inp, flex: 1 }} />
                            </div>
                          </label>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, flex: 1 }}>Style
                            <select value={l.style} onChange={e => updateLayer(l.id, "style", e.target.value)} style={sel}>
                              <option value="solid">Continu</option>
                              <option value="dashed">Tirets</option>
                              <option value="dotted">Pointillé</option>
                            </select>
                          </label>
                          <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, flex: 1 }}>Opacité
                            <input type="range" min={0} max={1} step={0.05} value={l.opacity} onChange={e => updateLayer(l.id, "opacity", +e.target.value)}
                              style={{ width: "100%", accentColor: C.accent, marginTop: 6 }} />
                            <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>{Math.round(l.opacity * 100)}%</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={addLayer} style={{ ...btnPrimary, width: "100%", marginTop: 6 }}>+ Ajouter un niveau</button>

                {/* Margin */}
                <div style={{
                  background: C.white, borderRadius: 10, marginTop: 14,
                  border: `1px solid ${showMargin ? C.accent : C.border}`,
                  boxShadow: `0 1px 3px ${C.shadow}`, transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", padding: "9px 10px", gap: 8, cursor: "pointer" }}
                    onClick={() => setShowMargin(!showMargin)}>
                    <input type="checkbox" checked={margin.enabled} onChange={e => setMargin(m => ({ ...m, enabled: e.target.checked }))}
                      onClick={e => e.stopPropagation()} style={{ accentColor: C.accent }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Marge</span>
                    <span style={{ fontSize: 11, color: C.textDim }}>{showMargin ? "▼" : "▶"}</span>
                  </div>
                  {showMargin && (
                    <div style={{ padding: "10px 12px 14px", borderTop: `1px solid ${C.borderLight}`, display: "flex", flexDirection: "column", gap: 10, background: C.surfaceAlt, borderRadius: "0 0 10px 10px" }}>
                      <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Position (px)
                        <input type="number" min={0} value={margin.position} onChange={e => setMargin(m => ({ ...m, position: +e.target.value }))} style={inp} />
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, flex: 1 }}>Épaisseur
                          <input type="number" min={0.1} step={0.1} value={margin.thickness} onChange={e => setMargin(m => ({ ...m, thickness: Math.max(0.1, +e.target.value) }))} style={inp} />
                        </label>
                        <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, flex: 1 }}>Couleur
                          <div style={{ display: "flex", gap: 4 }}>
                            <input type="color" value={margin.color} onChange={e => setMargin(m => ({ ...m, color: e.target.value }))}
                              style={{ width: 36, height: 32, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", padding: 2, background: C.white }} />
                            <input value={margin.color} onChange={e => setMargin(m => ({ ...m, color: e.target.value }))} style={{ ...inp, flex: 1 }} />
                          </div>
                        </label>
                      </div>
                      <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Style
                        <select value={margin.style} onChange={e => setMargin(m => ({ ...m, style: e.target.value }))} style={sel}>
                          <option value="solid">Continu</option>
                          <option value="dashed">Tirets</option>
                          <option value="dotted">Pointillé</option>
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {panelTab === "page" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Couleur de fond
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <input type="color" value={bg} onChange={e => setBg(e.target.value)}
                      style={{ width: 40, height: 32, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", padding: 2, background: C.white }} />
                    <input value={bg} onChange={e => setBg(e.target.value)} style={{ ...inp, flex: 1 }} />
                  </div>
                </label>
                <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Image de fond
                  <input type="file" accept="image/*" onChange={handleBgImage} style={{ ...inp, marginTop: 4, padding: "6px 8px" }} />
                  {bgImage && <button onClick={() => setBgImage(null)} style={{ ...btnSmall(C.dangerBg, C.danger), marginTop: 6 }}>Supprimer l'image</button>}
                </label>
                <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Format
                  <select value={format} onChange={e => setFormat(e.target.value)} style={{ ...sel, marginTop: 4 }}>
                    {Object.entries(PAGE_FORMATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </label>
                {format === "custom" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, flex: 1 }}>Largeur
                      <input type="number" min={100} value={customW} onChange={e => setCustomW(+e.target.value)} style={inp} />
                    </label>
                    <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, flex: 1 }}>Hauteur
                      <input type="number" min={100} value={customH} onChange={e => setCustomH(+e.target.value)} style={inp} />
                    </label>
                  </div>
                )}
                <div>
                  <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Orientation</span>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    {[["portrait", "Portrait"], ["landscape", "Paysage"]].map(([v, label]) => (
                      <button key={v} onClick={() => setOrientation(v)}
                        style={{
                          flex: 1, padding: "8px 0", borderRadius: 8,
                          border: `1.5px solid ${orientation === v ? C.accent : C.border}`,
                          background: orientation === v ? C.accentSoft : C.white,
                          color: orientation === v ? C.accentDark : C.textMuted,
                          cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                        }}>{label}</button>
                    ))}
                  </div>
                </div>
                <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>
                  Échelle du quadrillage : <span style={{ color: C.accent, fontWeight: 700 }}>{Math.round(gridScale * 100)}%</span>
                  <input type="range" min={0.25} max={3} step={0.05} value={gridScale} onChange={e => setGridScale(+e.target.value)}
                    style={{ width: "100%", marginTop: 6, accentColor: C.accent }} />
                </label>
                <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>
                  Qualité export : <span style={{ color: C.accent, fontWeight: 700 }}>x{quality} ({pw * quality} × {ph * quality} px)</span>
                  <input type="range" min={1} max={8} step={1} value={quality} onChange={e => setQuality(+e.target.value)}
                    style={{ width: "100%", marginTop: 6, accentColor: C.accent }} />
                </label>
                <div style={{ fontSize: 11, color: C.textDim, background: C.surfaceAlt, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.borderLight}` }}>
                  Format : {pw} × {ph} px — Export : {pw * quality} × {ph * quality} px
                </div>
              </div>
            )}

            {panelTab === "presets" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, color: C.textMuted, margin: 0, fontWeight: 600 }}>Presets intégrés</p>
                {Object.entries(PRESETS).map(([k, v]) => (
                  <button key={k} onClick={() => applyPreset(k)}
                    style={{
                      textAlign: "left", padding: "10px 14px", fontSize: 13, fontWeight: 500,
                      background: C.white, color: C.text, border: `1px solid ${C.border}`,
                      borderRadius: 8, cursor: "pointer", transition: "all 0.2s",
                      boxShadow: `0 1px 2px ${C.shadow}`,
                    }}
                    onMouseEnter={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accentBorder}`; }}
                    onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = `0 1px 2px ${C.shadow}`; }}>
                    {v.name}
                  </button>
                ))}
                {savedPresets.length > 0 && <>
                  <p style={{ fontSize: 12, color: C.textMuted, margin: "10px 0 0", fontWeight: 600 }}>Mes presets</p>
                  {savedPresets.map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => applyPreset(`saved_${i}`)}
                        style={{
                          flex: 1, textAlign: "left", padding: "10px 14px", fontSize: 13,
                          background: C.successBg, color: C.success, border: `1px solid ${C.success}40`,
                          borderRadius: 8, cursor: "pointer", fontWeight: 500,
                        }}>{p.name}</button>
                      <button onClick={() => setSavedPresets(prev => prev.filter((_, j) => j !== i))} style={btnSmall(C.dangerBg, C.danger)}>✕</button>
                    </div>
                  ))}
                </>}
                <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "6px 0" }} />
                {!showSavePreset ? (
                  <button onClick={() => setShowSavePreset(true)}
                    style={{ ...btnPrimary, background: C.success, boxShadow: `0 2px 8px ${C.success}30` }}>
                    💾 Sauvegarder le preset actuel
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 4 }}>
                    <input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Nom du preset" style={{ ...inp, flex: 1 }} />
                    <button onClick={savePreset} style={{ ...btnPrimary, padding: "8px 14px" }}>OK</button>
                    <button onClick={() => setShowSavePreset(false)} style={btnSmall()}>✕</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export bar */}
          <div style={{ padding: 14, borderTop: `1px solid ${C.border}`, background: C.surfaceAlt, flexShrink: 0 }}>
            {!showExport ? (
              <button onClick={() => setShowExport(true)}
                style={{ ...btnPrimary, width: "100%", padding: "10px 16px", fontSize: 14 }}>
                📥 Exporter
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["svg", "png", "jpg", "pdf"].map(t => (
                    <button key={t} onClick={() => exportFile(t)}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 8,
                        background: C.white, color: C.accent, border: `1.5px solid ${C.accent}`,
                        cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s",
                      }}
                      onMouseEnter={e => { e.target.style.background = C.accent; e.target.style.color = C.white; }}
                      onMouseLeave={e => { e.target.style.background = C.white; e.target.style.color = C.accent; }}>
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowExport(false)} style={{ ...btnSmall(), width: "100%", textAlign: "center", padding: "6px 0" }}>Fermer</button>
              </div>
            )}
          </div>
        </div>

        {/* PREVIEW */}
        <div ref={previewContainerRef} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: 24 }}>
          <div style={{
            boxShadow: `0 4px 20px ${C.shadowMd}, 0 0 0 1px ${C.border}`,
            borderRadius: 4, overflow: "hidden", lineHeight: 0, background: C.white,
          }}>
            <canvas ref={canvasRef} style={{ width: pw * previewScale, height: ph * previewScale, display: "block" }} />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 24px",
        background: C.white, borderTop: `1px solid ${C.border}`, flexShrink: 0, gap: 8,
      }}>
        <span style={{ fontSize: 11, color: C.textDim }}>Un outil</span>
        <a href={VS_URL} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center" }}>
          <img src={VS_LOGO} alt="Vidéo Synergie" style={{ height: 24, objectFit: "contain" }} />
        </a>
        <span style={{ fontSize: 11, color: C.textDim }}>•</span>
        <a href={VS_URL} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, color: C.accent, textDecoration: "none", fontWeight: 600 }}>
          www.videosynergie.com
        </a>
      </div>
    </div>
  );
}
