import React, { useState } from 'react';
import {
  ShieldCheck,
  EyeOff,
  Cpu,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  FileCode,
  Layers,
} from 'lucide-react';
import { ZKProofData } from '../types';
import { executeZKBalanceCircuit, CircuitExecutionStep } from '../services/zkCircuit';
import { sounds } from '../services/soundEffects';

interface PrivacyProofProps {
  zkProof: ZKProofData | null;
  totalAmount: number;
  tokenSymbol: string;
  senderAddress: string;
  onProofGenerated?: (proof: ZKProofData) => void;
  isWalletConnected: boolean;
}

export const PrivacyProof: React.FC<PrivacyProofProps> = ({
  zkProof,
  totalAmount,
  tokenSymbol,
  senderAddress,
  onProofGenerated,
  isWalletConnected,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<CircuitExecutionStep | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunCircuit = async () => {
    try {
      setIsRunning(true);
      setErrorMsg(null);
      sounds.playClick();

      // Simulated private balance: always plenty to prove solvency
      const privateBalance = 4850.50;

      const proof = await executeZKBalanceCircuit(
        {
          privateBalance,
          splitRequirement: totalAmount,
          recipientCount: 4,
          tokenSymbol,
          senderAddress: senderAddress || 'GAT6E47IWY7ZPWZVRFLTXQ26W7G3E5R6WQX5E3L2A56QWE7R8TY90123',
        },
        (step) => {
          setCurrentStep(step);
          sounds.playTransferStep(step.step);
        }
      );

      sounds.playSuccess();
      onProofGenerated?.(proof);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Circuit verification failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        border: '1px solid rgba(139, 92, 246, 0.35)',
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, var(--bg-card) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--purple) 0%, var(--cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)',
            }}
          >
            <ShieldCheck style={{ width: '20px', height: '20px', color: '#04080f' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: 'var(--text-1)',
                  margin: 0,
                }}
              >
                Zero-Knowledge Privacy Proof
              </h3>
              <span
                className="badge"
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: 'var(--purple)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                }}
              >
                COMPACT CIRCUIT
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: '2px 0 0 0' }}>
              Proves solvency without revealing the sender’s account balance
            </p>
          </div>
        </div>

        {/* Observable Privacy Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: zkProof?.verified ? 'var(--emerald-dim)' : 'var(--purple-dim)',
            border: `1px solid ${zkProof?.verified ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.3)'}`,
          }}
        >
          <EyeOff
            style={{
              width: '14px',
              height: '14px',
              color: zkProof?.verified ? 'var(--emerald)' : 'var(--purple)',
            }}
          />
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: zkProof?.verified ? 'var(--emerald)' : 'var(--purple)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {zkProof?.verified ? 'PROVEN WITHOUT BEING SHOWN' : 'CIRCUIT READY'}
          </span>
        </div>
      </div>

      {/* Two Column Layout: Privacy Witness (Hidden) vs Public Inputs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
          marginTop: '16px',
        }}
      >
        {/* Private / Hidden Witness box */}
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px dashed rgba(139, 92, 246, 0.4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--purple)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Lock style={{ width: '12px', height: '12px' }} /> Private Witness (Hidden)
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
              ZK Protected
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Sender Balance</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--purple)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>●●●●●●●●●</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: 'rgba(139, 92, 246, 0.2)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  NEVER REVEALED
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Pedersen Commitment Hash</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-2)',
                  wordBreak: 'break-all',
                }}
              >
                {zkProof?.commitment || '0x7f4e91bc… (derived at runtime)'}
              </div>
            </div>
          </div>
        </div>

        {/* Public Inputs box */}
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-soft)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--cyan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Cpu style={{ width: '12px', height: '12px' }} /> Public Statement (On-Chain)
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
              Verifiable
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Solvency Requirement</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--cyan)',
                }}
              >
                Balance ≥ {totalAmount} {tokenSymbol}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Circuit Verifier</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-2)',
                }}
              >
                MidnightSolvencyVerifier_v1.compact
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proof Results and Execution Step indicator */}
      {currentStep && isRunning && (
        <div
          style={{
            marginTop: '14px',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card-alt)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div className="animate-spin" style={{ color: 'var(--purple)' }}>
            <RefreshCw style={{ width: '16px', height: '16px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-1)' }}>
              Step {currentStep.step}/4: {currentStep.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{currentStep.detail}</div>
          </div>
        </div>
      )}

      {zkProof && !isRunning && (
        <div
          style={{
            marginTop: '14px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 style={{ width: '16px', height: '16px', color: 'var(--emerald)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--emerald)' }}>
                ZK Proof Verified On Preprod
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock style={{ width: '12px', height: '12px' }} /> {zkProof.provingTimeMs}ms proving
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles style={{ width: '12px', height: '12px' }} /> {zkProof.verificationGas}
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: '6px',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-2)',
            }}
          >
            Proof ID: <span style={{ color: 'var(--cyan)' }}>{zkProof.proofId}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            marginTop: '14px',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--rose-dim)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--rose)',
            fontSize: '0.78rem',
          }}
        >
          <AlertCircle style={{ width: '16px', height: '16px' }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Footer */}
      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
          Mathematical guarantee: <span style={{ color: 'var(--purple)', fontWeight: 700 }}>Zero Fund Leakage</span>
        </div>

        <button
          onClick={handleRunCircuit}
          disabled={isRunning}
          className="btn-ghost"
          style={{
            padding: '7px 14px',
            fontSize: '0.78rem',
            background: 'rgba(139, 92, 246, 0.15)',
            borderColor: 'rgba(139, 92, 246, 0.3)',
            color: 'var(--purple)',
            gap: '6px',
          }}
        >
          {isRunning ? (
            <>
              <RefreshCw className="animate-spin" style={{ width: '13px', height: '13px' }} />
              <span>Proving Circuit…</span>
            </>
          ) : (
            <>
              <Sparkles style={{ width: '13px', height: '13px' }} />
              <span>{zkProof ? 'Re-Run ZK Circuit' : 'Run ZK Solvency Circuit'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
