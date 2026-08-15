import React, { useState } from 'react';
import { X, Code2, Copy, Check, Terminal, ShieldAlert, Cpu, Layers } from 'lucide-react';
import { sounds } from '../services/soundEffects';

interface ContractInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMPACT_CONTRACT_CODE = `// ============================================================================
// Midnight Splitter - Native Privacy-Preserving Smart Contract
// Language: Compact DSL (Midnight Network)
// Compiler Target: compactc v0.1.0 / Midnight CLI
// ============================================================================

pragma compact 0.1.0;

import CompactStandardLibrary;

export struct SplitPreview {
  total_amount: Uint,
  per_recipient_share: Uint,
  total_transferred: Uint,
  dust: Uint,
  recipient_count: Uint
}

export struct SplitSummary {
  total_amount: Uint,
  total_transferred: Uint,
  per_recipient_share: Uint,
  dust: Uint,
  recipient_count: Uint,
  execution_timestamp: Uint
}

export struct Payout {
  recipient: Address,
  amount: Uint
}

// ----------------------------------------------------------------------------
// Ledger State (Public State exposed on Midnight Ledger)
// ----------------------------------------------------------------------------
export ledger contract_version: Uint;
export ledger total_splits_executed: Counter;
export ledger total_volume_settled: Counter;

// ----------------------------------------------------------------------------
// Pure Circuit Helper: Calculate Equal Split Shares & Dust
// ----------------------------------------------------------------------------
export circuit calculate_equal_split(
  total_amount: Uint,
  recipient_count: Uint
): SplitPreview {
  assert recipient_count > 0 "EmptyRecipients: Recipient count must be greater than zero";
  assert total_amount > 0 "ZeroAmount: Total amount must be greater than zero";

  let per_recipient_share: Uint = total_amount / recipient_count;
  assert per_recipient_share > 0 "AmountTooSmall: Split share rounds down to zero";

  let total_transferred: Uint = per_recipient_share * recipient_count;
  let dust: Uint = total_amount - total_transferred;

  return SplitPreview {
    total_amount: total_amount,
    per_recipient_share: per_recipient_share,
    total_transferred: total_transferred,
    dust: dust,
    recipient_count: recipient_count
  };
}

// ----------------------------------------------------------------------------
// Atomic Equal Split Execution Circuit (ZK Shielded Transfers)
// ----------------------------------------------------------------------------
export circuit split_equal(
  recipients: Vector<Address>,
  total_amount: Uint,
  solvency_commitment: Bytes<32>
): SplitSummary {
  let recipient_count: Uint = recipients.length();
  assert recipient_count > 0 "EmptyRecipients: At least one recipient required";
  assert total_amount > 0 "ZeroAmount: Total split amount must be positive";

  let per_recipient_share: Uint = total_amount / recipient_count;
  assert per_recipient_share > 0 "AmountTooSmall: Share is too small";

  let total_transferred: Uint = per_recipient_share * recipient_count;
  let dust: Uint = total_amount - total_transferred;

  for r in recipients {
    transfer_shielded(r, per_recipient_share);
  }

  total_splits_executed.increment(1);
  total_volume_settled.increment(total_transferred);

  return SplitSummary {
    total_amount: total_amount,
    total_transferred: total_transferred,
    per_recipient_share: per_recipient_share,
    dust: dust,
    recipient_count: recipient_count,
    execution_timestamp: ledger_timestamp()
  };
}`;

