"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, type ChangeEvent, type KeyboardEvent } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const MAX_TAGS = 3;
const PHRASES  = ["Customize Token", "No Coding", "No Complexity"];
const TYPE_MS  = 62;
const ERASE_MS = 38;
const HOLD_MS  = 1600;
const PAUSE_MS = 300;

export const PREFILL_KEY = "solana_token_create_prefill";

export default function CustomizeTokenPanel() {
  const router = useRouter();

  // Controlled form state
  const [name, setName]           = useState("");
  const [symbol, setSymbol]       = useState("");
  const [decimals, setDecimals]   = useState("9");
  const [supply, setSupply]       = useState("1000000000");
  const [description, setDesc]    = useState("");

  // Logo — file upload OR URL
  const [logoFile, setLogoFile]   = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoUrl, setLogoUrl]     = useState("");

  // Tags
  const [tags, setTags]           = useState<string[]>([]);
  const [tagInput, setTagInput]   = useState("");

  // Typewriter title
  const [titleText, setTitleText] = useState("");
  const [phase, setPhase]         = useState<"typing" | "erasing">("typing");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const phrase = PHRASES[phraseIdx];
    if (phase === "typing") {
      if (titleText.length < phrase.length) {
        const t = setTimeout(() => setTitleText(phrase.slice(0, titleText.length + 1)), TYPE_MS);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("erasing"), HOLD_MS);
      return () => clearTimeout(t);
    }
    if (phase === "erasing") {
      if (titleText.length > 0) {
        const t = setTimeout(() => setTitleText((s) => s.slice(0, -1)), ERASE_MS);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => { setPhraseIdx((i) => (i + 1) % PHRASES.length); setPhase("typing"); }, PAUSE_MS);
      return () => clearTimeout(t);
    }
  }, [titleText, phase, phraseIdx, reduced]);

  const full = tags.length >= MAX_TAGS;

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/,$/, "");
      if (val && tags.length < MAX_TAGS && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput("");
      }
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  function removeTag(index: number) {
    setTags(tags.filter((_, i) => i !== index));
  }

  function handleLogoFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoUrl("");
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleCreateToken() {
    // Serialize what we have into sessionStorage so /create can pick it up
    let logoBase64 = "";
    let logoMime = "";
    let logoFilename = "";

    if (logoFile) {
      logoBase64 = await fileToBase64(logoFile);
      logoMime = logoFile.type;
      logoFilename = logoFile.name;
    }

    sessionStorage.setItem(
      PREFILL_KEY,
      JSON.stringify({
        name: name.slice(0, 30),
        symbol: symbol.toUpperCase().slice(0, 10),
        supply: supply || "1000000000",
        decimals: decimals || "9",
        description,
        logoBase64,
        logoMime,
        logoFilename,
        logoUrl: logoUrl.trim(),
      })
    );

    router.push("/create-token");
  }

  const hasAnyInput = name || symbol || supply !== "1000000000" || description || logoFile || logoUrl;

  return (
    <div id="hero-panel">
      <p className="panel-header" aria-label="Customize Token">
        {reduced ? PHRASES[0] : titleText}
        {!reduced && <span className="typewriter-cursor" aria-hidden>|</span>}
      </p>
      <div className="panel-divider" />
      <div className="panel-inputs">
        {/* Logo */}
        <div className="input-group full">
          <label htmlFor="token-logo-url">Token Logo</label>
          <div className="logo-row">
            <label className="logo-upload" style={{ position: "relative" }}>
              {logoFile ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {logoPreview && <img src={logoPreview} alt="" style={{ width: 20, height: 20, objectFit: "cover", borderRadius: 3, marginRight: 6 }} />}
                  ✓ {logoFile.name.length > 12 ? logoFile.name.slice(0, 12) + "…" : logoFile.name}
                </>
              ) : "⬆ Upload"}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoFileChange} />
            </label>
            <input
              id="token-logo-url"
              type="text"
              placeholder="or paste image URL"
              value={logoUrl}
              onChange={(e) => { setLogoUrl(e.target.value); if (e.target.value) { setLogoFile(null); setLogoPreview(""); } }}
            />
          </div>
        </div>

        {/* Name */}
        <div className="input-group">
          <label htmlFor="token-name">Token Name <span className="hint">max 30</span></label>
          <input
            id="token-name"
            type="text"
            maxLength={30}
            placeholder="e.g. My Token"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Symbol */}
        <div className="input-group">
          <label htmlFor="token-symbol">Token Symbol <span className="hint">max 10</span></label>
          <input
            id="token-symbol"
            type="text"
            maxLength={10}
            placeholder="e.g. MTK"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
        </div>

        {/* Decimals */}
        <div className="input-group">
          <label htmlFor="token-decimal">Token Decimal</label>
          <input
            id="token-decimal"
            type="number"
            placeholder="e.g. 9"
            min={0}
            max={9}
            value={decimals}
            onChange={(e) => setDecimals(e.target.value)}
          />
        </div>

        {/* Supply */}
        <div className="input-group">
          <label htmlFor="token-supply">Token Supply</label>
          <input
            id="token-supply"
            type="number"
            placeholder="e.g. 1,000,000"
            min={1}
            value={supply}
            onChange={(e) => setSupply(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="input-group full">
          <label htmlFor="token-description">Description</label>
          <textarea
            id="token-description"
            maxLength={500}
            placeholder="Describe your token..."
            value={description}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div className="input-group full">
          <label htmlFor="token-tags-input">Tags <span className="hint">max 3</span></label>
          <div className={`tags-box${full ? " full" : ""}`} id="token-tags">
            {tags.map((t, i) => (
              <span className="tag-chip" key={t}>
                {t}
                <button type="button" onClick={() => removeTag(i)}>×</button>
              </span>
            ))}
            <input
              id="token-tags-input"
              type="text"
              value={tagInput}
              disabled={full}
              placeholder={full ? "" : "Type a tag, press Enter"}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <button
          className="panel-create-btn"
          onClick={handleCreateToken}
        >
          {hasAnyInput ? "Continue to Create →" : "Create Token →"}
        </button>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
