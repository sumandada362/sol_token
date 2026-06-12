"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletHolding } from "@/app/api/tokens/holdings/[wallet]/route";

export type WalletToken = WalletHolding;

function shortMint(mint: string) {
  return mint.length > 12 ? `${mint.slice(0, 4)}…${mint.slice(-4)}` : mint;
}

function TokenLogo({ token }: { token: WalletToken }) {
  const [failed, setFailed] = useState(false);
  if (!token.logo || failed) {
    return (
      <span className="token-select-logo token-select-logo--fallback">
        {(token.symbol || token.name || "?").slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={token.logo}
      alt=""
      className="token-select-logo"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Mint-address picker: lists the connected wallet's tokens (logo, symbol,
 * shortened mint, balance) and still accepts a pasted address for tokens
 * the wallet doesn't hold.
 */
export default function TokenSelect({
  value,
  onChange,
  disabled,
  placeholder = "Select a token or paste mint address",
}: {
  value: string;
  /** Receives the mint; `token` is set when picked from the wallet list */
  onChange: (mint: string, token?: WalletToken) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { publicKey } = useWallet();
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const loadedFor = useRef("");

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const load = useCallback(async () => {
    if (!publicKey) return;
    const wallet = publicKey.toBase58();
    if (loadedFor.current === wallet) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tokens/holdings/${wallet}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTokens(data as WalletToken[]);
        loadedFor.current = wallet;
      } else {
        setTokens([]);
      }
    } catch {
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  function toggleMenu() {
    if (disabled) return;
    setOpen((o) => {
      if (!o) {
        setQuery("");
        void load();
      }
      return !o;
    });
  }

  function select(mint: string, token?: WalletToken) {
    onChange(mint, token);
    setOpen(false);
  }

  const selected = tokens.find((t) => t.mint === value) ?? null;

  const q = query.trim().toLowerCase();
  const filtered = tokens.filter(
    (t) =>
      !q ||
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.mint.toLowerCase().includes(q)
  );
  // A pasted full address that isn't in the wallet can still be used directly
  const pasted = query.trim();
  const pasteCandidate = pasted.length >= 32 && !filtered.some((t) => t.mint === pasted) ? pasted : "";

  return (
    <div className="token-select" ref={rootRef}>
      <button
        type="button"
        className="token-select-trigger wizard-input"
        onClick={toggleMenu}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selected ? (
          <>
            <TokenLogo token={selected} />
            <span className="token-select-symbol">{selected.symbol || selected.name || "Token"}</span>
            <span className="token-select-mint lp-mono">{shortMint(selected.mint)}</span>
          </>
        ) : value ? (
          <span className="token-select-mint lp-mono">{shortMint(value)}</span>
        ) : (
          <span className="token-select-placeholder">{placeholder}</span>
        )}
        <span className="token-select-caret" aria-hidden>▾</span>
      </button>

      {open && (
        <div className="token-select-menu" role="listbox">
          <input
            className="wizard-input token-select-search"
            placeholder="Search your tokens or paste a mint address…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="token-select-list">
            {pasteCandidate && (
              <button type="button" className="token-select-item" onClick={() => select(pasteCandidate)}>
                <span className="token-select-logo token-select-logo--fallback">＋</span>
                <span className="token-select-symbol">Use this address</span>
                <span className="token-select-mint lp-mono">{shortMint(pasteCandidate)}</span>
              </button>
            )}
            {!publicKey ? (
              <p className="token-select-empty">Connect your wallet to list your tokens, or paste a mint address above.</p>
            ) : loading ? (
              <p className="token-select-empty">Loading your tokens…</p>
            ) : filtered.length === 0 && !pasteCandidate ? (
              <p className="token-select-empty">
                {q ? "No tokens match your search." : "No tokens found in this wallet — paste a mint address above."}
              </p>
            ) : (
              filtered.map((t) => (
                <button
                  type="button"
                  key={t.mint}
                  role="option"
                  aria-selected={t.mint === value}
                  className={`token-select-item${t.mint === value ? " token-select-item--active" : ""}`}
                  onClick={() => select(t.mint, t)}
                >
                  <TokenLogo token={t} />
                  <span className="token-select-symbol">{t.symbol || t.name || "Unknown"}</span>
                  <span className="token-select-mint lp-mono">{shortMint(t.mint)}</span>
                  <span className="token-select-balance">
                    {t.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
