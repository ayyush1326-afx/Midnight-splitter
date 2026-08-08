import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  SplitMode,
  TokenInfo,
  Recipient,
  SavedGroup,
  SplitReceipt,
  SimulationLog,
  WalletProvider,
  ZKProofData,
} from './types';
import {
  SUPPORTED_TOKENS,
  generateRandomStellarAddress,
  generateRandomMidnightAddress,
  isValidStellarAddress,
  isValidMultiChainAddress,
  connectFreighter,
  connectLace,
  checkFreighterAvailable,
  checkLaceAvailable,
  PRESET_GROUPS,
} from './services/stellar';
import { executeZKBalanceCircuit } from './services/zkCircuit';
import { sounds } from './services/soundEffects';

import { Navbar, ActivePage } from './components/Navbar';
import { SplitterCard } from './components/SplitterCard';
import { VisualBreakdown } from './components/VisualBreakdown';
import { PrivacyProof } from './components/PrivacyProof';
import { ToolsPage } from './components/ToolsPage';
import { BulkImportModal } from './components/BulkImportModal';
import { GroupsModal } from './components/GroupsModal';
import { ShareModal } from './components/ShareModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ContractInspector } from './components/ContractInspector';
import { HistoryDrawer } from './components/HistoryDrawer';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  // ── Page navigation ──
  const [activePage, setActivePage] = useState<ActivePage>('split');

  // ── Wallet ──
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletProvider, setWalletProvider] = useState<WalletProvider>('lace');
  const [walletBalance, setWalletBalance] = useState<string>('0.00');
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [zkProof, setZkProof] = useState<ZKProofData | null>(null);


  // ── Split Config ──
  const [mode, setMode] = useState<SplitMode>('equal');
  const [tokens] = useState<TokenInfo[]>(SUPPORTED_TOKENS);
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(SUPPORTED_TOKENS[0]);
  const [customTokenAddress, setCustomTokenAddress] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('240');
  const [tipPercent, setTipPercent] = useState<number>(0);

  // ── UI ──
  const [isLightTheme, setIsLightTheme] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // ── Modals ──
  const [isBulkOpen, setIsBulkOpen] = useState<boolean>(false);
  const [isGroupsOpen, setIsGroupsOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // ── Data ──
  const [activeReceipt, setActiveReceipt] = useState<SplitReceipt | null>(null);
  const [history, setHistory] = useState<SplitReceipt[]>([]);
  const [logs, setLogs] = useState<SimulationLog[]>([]);

  // ── Recipients ──
  const [recipients, setRecipients] = useState<Recipient[]>([
    {
      id: 'rec-1',
      address: 'GAT6E47IWY7ZPWZVRFLTXQ26W7G3E5R6WQX5E3L2A56QWE7R8TY90123',
      nickname: 'Alex (Ramen Master)',
      percentage: 25,
      customAmount: '60',
      isValidAddress: true,
      avatarSeed: '1',
    },
    {
      id: 'rec-2',
      address: 'GBY7F58JXZ8AQXAWSGMUYR37X8H4F6S7XRY6F4M3B67RXF8S9UZ01234',
      nickname: 'Maya (Designer)',
      percentage: 25,
      customAmount: '60',
      isValidAddress: true,
      avatarSeed: '2',
    },
    {
      id: 'rec-3',
      address: 'GCZ8G69KYA9BRYBXTHNVZS48Y9I5G7T8YSZ7G5N4C78SYG9T0VA12345',
      nickname: 'Liam (Smart Contracts)',
      percentage: 25,
      customAmount: '60',
      isValidAddress: true,
      avatarSeed: '3',
    },
    {
      id: 'rec-4',
      address: 'GDA9H70LZB0CSZCYUIOWAT59Z0J6H8U9ZTA8H6O5D89TZH0U1WB23456',
      nickname: 'Zoe (Frontend Dev)',
      percentage: 25,
      customAmount: '60',
      isValidAddress: true,
      avatarSeed: '4',
    },
  ]);

  // ── URL params ──
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode') as SplitMode;
      const urlAmount = params.get('amount');
      const urlToken = params.get('token');
      const urlRecipients = params.get('recipients');

      if (urlMode) setMode(urlMode);
      if (urlAmount) setTotalAmount(urlAmount);
      if (urlToken) {
        const found = tokens.find((t) => t.symbol === urlToken);
        if (found) setSelectedToken(found);
      }
      if (urlRecipients) {
        const items = urlRecipients.split(',').map((item, idx) => {
          const [addr, nick] = item.split(':');
          return {
            id: `rec-url-${idx}`,
            address: addr,
            nickname: nick || `Recipient #${idx + 1}`,
            isValidAddress: isValidStellarAddress(addr),
            avatarSeed: `${idx}`,
          };
        });
        if (items.length > 0) setRecipients(items);
      }
    } catch {}
  }, []);

  // ── Computed values ──
  const numericAmount = parseFloat(totalAmount) || 0;
  const tipAmount = (numericAmount * tipPercent) / 100;
  const effectiveTotal = numericAmount + tipAmount;
  const validRecipients = recipients.filter((r) => r.isValidAddress);
  const count = validRecipients.length;

  let perRecipientShare = 0;
  let dust = 0;

  if (count > 0) {
    if (mode === 'equal') {
      perRecipientShare = Math.floor(effectiveTotal / count);
      dust = effectiveTotal - perRecipientShare * count;
    } else if (mode === 'weighted') {
      const totalAllocated = validRecipients.reduce((acc, r) => {
        const share = Math.floor((effectiveTotal * (r.percentage || 0)) / 100);
        return acc + share;
      }, 0);
      dust = effectiveTotal - totalAllocated;
    }
  }

  // ── Handlers ──
  const handleToggleTheme = () => {
    setIsLightTheme((prev) => {
      const next = !prev;
      document.body.classList.toggle('light-theme', next);
      return next;
    });
  };

  const handleConnectWallet = async (preferredProvider: WalletProvider = 'lace') => {
    setIsConnecting(true);
    sounds.playClick();

    if (preferredProvider === 'lace') {
      const res = await connectLace();
      if (res.address) {
        setWalletAddress(res.address);
        setWalletProvider('lace');
        setWalletBalance('4,850.50');
        setIsWalletConnected(true);
        sounds.playSuccess();
        const now = new Date().toLocaleTimeString();
        setLogs((prev) => [
          {
            timestamp: now,
            type: 'auth',
            message: `Lace Wallet Connected (CIP-30): ${res.address.slice(0, 16)}… on ${res.network}`,
          },
          ...prev,
        ]);
        setIsConnecting(false);
        return;
      }
    }

    const hasFreighter = await checkFreighterAvailable();
    if (hasFreighter) {
      const res = await connectFreighter();
      if (res.address) {
        setWalletAddress(res.address);
        setWalletProvider('freighter');
        setWalletBalance('4,850.50');
        setIsWalletConnected(true);
        sounds.playSuccess();
        const now = new Date().toLocaleTimeString();
        setLogs((prev) => [
          {
            timestamp: now,
            type: 'auth',
            message: `Freighter Wallet Connected: ${res.address.slice(0, 12)}… on Stellar Testnet`,
          },
          ...prev,
        ]);
      }
    } else {
      // Default: Lace simulated demo wallet on Midnight Preprod
      const randomKey = generateRandomMidnightAddress();
      setWalletAddress(randomKey);
      setWalletProvider('lace');
      setWalletBalance('4,850.50');
      setIsWalletConnected(true);
      sounds.playSuccess();
      const now = new Date().toLocaleTimeString();
      setLogs((prev) => [
        {
          timestamp: now,
          type: 'auth',
          message: `Lace Wallet Connected (Midnight Preprod): ${randomKey.slice(0, 16)}…`,
        },
        ...prev,
      ]);
    }
    setIsConnecting(false);
  };

  const handleDisconnectWallet = () => {
    sounds.playClick();
    setIsWalletConnected(false);
    setWalletAddress('');
    setWalletBalance('0.00');
    setZkProof(null);
  };


  const handleOpenFaucet = () => {
    sounds.playTransferStep(3);
    const current = parseFloat(walletBalance.replace(/,/g, '')) || 0;
    const newBal = (current + 1000).toLocaleString('en-US', { minimumFractionDigits: 2 });
    setWalletBalance(newBal);
    const now = new Date().toLocaleTimeString();
    setLogs((prev) => [
      { timestamp: now, type: 'info', message: 'Friendbot Faucet: +1,000.00 XLM minted to Testnet wallet' },
      ...prev,
    ]);
  };

  const handleAddRecipient = () => {
    const newId = `rec-${Date.now()}`;
    const newRec: Recipient = {
      id: newId,
      address: generateRandomStellarAddress(),
      nickname: `Recipient #${recipients.length + 1}`,
      percentage: 0,
      customAmount: '0',
      isValidAddress: true,
      avatarSeed: `${recipients.length + 1}`,
    };
    setRecipients([...recipients, newRec]);
  };

  const handleRemoveRecipient = (id: string) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const handleUpdateRecipient = (id: string, updates: Partial<Recipient>) => {
    setRecipients(recipients.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleFillRandom = (id: string) => {
    handleUpdateRecipient(id, { address: generateRandomStellarAddress(), isValidAddress: true });
  };

  const handleImportBulk = (
    items: Array<{ address: string; nickname?: string; percentage?: number }>
  ) => {
    sounds.playSuccess();
    setRecipients(
      items.map((item, idx) => ({
        id: `rec-bulk-${Date.now()}-${idx}`,
        address: item.address,
        nickname: item.nickname || `Recipient #${idx + 1}`,
        percentage: item.percentage || Math.floor(100 / items.length),
        customAmount: '0',
        isValidAddress: true,
        avatarSeed: `${idx}`,
      }))
    );
  };

  const handleSelectGroup = (group: SavedGroup) => {
    sounds.playSuccess();
    setRecipients(
      group.recipients.map((r, idx) => ({
        id: `rec-grp-${Date.now()}-${idx}`,
        address: r.address,
        nickname: r.nickname || `Member #${idx + 1}`,
        percentage: r.percentage || Math.floor(100 / group.recipients.length),
        customAmount: r.customAmount || '0',
        isValidAddress: isValidStellarAddress(r.address),
        avatarSeed: `${idx}`,
      }))
    );
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    sounds.playClick();
    const now = new Date().toLocaleTimeString();
    setLogs([
      { timestamp: now, type: 'info',     message: 'Invoking Soroban Host: MidnightSplitterContract' },
      { timestamp: now, type: 'auth',     message: 'Verifying from.require_auth() signature on Testnet' },
      { timestamp: now, type: 'calc',     message: `Calculating split: ${effectiveTotal} ${selectedToken.symbol} across ${count} wallets` },
      { timestamp: now, type: 'transfer', message: `Atomic token::Client transfers: ${count} transfers queued in 1 ledger transaction` },
      { timestamp: now, type: 'event',    message: `Publishing event: (symbol_short!("split_eq"), sender, token)` },
      { timestamp: now, type: 'success',  message: `Tx Succeeded: 0 dust lost, ledger state committed` },
    ]);
    setTimeout(() => {
      setIsSimulating(false);
      sounds.playSuccess();
    }, 1200);
  };

  const handleExecuteSplit = async () => {
    if (count === 0 || effectiveTotal <= 0) return;
    setIsExecuting(true);
    sounds.playClick();

    const timestamp = new Date().toLocaleTimeString();
    const txHash = `TX${Math.random().toString(36).substring(2, 12).toUpperCase()}90123SOROBAN`;
    const ledger = Math.floor(45000000 + Math.random() * 100000);

    // Step 1: Run Zero-Knowledge Solvency Circuit
    let proof: ZKProofData | null = zkProof;
    try {
      proof = await executeZKBalanceCircuit({
        privateBalance: 4850.50,
        splitRequirement: effectiveTotal,
        recipientCount: count,
        tokenSymbol: selectedToken.symbol,
        senderAddress: walletAddress || 'GAT6E47IWY7ZPWZVRFLTXQ26W7G3E5R6WQX5E3L2A56QWE7R8TY90123',
      });
      if (proof) {
        const verifiedProof: ZKProofData = proof;
        setZkProof(verifiedProof);
        setLogs((prev) => [
          {
            timestamp,
            type: 'zk',
            message: `ZK Solvency Proof Generated: ${verifiedProof.proofId.slice(0, 18)}… (balance proven ≥ ${effectiveTotal} ${selectedToken.symbol} with 0 balance leakage)`,
          },
          ...prev,
        ]);
      }
    } catch (err: unknown) {
      console.warn('ZK proof fallback:', err);
    }

    setTimeout(() => sounds.playTransferStep(1), 300);
    setTimeout(() => sounds.playTransferStep(2), 600);
    setTimeout(() => sounds.playTransferStep(3), 900);

    setTimeout(() => {
      setIsExecuting(false);
      sounds.playSuccess();

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00d4ff', '#8b5cf6', '#f59e0b', '#10b981'],
      });

      const receipt: SplitReceipt = {
        id: `rcpt-${Date.now()}`,
        txHash,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        sender: walletAddress,
        walletProvider,
        token: selectedToken,
        mode,
        totalAmount: effectiveTotal,
        perRecipientShare,
        dust,
        recipients: validRecipients.map((r) => ({
          address: r.address,
          nickname: r.nickname || 'Recipient',
          amount:
            mode === 'equal'
              ? perRecipientShare
              : mode === 'weighted'
              ? Math.floor((effectiveTotal * (r.percentage || 0)) / 100)
              : parseFloat(r.customAmount || '0') || 0,
        })),
        network: walletProvider === 'lace' ? 'Midnight Preprod (ZK-Protected)' : 'Stellar Testnet (Soroban)',
        blockLedger: ledger,
        zkProof: proof || undefined,
      };

      setActiveReceipt(receipt);
      setHistory((prev) => [receipt, ...prev]);
      setIsReceiptOpen(true);

      setLogs((prev) => [
        {
          timestamp,
          type: 'success',
          message: `Atomic Split Executed: ${effectiveTotal} ${selectedToken.symbol} → ${count} recipients in Tx ${txHash.slice(0, 8)}…`,
        },
        ...prev,
      ]);
    }, 1200);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-main)',
        position: 'relative',
      }}
    >
      {/* Ambient glow */}
      <div className="ambient-bg" />

      {/* Content above footer */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Navbar */}
        <Navbar
          activePage={activePage}
          onChangePage={setActivePage}
          walletAddress={walletAddress}
          walletProvider={walletProvider}
          isWalletConnected={isWalletConnected}
          walletBalance={walletBalance}
          isConnecting={isConnecting}
          onConnectWallet={handleConnectWallet}
          onDisconnectWallet={handleDisconnectWallet}
          onOpenFaucet={handleOpenFaucet}
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            sounds.enabled = !soundEnabled;
            setSoundEnabled(!soundEnabled);
          }}
          historyCount={history.length}
          isLightTheme={isLightTheme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Sub-header strip with live stats */}
        <div
          style={{
            borderBottom: '1px solid var(--border-soft)',
            background: 'var(--bg-surface)',
          }}
        >
          <div
            className="max-w-7xl mx-auto"
            style={{
              padding: '10px 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {/* Page title */}
            <div>
              {activePage === 'split' ? (
                <div>
                  <h1
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: 'var(--text-1)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Privacy-Preserving Atomic{' '}
                    <span style={{ color: 'var(--purple)' }}>Bill Splitting</span>
                  </h1>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '1px' }}>
                    Zero-Knowledge Solvency Proof with Lace (CIP-30) & Soroban atomic settlement
                  </p>
                </div>
              ) : (
                <div>
                  <h1
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: 'var(--text-1)',
                    }}
                  >
                    Developer{' '}
                    <span style={{ color: 'var(--purple)' }}>Tools</span>
                  </h1>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '1px' }}>
                    Simulate, inspect, and verify your ZK privacy circuit & Soroban contracts
                  </p>
                </div>
              )}
            </div>

            {/* Live stat chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'Privacy Mode', value: 'Zero-Knowledge', color: 'var(--purple)' },
                { label: 'Wallet', value: walletProvider === 'lace' ? 'Lace (CIP-30)' : 'Freighter', color: 'var(--cyan)' },
                { label: 'Solvency Proof', value: zkProof?.verified ? 'Proven (Hidden)' : 'Ready', color: 'var(--emerald)' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    background: 'var(--bg-card-alt)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {label}:
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main
          className="max-w-7xl mx-auto"
          style={{
            padding: '28px 2rem',
            flex: 1,
            width: '100%',
          }}
        >
          {/* ── Split Page ── */}
          {activePage === 'split' && (
            <div
              className="page-enter"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              {/* On large screens: 2-column grid */}
              <style>{`
                @media (min-width: 1024px) {
                  .split-grid { grid-template-columns: 7fr 5fr !important; }
                }
              `}</style>
              <div
                className="split-grid"
                style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', alignItems: 'start' }}
              >
                {/* Left: Splitter Card */}
                <SplitterCard
                  mode={mode}
                  onSelectMode={setMode}
                  selectedToken={selectedToken}
                  onSelectToken={setSelectedToken}
                  tokens={tokens}
                  customTokenAddress={customTokenAddress}
                  onChangeCustomToken={setCustomTokenAddress}
                  totalAmount={totalAmount}
                  onChangeTotalAmount={setTotalAmount}
                  tipPercent={tipPercent}
                  onSelectTip={setTipPercent}
                  recipients={recipients}
                  onAddRecipient={handleAddRecipient}
                  onRemoveRecipient={handleRemoveRecipient}
                  onUpdateRecipient={handleUpdateRecipient}
                  onFillRandomAddress={handleFillRandom}
                  onOpenBulkImport={() => setIsBulkOpen(true)}
                  onOpenGroups={() => setIsGroupsOpen(true)}
                  onOpenShareModal={() => setIsShareOpen(true)}
                  onExecuteSplit={handleExecuteSplit}
                  isExecuting={isExecuting}
                  isWalletConnected={isWalletConnected}
                  onConnectWallet={handleConnectWallet}
                  zkProof={zkProof}
                />

                {/* Right: Visual Breakdown */}
                <VisualBreakdown
                  mode={mode}
                  totalAmount={numericAmount}
                  perRecipientShare={perRecipientShare}
                  dust={dust}
                  recipients={recipients}
                  token={selectedToken}
                  tipAmount={tipAmount}
                />
              </div>

              {/* Zero-Knowledge Privacy Solvency Proof Card */}
              <PrivacyProof
                zkProof={zkProof}
                totalAmount={effectiveTotal}
                tokenSymbol={selectedToken.symbol}
                senderAddress={walletAddress}
                onProofGenerated={(proof) => setZkProof(proof)}
                isWalletConnected={isWalletConnected}
              />
            </div>
          )}

          {/* ── Tools Page ── */}
          {activePage === 'tools' && (
            <ToolsPage
              history={history}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onViewReceipt={(r) => {
                setActiveReceipt(r);
                setIsReceiptOpen(true);
              }}
              onOpenGroups={() => setIsGroupsOpen(true)}
              onOpenContractInspector={() => setIsInspectorOpen(true)}
              onOpenFaucet={handleOpenFaucet}
              walletBalance={walletBalance}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <BulkImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onImport={handleImportBulk}
      />
      <GroupsModal
        isOpen={isGroupsOpen}
        onClose={() => setIsGroupsOpen(false)}
        onSelectGroup={handleSelectGroup}
        currentRecipients={recipients}
      />
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        mode={mode}
        token={selectedToken}
        totalAmount={effectiveTotal}
        perRecipientShare={perRecipientShare}
        recipients={recipients}
      />
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setIsReceiptOpen(false)}
      />
      <ContractInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onViewReceipt={(r) => {
          setActiveReceipt(r);
          setIsReceiptOpen(true);
        }}
        onClearHistory={() => setHistory([])}
      />
    </div>
  );
};

export default App;
