import { useCallback, useEffect, useRef, useState } from 'react';
import { Shield, ShieldOff, ExternalLink, AlertTriangle, Lock } from 'lucide-react';

/**
 * AdShieldPlayer
 *
 * Client-side mitigations for embed ads / popunders.
 *
 * Important: many third-party players refuse to run (or show a hard error)
 * when *any* sandbox attribute is present. Default shield mode therefore
 * does NOT set sandbox — it only blocks window.open and strips referrer.
 * An optional "Strict" mode adds sandbox for users who want it and whose
 * source still plays.
 */

// Full enough that most HTML5 / HLS embeds still work if user enables strict
const STRICT_SANDBOX = [
  'allow-scripts',
  'allow-same-origin',
  'allow-forms',
  'allow-presentation',
  'allow-fullscreen',
  'allow-pointer-lock',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-downloads',
].join(' ');

const ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';

const SHIELD_KEY = 'streamline.adShield';
const STRICT_KEY = 'streamline.adShieldStrict';

function readBool(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === '1';
  } catch {
    return fallback;
  }
}

function writeBool(key, value) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export default function AdShieldPlayer({
  src,
  title = 'Player',
  className = '',
  defaultEnabled = true,
  frameClassName = 'aspect-video overflow-hidden rounded-xl border border-stone-700/80 bg-black',
  children,
}) {
  const [shieldOn, setShieldOn] = useState(() =>
    readBool(SHIELD_KEY, defaultEnabled),
  );
  const [strictSandbox, setStrictSandbox] = useState(() =>
    readBool(STRICT_KEY, false),
  );
  const [blockedPopups, setBlockedPopups] = useState(0);
  const iframeRef = useRef(null);
  const originalOpenRef = useRef(null);

  const isEmbed = Boolean(src);

  // Persist prefs
  useEffect(() => {
    writeBool(SHIELD_KEY, shieldOn);
  }, [shieldOn]);

  useEffect(() => {
    writeBool(STRICT_KEY, strictSandbox);
  }, [strictSandbox]);

  // Block window.open while shield is on (works even without sandbox)
  useEffect(() => {
    if (!shieldOn) {
      if (originalOpenRef.current) {
        window.open = originalOpenRef.current;
        originalOpenRef.current = null;
      }
      return undefined;
    }

    if (!originalOpenRef.current) {
      originalOpenRef.current = window.open.bind(window);
    }

    window.open = function blockedOpen() {
      setBlockedPopups((n) => n + 1);
      return {
        closed: true,
        close() {},
        focus() {},
        blur() {},
        location: { href: '' },
        postMessage() {},
      };
    };

    return () => {
      if (originalOpenRef.current) {
        window.open = originalOpenRef.current;
        originalOpenRef.current = null;
      }
    };
  }, [shieldOn]);

  const toggleShield = useCallback(() => {
    setShieldOn((v) => {
      const next = !v;
      if (!next) setStrictSandbox(false);
      setBlockedPopups(0);
      return next;
    });
  }, []);

  const toggleStrict = useCallback(() => {
    setStrictSandbox((v) => !v);
    setBlockedPopups(0);
  }, []);

  const openInNewTab = useCallback(() => {
    if (!src) return;
    // Use native open via stored original if shield rewrote it
    const openFn = originalOpenRef.current || window.open.bind(window);
    openFn(src, '_blank', 'noopener,noreferrer');
  }, [src]);

  // Remount iframe when strict mode flips so sandbox attr is applied cleanly
  const iframeKey = `${src}|shield:${shieldOn}|strict:${strictSandbox}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={toggleShield}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition ${
              shieldOn
                ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                : 'border-stone-600 bg-stone-900 text-stone-300 hover:bg-stone-800'
            }`}
            title={
              shieldOn
                ? 'Blocks popups from the player page. Safe default.'
                : 'Shield off — embeds run with normal permissions.'
            }
          >
            {shieldOn ? (
              <Shield className="h-3.5 w-3.5" />
            ) : (
              <ShieldOff className="h-3.5 w-3.5" />
            )}
            Ad shield {shieldOn ? 'On' : 'Off'}
            {shieldOn && blockedPopups > 0 && (
              <span className="ml-1 rounded-full bg-emerald-900/80 px-1.5 py-0.5 text-[10px]">
                {blockedPopups} blocked
              </span>
            )}
          </button>

          {/* {shieldOn && (
            <button
              type="button"
              onClick={toggleStrict}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition ${
                strictSandbox
                  ? 'border-amber-500/60 bg-amber-950/40 text-amber-200'
                  : 'border-stone-600 bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
              }`}
              title={
                strictSandbox
                  ? 'Strict sandbox on. Turn off if the player shows a sandbox error.'
                  : 'Optional: add iframe sandbox. Many providers break with this.'
              }
            >
              <Lock className="h-3.5 w-3.5" />
              Strict {strictSandbox ? 'On' : 'Off'}
            </button>
          )} */}
        </div>

        {isEmbed && (
          <button
            type="button"
            onClick={openInNewTab}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-600 bg-stone-900 px-2.5 text-xs text-stone-300 hover:bg-stone-800 transition"
            title="Open in a new tab — use your browser ad blocker there"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open source
          </button>
        )}
      </div>

      <div className={frameClassName}>
        {isEmbed ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={src}
            title={title}
            referrerPolicy={shieldOn ? 'no-referrer' : 'strict-origin-when-cross-origin'}
            // Only attach sandbox when user explicitly enables Strict
            {...(shieldOn && strictSandbox ? { sandbox: STRICT_SANDBOX } : {})}
            allow={ALLOW}
            allowFullScreen
            loading="eager"
            className="h-full w-full border-0"
          />
        ) : (
          children
        )}
      </div>

      {shieldOn && !strictSandbox && (
        <p className="flex items-start gap-1.5 text-[11px] leading-snug text-stone-500">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500/80" />
          Shield blocks popups only. Ads drawn inside the third-party player
          cannot be removed from here. Use Strict only if the source still
          plays — many embeds refuse sandbox.
        </p>
      )}

      {shieldOn && strictSandbox && (
        <p className="flex items-start gap-1.5 text-[11px] leading-snug text-amber-200/80">
          <Lock className="mt-0.5 h-3 w-3 shrink-0" />
          Strict sandbox is on. If you see a sandbox / script error from the
          player, turn Strict off.
        </p>
      )}
    </div>
  );
}