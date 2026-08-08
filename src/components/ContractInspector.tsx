import React, { useState } from 'react';
import { X, Code2, Copy, Check, Terminal, ShieldAlert, Cpu, Layers } from 'lucide-react';
import { sounds } from '../services/soundEffects';

interface ContractInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const RUST_CONTRACT_CODE = `//! Midnight Splitter - Soroban Smart Contract
//! Atomic Multi-Recipient Token Distribution & Expense Splitting

#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum SplitterError {
    ZeroAmount = 1,
    EmptyRecipients = 2,
    AmountTooSmall = 3,
    MismatchedWeights = 4,
    InvalidWeightsSum = 5,
    InvalidPayoutAmount = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SplitSummary {
    pub total_amount: i128,
    pub total_transferred: i128,
    pub per_recipient_share: i128,
    pub dust: i128,
    pub recipient_count: u32,
}

#[contract]
pub struct MidnightSplitterContract;

#[contractimpl]
impl MidnightSplitterContract {
    /// Atomic equal split across N recipient wallets.
    /// Indivisible dust fractions stay safely in sender account.
    pub fn split_equal(
        env: Env,
        from: Address,
        token: Address,
        recipients: Vec<Address>,
        total_amount: i128,
    ) -> Result<SplitSummary, SplitterError> {
        from.require_auth();

        let recipient_count = recipients.len();
        if recipient_count == 0 {
            return Err(SplitterError::EmptyRecipients);
        }
        if total_amount <= 0 {
            return Err(SplitterError::ZeroAmount);
        }

        let count_i128 = recipient_count as i128;
        let per_recipient_share = total_amount / count_i128;
        if per_recipient_share == 0 {
            return Err(SplitterError::AmountTooSmall);
        }

        let client = token::Client::new(&env, &token);
        for recipient in recipients.iter() {
            client.transfer(&from, &recipient, &per_recipient_share);
        }

        let total_transferred = per_recipient_share * count_i128;
        let dust = total_amount - total_transferred;

        env.events().publish(
            (symbol_short!("split_eq"), from.clone(), token.clone()),
            (total_amount, per_recipient_share, dust, recipient_count),
        );

        Ok(SplitSummary {
            total_amount,
            total_transferred,
            per_recipient_share,
            dust,
            recipient_count,
        })
    }
}`;

export const ContractInspector: React.FC<ContractInspectorProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'rust' | 'abi' | 'atomicity'>('rust');

  if (!isOpen) return null;

  const handleCopy = () => {
    sounds.playClick();
    navigator.clipboard.writeText(RUST_CONTRACT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,8,17,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="glass-panel animate-in w-full max-w-3xl flex flex-col gap-5" style={{ padding: '28px 32px', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(0,242,254,0.12)] text-[#00f2fe]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>Soroban Smart Contract</span>
                <span className="badge badge-cyan">Rust SDK v27</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '2px' }}>
                Lightweight, stateless, non-custodial multi-transfer contract
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="btn-ghost"
            style={{ padding: '8px' }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-soft)', paddingBottom: '8px' }}>
          <button
            onClick={() => {
              sounds.playClick();
              setTab('rust');
            }}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
              background: tab === 'rust' ? 'var(--cyan)' : 'transparent',
              color: tab === 'rust' ? '#04080f' : 'var(--text-3)',
            }}
          >
            lib.rs (Rust Source)
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setTab('abi');
            }}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
              background: tab === 'abi' ? 'var(--purple)' : 'transparent',
              color: tab === 'abi' ? '#ffffff' : 'var(--text-3)',
            }}
          >
            Contract ABI Signatures
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setTab('atomicity');
            }}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
              background: tab === 'atomicity' ? 'var(--gold)' : 'transparent',
              color: tab === 'atomicity' ? '#04080f' : 'var(--text-3)',
            }}
          >
            Atomicity & Dust Model
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'rust' && (
          <div style={{ position: 'relative' }}>
            <pre style={{ padding: '16px', borderRadius: 'var(--radius-lg)', background: '#080d1a', border: '1px solid var(--border-soft)', fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: 'var(--cyan)', overflowX: 'auto', maxHeight: '380px', lineHeight: 1.7 }}>
              <code>{RUST_CONTRACT_CODE}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="btn-ghost"
              style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.72rem', padding: '5px 10px' }}
            >
              {copied ? <Check style={{ width: '13px', height: '13px', color: 'var(--emerald)' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        )}

        {tab === 'abi' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: '#080d1a', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyan)' }}>
                fn split_equal(env: Env, from: Address, token: Address, recipients: Vec&lt;Address&gt;, total_amount: i128) -&gt; SplitSummary
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                Divides total_amount evenly across all recipient wallets. Sender keeps any indivisible remainder dust.
              </p>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: '#080d1a', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--purple)' }}>
                fn split_weighted(env: Env, from: Address, token: Address, recipients: Vec&lt;Address&gt;, weights_bps: Vec&lt;u32&gt;, total_amount: i128) -&gt; SplitSummary
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                Transfers amounts according to basis points (10,000 bps = 100.00%). Validates exact 100% total weight.
              </p>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: '#080d1a', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)' }}>
                fn split_custom(env: Env, from: Address, token: Address, payouts: Vec&lt;Payout&gt;) -&gt; SplitSummary
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                Sends explicit token amounts to each recipient atomically in a single ledger transaction.
              </p>
            </div>
          </div>
        )}

        {tab === 'atomicity' && (
          <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: '#080d1a', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert style={{ width: '16px', height: '16px', color: 'var(--emerald)' }} />
              <span>Soroban All-or-Nothing Atomicity Guarantee</span>
            </h4>
            <p>
              In traditional multi-transfer scripts, if transfer #3 of 5 fails due to network spikes or invalid recipient state, the transaction halts halfway, leaving funds trapped or partially disbursed.
            </p>
            <p>
              With <strong style={{ color: '#ffffff' }}>Midnight Splitter</strong>, Soroban executes the entire loop inside an atomic transaction context. If any transfer fails, the entire transaction reverts automatically with zero state mutation and zero fund loss.
            </p>
            <div style={{ padding: '12px 14px', borderRadius: '6px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
              <strong>Dust Retention Rule:</strong> dust = total_amount % N. Indivisible decimal fractions remain safely in the sender's wallet instead of being burned or locked.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
