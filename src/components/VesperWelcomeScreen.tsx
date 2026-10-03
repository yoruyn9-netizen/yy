import React, { useEffect, useRef, useState } from 'react';
import { GoogleUser, getStoredUser } from '../services/authService';
import { GoogleAuthModal } from './GoogleAuthModal';

interface VesperWelcomeScreenProps {
  onEnter: () => void;
  userEmail?: string;
  onLogin?: (user: GoogleUser) => void;
  onUpdateApiKey?: (apiKey: string) => void;
}

export const VesperWelcomeScreen: React.FC<VesperWelcomeScreenProps> = ({
  onEnter,
  userEmail = '',
  onLogin,
  onUpdateApiKey,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // IIFE Animation fallback & animationend handlers
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const appears = root.querySelectorAll<HTMLElement>('.appear, .hero-photo');

    appears.forEach((el) => {
      el.addEventListener(
        'animationend',
        () => {
          el.classList.add('is-in');
        },
        { once: true }
      );
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        let hasActive = false;
        appears.forEach((el) => {
          try {
            const anims = el.getAnimations();
            if (anims && anims.some((a) => a.playState === 'running' || a.playState === 'finished')) {
              hasActive = true;
            }
          } catch {}
        });

        if (!hasActive) {
          appears.forEach((el) => el.classList.add('is-in'));
        }
      });
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleResize = () => {
      if (window.innerWidth >= 901) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isExiting) return;

    // Check if user is already logged in with Google
    const currentUser = getStoredUser();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    proceedToWorkspace();
  };

  const proceedToWorkspace = () => {
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 750);
  };

  const handleAuthSuccess = (user: GoogleUser) => {
    setIsAuthModalOpen(false);
    if (onLogin) {
      onLogin(user);
    }
    proceedToWorkspace();
  };

  return (
    <div
      ref={containerRef}
      className={`vesper-root ${isMenuOpen ? 'menu-open' : ''} ${isExiting ? 'exiting' : ''}`}
      style={{ background: '#000', color: '#fff' }}
    >
      <style>{`
        /* Exact Vesper.ai inline styles & typography */
        @font-face {
          font-family: "Inter";
          font-style: normal;
          font-weight: 100 900;
          font-display: swap;
          src: url("inter.woff2") format("woff2");
        }
        @font-face {
          font-family: "Instrument Serif";
          font-style: italic;
          font-weight: 400;
          font-display: swap;
          src: url("instrument-serif-italic.woff2") format("woff2");
        }

        .vesper-root {
          --bg: #000000;
          --text: #ffffff;
          --muted: #9a9a9a;
          --stat: #d8d8d8;
          --border: rgba(255, 255, 255, 0.16);
          --border-soft: rgba(255, 255, 255, 0.12);

          --logo: 15.5px;
          --logo-mark: 22px;
          --nav: 14px;
          --nav-h: 40px;
          --btn: 13.5px;
          --btn-h: 40px;
          --hero-btn-h: 42px;
          --h1: 48px;
          --lede: 15.5px;
          --badge: 12.5px;
          --stat-size: 13.5px;
          --header-y: 22px;
          --header-x: 40px;
          --stats-x: 72px;
          --stats-y: 36px;
          --hero-gap: 85px;
          --copy-max: 860px;
          --lede-max: 470px;

          position: fixed;
          inset: 0;
          z-index: 9999;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          background: #000000 !important;
          background: var(--bg, #000000);
          color: #ffffff !important;
          color: var(--text, #ffffff);
          font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          overflow-x: hidden;
          overflow-y: hidden;
          box-sizing: border-box;
        }

        .vesper-root *, .vesper-root *::before, .vesper-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .vesper-root a {
          color: inherit;
          text-decoration: none;
        }

        .vesper-root button {
          font-family: inherit;
        }

        /* 4. Grain at z-index 100 */
        .vesper-root .grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 100;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        /* 2. Hero photo / video background + scrim */
        .vesper-root .hero-photo {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          background: #000000;
        }
        .vesper-root .hero-photo video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 1;
        }
        .vesper-root .hero-photo::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.65) 100%);
          pointer-events: none;
        }

        /* 3. Page container */
        .vesper-root .page {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-rows: auto 1fr auto;
          min-height: 100vh;
          min-height: 100dvh;
          height: 100%;
          width: 100%;
          overflow: hidden;
        }

        /* Header — 3-column grid */
        .vesper-root .header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: var(--header-y) var(--header-x) 10px;
          z-index: 50;
          position: relative;
        }

        .vesper-root .logo {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          justify-self: start;
          font-size: var(--logo);
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #fff;
          cursor: pointer;
        }
        .vesper-root .logo-mark {
          width: var(--logo-mark);
          height: var(--logo-mark);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vesper-root .logo-suffix {
          font-weight: 400;
          color: rgba(255,255,255,0.7);
        }

        /* Center Nav */
        .vesper-root #site-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-self: center;
        }

        /* Liquid-metal pill nav link */
        .vesper-root .nav-pill {
          height: var(--nav-h);
          padding: 0 18px;
          border-radius: 7px;
          overflow: hidden;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(198,198,198,0.55);
          background: linear-gradient(105deg, #050505 0%, #2a2a2a 48%, #4a4a4a 100%);
          color: #f3f3f3;
          font-size: var(--nav);
          font-weight: 400;
          letter-spacing: -0.01em;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
        }
        .vesper-root .nav-pill::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.16) 50%, transparent 70%);
          transform: translateX(-120%);
          transition: transform 0.6s ease;
          pointer-events: none;
        }
        .vesper-root .nav-pill:hover {
          border-color: rgba(235,235,235,0.9);
          background: linear-gradient(105deg, #111 0%, #3a3a3a 45%, #6a6a6a 100%);
          box-shadow: 0 0 18px rgba(200,210,230,0.18);
        }
        .vesper-root .nav-pill:hover::before {
          transform: translateX(120%);
        }

        /* Buttons (shared liquid-glass language) */
        .vesper-root .btn {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: var(--btn-h);
          padding: 0 16px;
          border-radius: 6px;
          font-size: var(--btn);
          font-weight: 500;
          letter-spacing: -0.02em;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, color 0.35s ease, filter 0.35s ease;
        }
        .vesper-root .btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.45) 48%, transparent 76%);
          transform: translateX(-130%);
          transition: transform 0.65s ease;
          pointer-events: none;
        }
        .vesper-root .btn:hover::after {
          transform: translateX(130%);
        }

        /* Solid button */
        .vesper-root .btn-solid {
          background: linear-gradient(180deg, #ffffff 0%, #e7e7e7 48%, #cfcfcf 100%);
          color: #111;
          border: 1px solid #fff;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.95);
        }
        .vesper-root .btn-solid:hover {
          background: linear-gradient(180deg, #fff 0%, #f3f6ff 42%, #d5def2 100%);
          border-color: #f2f6ff;
          box-shadow: inset 0 1px 0 #fff, 0 0 22px rgba(186,208,255,0.35), 0 8px 18px rgba(255,255,255,0.12);
        }

        .vesper-root .header-cta {
          justify-self: end;
        }

        /* Hero Ghost (stronger frost) */
        .vesper-root .btn-hero-ghost {
          background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(0,0,0,0.5) 46%, rgba(150,170,200,0.1));
          color: #fff;
          border: 1px solid rgba(198,198,198,0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .vesper-root .btn-hero-ghost:hover {
          border-color: rgba(220,230,255,0.8);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 0 24px rgba(170,200,255,0.28);
        }

        .vesper-root .hero-btn {
          height: var(--hero-btn-h);
          padding: 0 18px;
        }
        .vesper-root .hero-btn.btn-solid:hover {
          box-shadow: inset 0 1px 0 #fff, 0 0 26px rgba(186,208,255,0.4), 0 8px 18px rgba(255,255,255,0.14);
        }

        /* Burger Menu button */
        .vesper-root .burger {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: rgba(8,8,8,0.55);
          z-index: 60;
          cursor: pointer;
          align-content: center;
          justify-items: center;
          padding: 0;
          gap: 5px;
        }
        .vesper-root .burger-bar {
          width: 16px;
          height: 1.5px;
          background: #ffffff;
          border-radius: 1px;
          transition: transform 0.25s ease, opacity 0.2s ease;
        }
        .vesper-root .burger:hover {
          border-color: rgba(255,255,255,0.32);
          background: rgba(255,255,255,0.05);
        }
        .vesper-root.menu-open .burger .burger-bar:nth-child(1) {
          transform: translateY(6.5px) rotate(45deg);
        }
        .vesper-root.menu-open .burger .burger-bar:nth-child(2) {
          opacity: 0;
        }
        .vesper-root.menu-open .burger .burger-bar:nth-child(3) {
          transform: translateY(-6.5px) rotate(-45deg);
        }

        .vesper-root .menu-backdrop {
          display: none;
        }

        /* Hero (bottom-centered, NOT vertically centered) */
        .vesper-root .hero {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 8px 24px var(--hero-gap);
          min-height: 0;
          position: relative;
          z-index: 10;
        }

        .vesper-root .hero-copy {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: var(--copy-max);
          width: 100%;
        }

        /* Badge */
        .vesper-root .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 22px;
          padding: 9px 15px;
          border: 0;
          border-radius: 5px;
          background: linear-gradient(90deg, #7d7d7d 0%, #2a2a2a 52%, #0a0a0a 100%);
          color: #f2f2f2;
          font-size: var(--badge);
          font-weight: 400;
          letter-spacing: -0.01em;
        }
        .vesper-root .badge-star {
          filter: drop-shadow(0 0 3px rgba(255,255,255,0.45));
          animation: in-star 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.28s both;
        }

        /* H1 */
        .vesper-root .headline {
          font-size: var(--h1);
          font-weight: 500;
          letter-spacing: -0.045em;
          line-height: 1.12;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .vesper-root .headline-line {
          display: block;
          overflow: hidden;
          padding: 0.06em 0.15em 0.14em;
        }
        .vesper-root .headline em {
          font-family: "Instrument Serif", "Times New Roman", Times, serif;
          font-style: italic;
          font-weight: 400;
          font-size: 1.08em;
          letter-spacing: -0.03em;
          color: #9a9a9a;
          display: inline-block;
          animation: in-em 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.72s both;
        }

        /* Lede */
        .vesper-root .lede {
          max-width: var(--lede-max);
          margin-top: 18px;
          color: #9a9a9a;
          font-size: var(--lede);
          font-weight: 400;
          line-height: 1.55;
          letter-spacing: -0.015em;
        }

        /* Hero Actions */
        .vesper-root .hero-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-top: 26px;
        }

        /* Stats Footer */
        .vesper-root .stats {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 0 var(--stats-x) var(--stats-y);
          padding-bottom: max(var(--stats-y), env(safe-area-inset-bottom));
          color: #d8d8d8;
          z-index: 10;
          position: relative;
        }

        .vesper-root .stat {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          font-size: var(--stat-size);
          letter-spacing: -0.015em;
          white-space: nowrap;
        }

        .vesper-root .stat-icon {
          width: 20px;
          height: 20px;
          color: #e8e8e8;
          flex-shrink: 0;
        }
        .vesper-root .stat-icon-wide {
          width: 38px;
          height: 21px;
          flex-shrink: 0;
        }

        /* Entrance Animations */
        @keyframes in-scale {
          0% { opacity: 0; transform: scale(0.84); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes in-soft {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes in-mask {
          0% { opacity: 0; transform: translateY(40%); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes in-pop {
          0% { opacity: 0; transform: scale(0.9); }
          70% { transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes in-btn {
          0% { opacity: 0; transform: translateY(18px) scale(0.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes in-side {
          0% { opacity: 0; transform: translateX(22px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes in-stat {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes in-star {
          0% { transform: scale(0.2) rotate(-50deg); opacity: 0; }
          65% { transform: scale(1.2) rotate(8deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes in-em {
          0% { opacity: 0.35; filter: blur(4px); }
          100% { opacity: 1; filter: blur(0); }
        }

        /* Cinematic Exit Motion Sequence */
        .vesper-root.exiting {
          pointer-events: none;
          animation: vesperZoomThrough 0.78s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes vesperZoomThrough {
          0% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
          }
          40% {
            opacity: 0.95;
            filter: blur(3px);
          }
          100% {
            opacity: 0;
            transform: scale(1.1);
            filter: blur(14px);
          }
        }

        .vesper-root.exiting .header {
          transform: translateY(-40px);
          opacity: 0;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }
        .vesper-root.exiting .hero-copy {
          transform: translateY(-35px) scale(0.96);
          opacity: 0;
          transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;
        }
        .vesper-root.exiting .stats {
          transform: translateY(35px);
          opacity: 0;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }
        .vesper-root.exiting .hero-photo {
          transform: scale(1.15);
          filter: brightness(1.25) blur(8px);
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s ease;
        }
        .vesper-root .exit-portal-flare {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 99;
          opacity: 0;
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.22) 0%, rgba(10, 132, 255, 0.15) 35%, transparent 70%);
          transform: scale(0.4);
          transition: transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;
        }
        .vesper-root.exiting .exit-portal-flare {
          opacity: 1;
          transform: scale(2.4);
        }

        .vesper-root .appear {
          opacity: 1;
          animation-duration: 1.05s;
          animation-fill-mode: both;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          animation-delay: var(--d, 0.08s);
        }
        .vesper-root .appear.appear--scale { animation-name: in-scale; }
        .vesper-root .appear.appear--soft { animation-name: in-soft; }
        .vesper-root .appear.appear--mask { animation-name: in-mask; }
        .vesper-root .appear.appear--pop { animation-name: in-pop; }
        .vesper-root .appear.appear--btn { animation-name: in-btn; }
        .vesper-root .appear.appear--side { animation-name: in-side; }
        .vesper-root .appear.appear--stat { animation-name: in-stat; }

        .vesper-root .appear.is-in,
        .vesper-root .hero-photo.is-in {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
          clip-path: none !important;
          filter: none !important;
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .vesper-root *, .vesper-root *::before, .vesper-root *::after {
            transition: none !important;
            animation: none !important;
          }
          .vesper-root .appear,
          .vesper-root .hero-photo,
          .vesper-root .hero h1 em,
          .vesper-root .badge-star {
            opacity: 1 !important;
            transform: none !important;
            clip-path: none !important;
            filter: none !important;
          }
        }

        /* Breakpoints */
        @media (min-width: 1280px) and (max-width: 1599px) {
          .vesper-root {
            --h1: 54px;
            --lede: 16px;
            --header-x: 48px;
            --stats-x: 80px;
            --copy-max: 900px;
          }
        }

        @media (min-width: 1600px) {
          .vesper-root {
            --logo: 17px;
            --logo-mark: 24px;
            --nav: 15px;
            --nav-h: 44px;
            --btn: 15px;
            --btn-h: 44px;
            --hero-btn-h: 48px;
            --h1: 64px;
            --lede: 18px;
            --badge: 13.5px;
            --stat-size: 15px;
            --header-y: 28px;
            --header-x: 64px;
            --stats-x: 96px;
            --stats-y: 44px;
            --copy-max: 980px;
            --lede-max: 540px;
          }
          .vesper-root .nav-pill { padding: 0 20px; }
          .vesper-root .badge { margin-bottom: 26px; }
          .vesper-root .lede { margin-top: 22px; }
          .vesper-root .hero-actions { margin-top: 30px; gap: 12px; }
          .vesper-root .stat-icon { width: 22px; height: 22px; }
          .vesper-root .stat-icon-wide { width: 45px; height: 24px; }
        }

        @media (min-width: 1920px) {
          .vesper-root {
            --logo: 18px;
            --logo-mark: 26px;
            --nav: 16px;
            --nav-h: 48px;
            --btn: 16px;
            --btn-h: 48px;
            --hero-btn-h: 52px;
            --h1: 76px;
            --lede: 20px;
            --badge: 14.5px;
            --stat-size: 16px;
            --header-y: 32px;
            --header-x: 80px;
            --stats-x: 120px;
            --stats-y: 52px;
            --copy-max: 1120px;
            --lede-max: 620px;
          }
          .vesper-root #site-nav { gap: 10px; }
          .vesper-root .nav-pill { padding: 0 22px; }
          .vesper-root .btn { padding: 0 22px; }
          .vesper-root .badge { padding: 10px 15px; }
          .vesper-root .stat-icon-wide { width: 48px; height: 26px; }
        }

        @media (min-width: 2560px) {
          .vesper-root {
            --h1: 88px;
            --lede: 22px;
            --header-x: 120px;
            --stats-x: 160px;
            --copy-max: 1280px;
            --lede-max: 680px;
          }
        }

        @media (min-width: 901px) and (max-width: 1279px) {
          .vesper-root {
            --logo: 15px;
            --nav: 13px;
            --nav-h: 36px;
            --btn: 13px;
            --btn-h: 38px;
            --hero-btn-h: 40px;
            --h1: 42px;
            --lede: 15px;
            --badge: 12px;
            --stat-size: 12.5px;
            --header-y: 16px;
            --header-x: 28px;
            --stats-x: 36px;
            --stats-y: 28px;
            --hero-gap: 64px;
            --copy-max: 760px;
            --lede-max: 440px;
          }
          .vesper-root .nav-pill { padding: 0 14px; }
          .vesper-root .badge { margin-bottom: 16px; }
          .vesper-root .lede { margin-top: 14px; }
          .vesper-root .hero-actions { margin-top: 20px; }
        }

        @media (min-width: 901px) and (max-height: 850px) {
          .vesper-root {
            --header-y: 14px;
            --stats-y: 24px;
            --hero-gap: 48px;
            --h1: 40px;
          }
          .vesper-root .badge { margin-bottom: 12px; }
          .vesper-root .lede { margin-top: 12px; }
          .vesper-root .hero-actions { margin-top: 16px; }
        }

        @media (min-width: 901px) and (max-height: 720px) {
          .vesper-root {
            --h1: 34px;
            --lede: 14px;
            --hero-gap: 32px;
            --stats-y: 18px;
            --nav-h: 30px;
            --btn-h: 34px;
            --hero-btn-h: 36px;
          }
          .vesper-root .badge { margin-bottom: 8px; }
        }

        /* Desktop lock: no scroll */
        @media (min-width: 901px) {
          .vesper-root {
            height: 100%;
            overflow: hidden;
          }
          .vesper-root .page {
            height: 100vh;
            height: 100dvh;
            overflow: hidden;
          }
        }

        /* Phone: <= 900px */
        @media (max-width: 900px) {
          .vesper-root {
            height: auto;
            overflow-y: auto;
            --logo: 16px;
            --btn: 15px;
            --btn-h: 46px;
            --hero-btn-h: 48px;
            --h1: 36px;
            --lede: 16.5px;
            --badge: 13.5px;
            --stat-size: 15px;
            --header-y: 16px;
            --header-x: 18px;
            --stats-x: 20px;
            --stats-y: 28px;
            --hero-gap: 36px;
          }
          .vesper-root .page {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 100vh;
            min-height: 100dvh;
            height: auto;
          }
          .vesper-root .header {
            grid-template-columns: 1fr auto auto;
            gap: 8px;
            padding: var(--header-y) var(--header-x) 10px;
            padding-top: max(var(--header-y), env(safe-area-inset-top));
          }
          .vesper-root .logo,
          .vesper-root .header-cta,
          .vesper-root .burger {
            z-index: 80;
          }
          .vesper-root .burger {
            display: grid;
          }

          /* Fullscreen menu backdrop */
          .vesper-root .menu-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 40;
            background: rgba(8,8,8,0.42);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.28s ease, visibility 0.28s ease;
          }
          .vesper-root.menu-open .menu-backdrop {
            opacity: 1;
            visibility: visible;
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }

          /* Nav in mobile drawer */
          .vesper-root #site-nav {
            position: fixed;
            inset: 0;
            z-index: 45;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            gap: 12px;
            padding: 96px 22px 32px;
            padding-top: max(96px, calc(env(safe-area-inset-top) + 88px));
            background: transparent;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.28s ease;
          }
          .vesper-root.menu-open #site-nav {
            opacity: 1;
            pointer-events: auto;
          }
          .vesper-root .nav-pill {
            width: 100%;
            height: 56px;
            font-size: 19px;
            border-radius: 10px;
          }

          .vesper-root .hero {
            padding: 20px 20px 64px;
            align-items: flex-end;
          }
          .vesper-root .stats {
            flex-direction: column;
            align-items: center;
            gap: 16px;
            white-space: normal;
            padding-bottom: max(var(--stats-y), env(safe-area-inset-bottom));
          }
          .vesper-root .stat {
            white-space: normal;
            text-align: center;
          }
        }

        @media (max-width: 560px) {
          .vesper-root {
            --h1: clamp(24px, 7.2vw, 32px);
            --lede: clamp(13px, 3.6vw, 15px);
            --header-x: 14px;
            --header-y: 12px;
            --btn-h: 44px;
            --hero-btn-h: 44px;
          }
          .vesper-root .hero {
            padding: 16px 16px 40px;
          }
          .vesper-root .hero-actions {
            flex-direction: column;
            width: 100%;
            gap: 8px;
          }
          .vesper-root .hero-actions .btn {
            width: 100%;
            height: 44px;
            font-size: 13.5px;
          }
          .vesper-root .grain {
            display: none !important;
          }
        }
      `}</style>

      {/* Layer 4: Grain at z-index 100 */}
      <div className="grain" />

      {/* Cinematic Portal Transition Flare */}
      <div className="exit-portal-flare" />

      {/* Layer 2: Hero photo / video background + scrim */}
      <div className="hero-photo">
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>

      {/* Layer 3: Page container */}
      <div className="page">
        {/* Mobile menu backdrop */}
        <div
          className="menu-backdrop"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Header — 3-column grid */}
        <header className="header">
          {/* Left — logo */}
          <a
            href="#top"
            className="logo appear appear--scale"
            style={{ ['--d' as any]: '0.08s' }}
            aria-label="Vesper.ai"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="logo-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <g transform="rotate(-30 12 12)">
                  <circle cx="7.3" cy="3.2" r="1.45" />
                  <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
                  <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
                  <circle cx="16.7" cy="20.8" r="1.45" />
                </g>
              </svg>
            </span>
            <span>
              Vesper<span className="logo-suffix">.ai</span>
            </span>
          </a>

          {/* Center — nav */}
          <nav id="site-nav" aria-label="Navigasi Utama">
            <a
              href="#keunggulan"
              className="nav-pill appear appear--scale"
              style={{ ['--d' as any]: '0.16s' }}
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
              }}
            >
              Keunggulan
            </a>
            <a
              href="#cara-kerja"
              className="nav-pill appear appear--soft"
              style={{ ['--d' as any]: '0.28s' }}
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
              }}
            >
              Cara Kerja
            </a>
            <a
              href="#faqs"
              className="nav-pill appear appear--scale"
              style={{ ['--d' as any]: '0.40s' }}
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
              }}
            >
              Tanya Jawab
            </a>
            <a
              href="#harga"
              className="nav-pill appear appear--soft"
              style={{ ['--d' as any]: '0.52s' }}
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
              }}
            >
              Harga
            </a>
          </nav>

          {/* Right — header CTA + burger */}
          <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href="#start"
              className="btn btn-solid header-cta appear appear--scale"
              style={{ ['--d' as any]: '0.34s' }}
              onClick={handleAction}
            >
              Login as Google
            </a>

            <button
              type="button"
              className="burger"
              aria-controls="site-nav"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="burger-bar" />
              <span className="burger-bar" />
              <span className="burger-bar" />
            </button>
          </div>
        </header>

        {/* Main hero (bottom-centered) */}
        <main className="hero" id="top">
          <div className="hero-copy">
            {/* Badge */}
            <div
              className="badge appear appear--pop"
              style={{ ['--d' as any]: '0.22s' }}
            >
              <svg className="badge-star" width="16" height="16" viewBox="0 0 24 24" fill="white">
                <rect x="5.5" y="5.5" width="13" height="13" rx="2.5" transform="rotate(45 12 12)" fill="white" />
                <circle cx="12" cy="12" r="2.2" fill="#1c1c1e" />
              </svg>
              <span>Infrastruktur AI Operasional</span>
            </div>

            {/* H1 */}
            <h1 className="headline">
              <span
                className="headline-line appear appear--mask"
                style={{ ['--d' as any]: '0.42s' }}
              >
                Latih <em>agen AI</em> pada
              </span>
              <span
                className="headline-line appear appear--mask"
                style={{ ['--d' as any]: '0.62s' }}
              >
                alur kerja Anda dalam hitungan menit.
              </span>
            </h1>

            {/* Lede */}
            <p
              className="lede appear appear--soft"
              style={{ ['--d' as any]: '0.82s', animationDuration: '1.25s' }}
            >
              Deploy agen AI adaptif yang belajar, mengeksekusi, dan menskalakan tugas operasional di seluruh lini bisnis Anda.
            </p>

            {/* Actions */}
            <div className="hero-actions">
              <a
                href="#start"
                className="btn btn-solid hero-btn appear appear--btn"
                style={{ ['--d' as any]: '0.96s' }}
                onClick={handleAction}
              >
                Login as Google
              </a>
              <a
                href="#demo"
                className="btn btn-hero-ghost hero-btn appear appear--side"
                style={{ ['--d' as any]: '1.10s' }}
                onClick={handleAction}
              >
                Lihat Cara Kerja
              </a>
            </div>
          </div>
        </main>

        {/* Footer Stats */}
        <footer className="stats">
          {/* Stat 1 */}
          <div
            className="stat appear appear--stat"
            style={{ ['--d' as any]: '1.12s' }}
          >
            <svg className="stat-icon" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="v-pill1" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="38%" stopColor="#ffffff" stopOpacity="0.38" />
                  <stop offset="62%" stopColor="#3a3a3a" stopOpacity="0.62" />
                </linearGradient>
                <linearGradient id="v-pill2" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="38%" stopColor="#3a3a3a" stopOpacity="0.38" />
                  <stop offset="62%" stopColor="#ffffff" stopOpacity="0.62" />
                </linearGradient>
              </defs>
              <rect x="3.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#v-pill1)" />
              <rect x="13.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#v-pill2)" />
              <rect x="9.2" y="10.9" width="5.6" height="2.2" rx="1.1" fill="#4a4a4a" />
            </svg>
            <span>4.2M+ alur kerja terotomatisasi</span>
          </div>

          {/* Stat 2 */}
          <div
            className="stat appear appear--stat"
            style={{ ['--d' as any]: '1.28s' }}
          >
            <svg className="stat-icon" viewBox="0 0 24 24">
              <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="6.2" fill="#ffffff" />
              <path
                d="M12 7.1v7.4"
                stroke="#111"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.15 12.35L12 16.2l3.85-3.85"
                stroke="#111"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>92% pengurangan operasional manual</span>
          </div>

          {/* Stat 3 */}
          <div
            className="stat appear appear--stat"
            style={{ ['--d' as any]: '1.44s' }}
          >
            <svg className="stat-icon-wide" viewBox="0 0 40 22">
              {/* Avatar 1 */}
              <circle cx="10.2" cy="11" r="9.2" fill="#2b2b2b" />
              <ellipse cx="10.2" cy="12.1" rx="4.15" ry="3.7" fill="#f4f4f4" />
              <polygon points="7.2,5.2 8.6,8.2 6.8,8.2" fill="#2b2b2b" />
              <polygon points="13.2,5.2 11.8,8.2 13.6,8.2" fill="#2b2b2b" />
              <circle cx="9" cy="11.4" r="0.7" fill="#1a1a1a" />
              <circle cx="11.4" cy="11.4" r="0.7" fill="#1a1a1a" />

              {/* Avatar 2 */}
              <circle cx="20.2" cy="11" r="9.2" fill="#ffffff" />
              <circle cx="17.8" cy="9.8" r="1.7" fill="#111" />
              <circle cx="22.6" cy="9.8" r="1.7" fill="#111" />
              <ellipse cx="20.2" cy="12.2" rx="1.2" ry="0.9" fill="#111" />
              <path
                d="M18.4 14.2c.9 1 2.7 1 3.6 0"
                stroke="#111"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Avatar 3 */}
              <circle cx="30.2" cy="11" r="9.2" fill="#f26b1d" />
              <text
                x="30.2"
                y="15.1"
                fontSize="12.5"
                fontFamily="'Inter', sans-serif"
                fontWeight="700"
                textAnchor="middle"
                fill="#ffffff"
              >
                e
              </text>
            </svg>
            <span>180+ tim operasional terintegrasi</span>
          </div>
        </footer>
      </div>

      {/* Mandatory Google Sign In Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultEmail={userEmail}
        onUpdateApiKey={onUpdateApiKey}
      />
    </div>
  );
};
