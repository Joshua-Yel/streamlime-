import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Shield,
  ShieldOff,
  ExternalLink,
  AlertTriangle,
  Lock,
  Maximize,
  Minimize,
} from 'lucide-react';

/**
 * AdShieldPlayer
 *
 * Blocks window.open popunders while keeping iframe fullscreen working.
 * Strict sandbox is optional — many providers break under any sandbox attr.
 */

const STRICT_SANDBOX = [
  'allow-scripts',
  'allow-same-origin',
  'allow-forms',
  'allow-presentation',
  'allow-fullscreen',
  'allow-pointer-lock',
  // Popups still blocked by our window.open override; these tokens only
  // matter if something legitimately needs a popup (rare for video embeds).
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-downloads',
].join(' ');

// Permissions-Policy style allow list. Explicit fullscreen is required for
// cross-origin embeds to call requestFullscreen from inside the iframe.
// IMPORTANT: each feature is "name" or "name allowlist".
// "fullscreen *" (with a space) allows the embed to fullscreen itself.
// Do NOT write "fullscreen; fullscreen *" — the second token is invalid and
// some browsers ignore the whole fullscreen grant.
const ALLOW = [
  "accelerometer",
  "autoplay",
  "clipboard-write",
  "encrypted-media",
  "gyroscope",
  "picture-in-picture",
  "web-share",
  "fullscreen *",
].join("; ");

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef(null);
  const frameWrapRef = useRef(null);
  const originalOpenRef = useRef(null);

  const isEmbed = Boolean(src);

  useEffect(() => {
    writeBool(SHIELD_KEY, shieldOn);
  }, [shieldOn]);

  useEffect(() => {
    writeBool(STRICT_KEY, strictSandbox);
  }, [strictSandbox]);

  // Track native fullscreen changes (Esc, browser UI, etc.)
  useEffect(() => {
    const onFsChange = () => {
      const active =
        document.fullscreenElement === frameWrapRef.current ||
        document.fullscreenElement === iframeRef.current;
      setIsFullscreen(Boolean(active));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Block ad popunders, but allow opens to the *same origin as the embed*.
  // Some players implement "fullscreen" via window.open to their own host;
  // blanket-blocking every open breaks that button while still needing ad shield.
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

    const nativeOpen = originalOpenRef.current;

    let embedOrigin = '';
    try {
      if (src) embedOrigin = new URL(src, window.location.href).origin;
    } catch {
      embedOrigin = '';
    }

    window.open = function guardedOpen(url, target, features) {
      try {
        // Empty / undefined url often means "open blank then set location" — block those
        // (classic popunder pattern). Real player FS usually passes an absolute URL.
        if (url == null || url === '' || url === 'about:blank') {
          setBlockedPopups((n) => n + 1);
          return {
            closed: true,
            close() {},
            focus() {},
            blur() {},
            location: { href: '' },
            postMessage() {},
          };
        }
        const resolved = new URL(String(url), window.location.href);
        // Allow same-origin as the embed (player UI, authentic FS helpers)
        if (embedOrigin && resolved.origin === embedOrigin) {
          return nativeOpen(url, target, features);
        }
      } catch {
        /* fall through to block */
      }
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
  }, [shieldOn, src]);

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
    const openFn = originalOpenRef.current || window.open.bind(window);
    openFn(src, '_blank', 'noopener,noreferrer');
  }, [src]);

  /**
   * Fullscreen the *wrapper*, not only the iframe element.
   * Cross-origin embeds often can't promote themselves; parent-driven FS works.
   * Avoid ancestors with CSS transform (e.g. framer-motion) by FS'ing our node.
   */
  const toggleFullscreen = useCallback(async () => {
    const node = frameWrapRef.current;
    if (!node) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
        return;
      }
      if (node.requestFullscreen) {
        await node.requestFullscreen();
        setIsFullscreen(true);
      } else if (node.webkitRequestFullscreen) {
        await node.webkitRequestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      // Some mobile browsers require a stronger user gesture or disallow FS
    }
  }, []);

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

          {shieldOn && (
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
          )}

          {/* {isEmbed && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-600 bg-stone-900 px-2.5 text-xs text-stone-300 hover:bg-stone-800 transition"
              title="Fullscreen the player (works with ad shield on)"
            >
              {isFullscreen ? (
                <Minimize className="h-3.5 w-3.5" />
              ) : (
                <Maximize className="h-3.5 w-3.5" />
              )}
              {isFullscreen ? 'Exit' : 'Fullscreen'}
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

      <div
        ref={frameWrapRef}
        className={`${frameClassName} relative bg-black`}
      >
        {isEmbed ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={src}
            title={title}
            // Keep referrer for player CDNs that gate features; ads are still
            // mitigated by the selective window.open guard above.
            referrerPolicy="strict-origin-when-cross-origin"
            {...(shieldOn && strictSandbox ? { sandbox: STRICT_SANDBOX } : {})}
            allow={ALLOW}
            allowFullScreen
            allowfullscreen="true"
            webkitallowfullscreen="true"
            mozallowfullscreen="true"
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
          cannot be removed from here. Use Fullscreen above if the embed&apos;s
          fullscreen should work from the player controls. Strict only if the source still
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