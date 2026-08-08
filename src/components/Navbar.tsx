import React from 'react';
import {
  Coins,
  Wallet,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  CheckCircle2,
  Loader2,
  SplitSquareHorizontal,
  Wrench,
  History,
  Sparkles,
} from 'lucide-react';
import { shortenAddress } from '../services/stellar';
import { sounds } from '../services/soundEffects';
import { WalletProvider } from '../types';

export type ActivePage = 'split' | 'tools';

interface NavbarProps {
  activePage: ActivePage;
  onChangePage: (page: ActivePage) => void;
  walletAddress: string;
  walletProvider?: WalletProvider;
  isWalletConnected: boolean;
  walletBalance: string;
  isConnecting: boolean;
  onConnectWallet: (provider?: WalletProvider) => void;
  onDisconnectWallet: () => void;
  onOpenFaucet: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  historyCount: number;
  isLightTheme: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onChangePage,
  walletAddress,
  walletProvider = 'lace',
  isWalletConnected,
  walletBalance,
  isConnecting,
  onConnectWallet,
  onDisconnectWallet,
  onOpenFaucet,
  soundEnabled,
  onToggleSound,
  historyCount,
  isLightTheme,
  onToggleTheme,
}) => {

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: 'var(--bg-overlay)',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between"
        style={{ height: '68px', gap: '16px' }}
      >
        {/* ── Brand ── */}
        <div
          className="flex items-center gap-3 shrink-0 cursor-pointer select-none"
          onClick={() => sounds.playClick()}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--cyan) 0%, var(--purple) 100%)',
            }}
          >
            <Coins className="w-4 h-4" style={{ color: '#04080f' }} />
          </div>
          <div className="flex flex-col" style={{ lineHeight: 1.2 }}>
            <span
              className="font-extrabold tracking-tight"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                color: 'var(--text-1)',
              }}
            >
              MIDNIGHT{' '}
              <span style={{ color: 'var(--cyan)' }}>SPLITTER</span>
            </span>
            <span
              className="section-label"
              style={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}
            >
              SOROBAN · STELLAR
            </span>
          </div>
        </div>

        {/* ── Tab Navigation (center) ── */}
        <nav className="tab-nav" style={{ flex: '0 0 auto' }}>
          <button
            className={`tab-btn ${activePage === 'split' ? 'active' : ''}`}
            onClick={() => {
              sounds.playClick();
              onChangePage('split');
            }}
          >
            <SplitSquareHorizontal
              style={{
                width: '15px',
                height: '15px',
                color: activePage === 'split' ? 'var(--cyan)' : 'var(--text-3)',
              }}
            />
            <span>Split</span>
          </button>
          <button
            className={`tab-btn ${activePage === 'tools' ? 'active' : ''}`}
            onClick={() => {
              sounds.playClick();
              onChangePage('tools');
            }}
            style={{ position: 'relative' }}
          >
            <Wrench
              style={{
                width: '15px',
                height: '15px',
                color: activePage === 'tools' ? 'var(--cyan)' : 'var(--text-3)',
              }}
            />
            <span>Tools</span>
            {historyCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-2px',
                  width: '16px',
                  height: '16px',
                  background: 'var(--cyan)',
                  color: '#04080f',
                  borderRadius: '50%',
                  fontSize: '9px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* ── Right Controls ── */}
        <div className="flex items-center" style={{ gap: '8px' }}>
          {/* Faucet — desktop only */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenFaucet();
            }}
            className="lg:inline-flex items-center gap-1.5 btn-ghost"
            style={{
              display: 'none',
              fontSize: '0.78rem',
              padding: '7px 12px',
              background: 'var(--gold-dim)',
              borderColor: 'rgba(245,158,11,0.25)',
              color: 'var(--gold)',
            }}
            title="Testnet Faucet: +1,000 XLM"
          >
            <Sparkles style={{ width: '13px', height: '13px' }} />
            <span>+1,000 XLM</span>
          </button>
          {/* Faucet — always visible via CSS on lg */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenFaucet();
            }}
            className="btn-ghost shrink-0"
            style={{
              fontSize: '0.78rem',
              padding: '7px 12px',
              background: 'var(--gold-dim)',
              borderColor: 'rgba(245,158,11,0.25)',
              color: 'var(--gold)',
            }}
            title="Testnet Faucet: +1,000 XLM"
          >
            <Sparkles style={{ width: '13px', height: '13px' }} />
            <span className="sm:inline" style={{ display: 'none' }}>+1,000 XLM</span>
          </button>

          {/* History badge shortcut */}
          {historyCount > 0 && (
            <button
              className="btn-ghost shrink-0"
              onClick={() => {
                sounds.playClick();
                onChangePage('tools');
              }}
              title={`${historyCount} split${historyCount > 1 ? 's' : ''} in history`}
              style={{ padding: '7px 12px', gap: '6px' }}
            >
              <History style={{ width: '14px', height: '14px', color: 'var(--gold)' }} />
              <span
                style={{
                  background: 'var(--gold)',
                  color: '#04080f',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 6px',
                }}
              >
                {historyCount}
              </span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            className="btn-ghost shrink-0"
            onClick={() => {
              sounds.playClick();
              onToggleSound();
            }}
            title={soundEnabled ? 'Mute sound FX' : 'Enable sound FX'}
            style={{ padding: '8px' }}
          >
            {soundEnabled ? (
              <Volume2 style={{ width: '15px', height: '15px', color: 'var(--cyan)' }} />
            ) : (
              <VolumeX style={{ width: '15px', height: '15px', color: 'var(--text-3)' }} />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            className="btn-ghost shrink-0"
            onClick={() => {
              sounds.playClick();
              onToggleTheme();
            }}
            title={isLightTheme ? 'Dark mode' : 'Light mode'}
            style={{ padding: '8px' }}
          >
            {isLightTheme ? (
              <Moon style={{ width: '15px', height: '15px', color: 'var(--purple)' }} />
            ) : (
              <Sun style={{ width: '15px', height: '15px', color: 'var(--gold)' }} />
            )}
          </button>

          {/* Wallet */}
          {isWalletConnected ? (
            <div
              className="flex items-center"
              style={{
                gap: '10px',
                paddingLeft: '10px',
                borderLeft: '1px solid var(--border-soft)',
                marginLeft: '4px',
              }}
            >
              <div
                className="md:flex flex-col items-end"
                style={{ display: 'none', lineHeight: 1.3 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      color: walletProvider === 'lace' ? 'var(--purple)' : 'var(--cyan)',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {walletProvider === 'lace' ? 'Lace (CIP-30)' : 'Freighter'}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {walletBalance} {walletProvider === 'lace' ? 'tDUST' : 'XLM'}
                </span>
              </div>
              <button
                onClick={onDisconnectWallet}
                title="Disconnect wallet"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 12px',
                  background: walletProvider === 'lace' ? 'rgba(139, 92, 246, 0.15)' : 'var(--emerald-dim)',
                  border: `1px solid ${walletProvider === 'lace' ? 'rgba(139, 92, 246, 0.35)' : 'rgba(16,185,129,0.25)'}`,
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget;
                  btn.style.background = 'var(--rose-dim)';
                  btn.style.borderColor = 'rgba(244,63,94,0.35)';
                  const textEl = btn.querySelector('.wallet-addr');
                  if (textEl) {
                    textEl.textContent = 'Disconnect';
                    (textEl as HTMLElement).style.color = 'var(--rose)';
                  }
                  const dotEl = btn.querySelector('.wallet-dot');
                  if (dotEl) (dotEl as HTMLElement).style.background = 'var(--rose)';
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.background = walletProvider === 'lace' ? 'rgba(139, 92, 246, 0.15)' : 'var(--emerald-dim)';
                  btn.style.borderColor = walletProvider === 'lace' ? 'rgba(139, 92, 246, 0.35)' : 'rgba(16,185,129,0.25)';
                  const textEl = btn.querySelector('.wallet-addr');
                  if (textEl) {
                    textEl.textContent = shortenAddress(walletAddress, 3);
                    (textEl as HTMLElement).style.color = walletProvider === 'lace' ? 'var(--purple)' : 'var(--emerald)';
                  }
                  const dotEl = btn.querySelector('.wallet-dot');
                  if (dotEl) (dotEl as HTMLElement).style.background = walletProvider === 'lace' ? 'var(--purple)' : 'var(--emerald)';
                }}
              >
                <span
                  className="pulse-dot wallet-dot"
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: walletProvider === 'lace' ? 'var(--purple)' : 'var(--emerald)',
                    flexShrink: 0,
                    display: 'block',
                    transition: 'background 0.2s ease',
                  }}
                />
                <span
                  className="wallet-addr"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: walletProvider === 'lace' ? 'var(--purple)' : 'var(--emerald)',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {shortenAddress(walletAddress, 3)}
                </span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => {
                  sounds.playClick();
                  onConnectWallet('lace');
                }}
                disabled={isConnecting}
                className="btn-primary shrink-0"
                style={{
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  background: 'linear-gradient(135deg, var(--purple) 0%, #7c3aed 100%)',
                }}
                title="Connect Lace Wallet (Midnight Preprod CIP-30)"
              >
                {isConnecting ? (
                  <Loader2 style={{ width: '13px', height: '13px' }} className="animate-spin" />
                ) : (
                  <Wallet style={{ width: '13px', height: '13px' }} />
                )}
                <span>{isConnecting ? 'Connecting…' : 'Connect Lace'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
