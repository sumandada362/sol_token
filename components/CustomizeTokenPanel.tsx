"use client";

import Link from "next/link";
import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from "react";

const MAX_TAGS = 3;
const PHRASES  = ["Customize Token", "No Coding", "No Complexity"];
const TYPE_MS  = 62;
const ERASE_MS = 38;
const HOLD_MS  = 1600;
const PAUSE_MS = 300;

export default function CustomizeTokenPanel() {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [logoName, setLogoName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [titleText, setTitleText] = useState("");
  const [phase, setPhase]         = useState<"typing" | "erasing">("typing");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedRef.current) { setTitleText(PHRASES[0]); }
  }, []);

  useEffect(() => {
    if (reducedRef.current) return;
    const phrase = PHRASES[phraseIdx];

    if (phase === "typing") {
      if (titleText.length < phrase.length) {
        const t = setTimeout(
          () => setTitleText(phrase.slice(0, titleText.length + 1)),
          TYPE_MS,
        );
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
      const t = setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % PHRASES.length);
        setPhase("typing");
      }, PAUSE_MS);
      return () => clearTimeout(t);
    }
  }, [titleText, phase, phraseIdx]);

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

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoName(file.name);
      setLogoUrl("");
    }
  }

  return (
    <div id="hero-panel">
      <p className="panel-header" aria-label="Customize Token">
        {titleText}
        {!reducedRef.current && <span className="typewriter-cursor" aria-hidden>|</span>}
      </p>
      <div className="panel-divider" />
      <div className="panel-inputs">
        <div className="input-group full">
          <label htmlFor="token-logo-url">Token Logo</label>
          <div className="logo-row">
            <label className="logo-upload">
              {logoName ? `✓ ${logoName}` : "⬆ Upload"}
              <input type="file" accept="image/*" onChange={handleLogoChange} />
            </label>
            <input
              id="token-logo-url"
              type="text"
              placeholder="or paste image URL"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="token-name">
            Token Name <span className="hint">max 30</span>
          </label>
          <input id="token-name" type="text" maxLength={30} placeholder="e.g. My Token" />
        </div>

        <div className="input-group">
          <label htmlFor="token-symbol">
            Token Symbol <span className="hint">max 10</span>
          </label>
          <input id="token-symbol" type="text" maxLength={10} placeholder="e.g. MTK" />
        </div>

        <div className="input-group">
          <label htmlFor="token-decimal">Token Decimal</label>
          <input id="token-decimal" type="number" placeholder="e.g. 9" min={0} max={18} />
        </div>

        <div className="input-group">
          <label htmlFor="token-supply">Token Supply</label>
          <input id="token-supply" type="number" placeholder="e.g. 1,000,000" min={1} />
        </div>

        <div className="input-group full">
          <label htmlFor="token-description">Description</label>
          <textarea
            id="token-description"
            maxLength={500}
            placeholder="Describe your token..."
          />
        </div>

        <div className="input-group full">
          <label htmlFor="token-tags-input">
            Tags <span className="hint">max 3</span>
          </label>
          <div className={`tags-box${full ? " full" : ""}`} id="token-tags">
            {tags.map((t, i) => (
              <span className="tag-chip" key={t}>
                {t}
                <button type="button" onClick={() => removeTag(i)}>
                  ×
                </button>
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
        <Link href="/create-token">Additional Settings ›</Link>
      </div>
    </div>
  );
}