export const ContractInspector: React.FC<ContractInspectorProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'compact' | 'abi' | 'cli' | 'atomicity'>('compact');

  if (!isOpen) return null;

  const handleCopy = () => {
    sounds.playClick();
    navigator.clipboard.writeText(COMPACT_CONTRACT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,8,17,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="glass-panel animate-in w-full max-w-3xl flex flex-col gap-5" style={{ padding: '28px 32px', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(139,92,246,0.15)] text-[#a78bfa]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>Midnight Compact Contract</span>
                <span className="badge badge-purple">Compact DSL v0.1.0</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '2px' }}>
                Privacy-preserving ZK smart contract compiled with Midnight CLI
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
              setTab('compact');
            }}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
              background: tab === 'compact' ? 'var(--purple)' : 'transparent',
              color: tab === 'compact' ? '#ffffff' : 'var(--text-3)',
            }}
          >
            midnight_splitter.compact
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setTab('abi');
            }}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
              background: tab === 'abi' ? 'var(--cyan)' : 'transparent',
              color: tab === 'abi' ? '#04080f' : 'var(--text-3)',
            }}
          >
            Compact ABI & Circuits
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setTab('cli');
            }}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
              background: tab === 'cli' ? 'var(--emerald)' : 'transparent',
              color: tab === 'cli' ? '#04080f' : 'var(--text-3)',
            }}
          >
            Midnight CLI Workflow
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
            ZK Atomicity & Dust
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'compact' && (
          <div style={{ position: 'relative' }}>
            <pre style={{ padding: '16px', borderRadius: 'var(--radius-lg)', background: '#080d1a', border: '1px solid var(--border-soft)', fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: '#a78bfa', overflowX: 'auto', maxHeight: '380px', lineHeight: 1.7 }}>
              <code>{COMPACT_CONTRACT_CODE}</code>
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
                export circuit split_equal(recipients: Vector&lt;Address&gt;, total_amount: Uint, solvency_commitment: Bytes&lt;32&gt;): SplitSummary
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                Divides total_amount evenly across recipient shielded addresses in Midnight state context.
              </p>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: '#080d1a', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--purple)' }}>
                export circuit split_weighted(recipients: Vector&lt;Address&gt;, weights_bps: Vector&lt;Uint&gt;, total_amount: Uint, solvency_commitment: Bytes&lt;32&gt;): SplitSummary
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                Executes weighted split using basis points (10,000 bps = 100.00%) with ZK solvency assertion.
              </p>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: '#080d1a', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)' }}>
                export circuit split_custom(payouts: Vector&lt;Payout&gt;, solvency_commitment: Bytes&lt;32&gt;): SplitSummary
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                Distributes explicit token custom payouts atomically in a single ledger block.
              </p>
            </div>
          </div>
        )}

        {tab === 'cli' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-lg)', background: '#040810', border: '1px solid var(--border-soft)', fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: 'var(--emerald)' }}>
              <div style={{ color: 'var(--text-3)', marginBottom: '6px' }}># Compile Compact contract to TypeScript bindings & Proving Keys</div>
              <div>$ midnight-cli build --contract contracts/midnight_splitter.compact</div>
              
              <div style={{ color: 'var(--text-3)', marginTop: '12px', marginBottom: '6px' }}># Execute Compact circuit unit tests</div>
              <div>$ midnight-cli test</div>
              
              <div style={{ color: 'var(--text-3)', marginTop: '12px', marginBottom: '6px' }}># Deploy Compact smart contract to Midnight Preprod</div>
              <div>$ midnight-cli contract deploy --network preprod --config contracts/midnight-cli.json</div>
            </div>
          </div>
        )}

        {tab === 'atomicity' && (
          <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: '#080d1a', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert style={{ width: '16px', height: '16px', color: 'var(--emerald)' }} />
              <span>Midnight Compact All-or-Nothing Atomicity Guarantee</span>
            </h4>
            <p>
              In traditional multi-transfer scripts, if transfer #3 of 5 fails, the transaction halts halfway, leaving funds trapped or partially disbursed.
            </p>
            <p>
              With <strong style={{ color: '#ffffff' }}>Midnight Splitter</strong>, Compact executes the entire vector iteration inside an atomic state block. If any transfer fails, the entire transaction reverts automatically with zero state mutation and zero fund loss.
            </p>
            <div style={{ padding: '12px 14px', borderRadius: '6px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
              <strong>Dust Retention Rule:</strong> dust = total_amount % N. Indivisible decimal fractions remain safely in the sender's shielded wallet instead of being burned or locked.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
