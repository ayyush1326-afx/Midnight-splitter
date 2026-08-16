import React, { useState } from 'react';
import { X, Rocket, ShieldCheck, Check, ExternalLink, Loader2, Cpu, Sparkles, Terminal } from 'lucide-react';
import { deployContractWithLace, DeployContractResult, shortenAddress } from '../services/midnightContract';
import { sounds } from '../services/soundEffects';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploySuccess?: (result: DeployContractResult) => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({
  isOpen,
  onClose,
  onDeploySuccess,
}) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [deployResult, setDeployResult] = useState<DeployContractResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartDeploy = async () => {
    sounds.playClick();
    setIsDeploying(true);
    setErrorMsg(null);
    setDeployResult(null);

    try {
      const result = await deployContractWithLace((step, percent) => {
        setProgressStep(step);
        setProgressPercent(percent);
      });

      setDeployResult(result);
      setIsDeploying(false);
      sounds.playSuccess();
      onDeploySuccess?.(result);
    } catch (err: any) {
      setIsDeploying(false);
      setErrorMsg(err?.message || 'Failed to deploy contract via Lace Wallet');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,8,17,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div
        className="glass-panel animate-in w-full max-w-xl flex flex-col gap-5"
        style={{ padding: '28px 32px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(16,185,129,0.15)] text-[#10b981]">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: 'var(--text-1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span>Deploy via Lace Wallet</span>
                <span className="badge badge-emerald">Midnight Preprod</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '2px' }}>
                Deploy MidnightSplitter Compact contract using your connected Lace Wallet
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

        {/* Contract Info Card */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            background: '#080d1a',
            border: '1px solid var(--border-soft)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-3)' }}>Contract Name:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
              MidnightSplitter
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-3)' }}>Compiler Version:</span>
            <span style={{ fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>
              compactc v0.31.1 (DSL &gt;= 0.23)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-3)' }}>Target Network:</span>
            <span style={{ fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              Midnight Preprod Testnet
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-3)' }}>Proving System:</span>
            <span style={{ fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
              Halo2 IPA Zero-Knowledge Enclave
            </span>
          </div>
        </div>

        {/* Deploying Progress State */}
        {isDeploying && (
          <div
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Loader2 style={{ width: '18px', height: '18px', color: 'var(--emerald)' }} className="animate-spin" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--emerald)' }}>
                  {progressStep}
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                {progressPercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(16,185,129,0.15)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'var(--emerald)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444',
              fontSize: '0.78rem',
            }}
          >
            <strong>Deployment Error:</strong> {errorMsg}
          </div>
        )}

        {/* Success Result Card */}
        {deployResult && (
          <div
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles style={{ width: '20px', height: '20px', color: 'var(--emerald)' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-display)' }}>
                Contract Successfully Deployed to Midnight Preprod!
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-3)' }}>Contract Address:</span>
                <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>
                  {shortenAddress(deployResult.contractAddress, 8)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-3)' }}>Tx Hash:</span>
                <span style={{ color: 'var(--purple)' }}>{shortenAddress(deployResult.txHash, 8)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-3)' }}>Block Height:</span>
                <span style={{ color: 'var(--gold)' }}>#{deployResult.blockHeight.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.73rem', color: '#fbbf24', lineHeight: 1.5 }}>
              💡 <strong>Explorer Note:</strong> On-chain indexing on Midnight Preprod takes ~30-60s after block inclusion. If using demo/simulated mode without a funded Lace Wallet, the public explorer returns 404 until a transaction is mined by Preprod nodes.
            </div>

            <a
              href={deployResult.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-emerald"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', textDecoration: 'none', padding: '10px 16px', fontSize: '0.82rem' }}
            >
              <span>View on Midnight Preprod Explorer</span>
              <ExternalLink style={{ width: '14px', height: '14px' }} />
            </a>
          </div>
        )}

        {/* Action Controls */}
        {!deployResult && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="btn-ghost"
              style={{ flex: 1 }}
              disabled={isDeploying}
            >
              Cancel
            </button>
            <button
              onClick={handleStartDeploy}
              disabled={isDeploying}
              className="btn-emerald"
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isDeploying ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Rocket style={{ width: '16px', height: '16px' }} />
                  <span>Deploy via Lace Wallet</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
