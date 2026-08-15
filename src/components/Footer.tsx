import React from 'react';
import { ShieldCheck, ExternalLink, Globe, Coins, GitBranch, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-soft)',
        background: 'var(--bg-surface)',
        marginTop: '60px',
      }}
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{
          padding: '20px 2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Coins style={{ width: '14px', height: '14px', color: 'var(--purple)' }} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: 'var(--text-1)',
                letterSpacing: '-0.01em',
              }}
            >
              MIDNIGHT SPLITTER
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              className="pulse-dot"
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Midnight Preprod Live</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Zap style={{ width: '12px', height: '12px', color: 'var(--purple)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Compact DSL v0.1.0 · Midnight CLI</span>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#10b981',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <ShieldCheck style={{ width: '10px', height: '10px' }} />
            Zero Escrow Risk · ZK Privacy
          </span>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {[
            { href: 'https://docs.midnight.network', label: 'Midnight Docs', Icon: Globe },
            { href: 'https://midnight.network', label: 'Midnight Portal', Icon: ExternalLink },
            { href: 'https://github.com', label: 'GitHub', Icon: GitBranch },
          ].map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.75rem',
                color: 'var(--text-3)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-3)'; }}
            >
              <Icon style={{ width: '13px', height: '13px' }} />
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};
