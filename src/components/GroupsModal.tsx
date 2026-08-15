import React, { useState } from 'react';
import { X, Users, Plus, Trash2, ArrowRight, Bookmark, Check, Shield } from 'lucide-react';
import { SavedGroup, Recipient } from '../types';
import { PRESET_GROUPS, shortenAddress } from '../services/midnightContract';
import { sounds } from '../services/soundEffects';

interface GroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGroup: (group: SavedGroup) => void;
  currentRecipients: Recipient[];
}

export const GroupsModal: React.FC<GroupsModalProps> = ({
  isOpen,
  onClose,
  onSelectGroup,
  currentRecipients,
}) => {
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>(() => {
    try {
      const stored = localStorage.getItem('midnight_saved_groups');
      if (stored) return JSON.parse(stored);
    } catch {}
    return PRESET_GROUPS;
  });

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<SavedGroup['category']>('Dining');

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    sounds.playClick();
    if (!newGroupName.trim()) return;
    const valid = currentRecipients.filter(r => r.isValidAddress);
    if (valid.length === 0) return;

    const newGroup: SavedGroup = {
      id: `grp-${Date.now()}`,
      name: newGroupName.trim(),
      description: `${valid.length}-person custom split group`,
      category: newGroupCategory,
      recipients: valid.map(r => ({
        address: r.address,
        nickname: r.nickname || 'Member',
        percentage: r.percentage,
        customAmount: r.customAmount,
      })),
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newGroup, ...savedGroups];
    setSavedGroups(updated);
    try {
      localStorage.setItem('midnight_saved_groups', JSON.stringify(updated));
    } catch {}
    setNewGroupName('');
  };

  const handleDelete = (id: string) => {
    sounds.playClick();
    const updated = savedGroups.filter(g => g.id !== id);
    setSavedGroups(updated);
    try {
      localStorage.setItem('midnight_saved_groups', JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,8,17,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="glass-panel animate-in w-full max-w-2xl flex flex-col gap-5" style={{ padding: '28px 32px', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(139,92,246,0.15)] text-[#8b5cf6]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
                Saved Recipient Groups
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '2px' }}>
                One-click load for roommates, grant teams, and dinner crews
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

        {/* Save Current Recipients Box */}
        <div className="p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. Ski Trip Cabin 2026"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="glass-input text-xs text-white"
            />
            <select
              value={newGroupCategory}
              onChange={(e) => setNewGroupCategory(e.target.value as SavedGroup['category'])}
              className="glass-input text-xs text-white w-full sm:w-36"
            >
              <option value="Dining">Dining</option>
              <option value="Rent & Utilities">Rent & Utilities</option>
              <option value="Grants & Team">Grants & Team</option>
              <option value="Travel">Travel</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <button
            onClick={handleSaveCurrent}
            disabled={!newGroupName.trim() || currentRecipients.filter(r => r.isValidAddress).length === 0}
            className="btn-secondary text-xs py-2 px-4 whitespace-nowrap disabled:opacity-40"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>Save Current ({currentRecipients.filter(r => r.isValidAddress).length})</span>
          </button>
        </div>

        {/* Groups List */}
        <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
          {savedGroups.map((group) => (
            <div
              key={group.id}
              className="p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] hover:border-[rgba(139,92,246,0.4)] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white font-['Outfit']">
                    {group.name}
                  </h4>
                  <span className="badge-neon badge-purple text-[10px]">
                    {group.category}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    {group.recipients.length} members
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {group.description || 'Saved split group'}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.recipients.slice(0, 3).map((r, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] font-mono">
                      {r.nickname || shortenAddress(r.address, 3)}
                    </span>
                  ))}
                  {group.recipients.length > 3 && (
                    <span className="text-[10px] text-[var(--text-muted)] self-center">
                      +{group.recipients.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Load & Delete Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    sounds.playClick();
                    handleDelete(group.id);
                  }}
                  className="p-2 rounded-lg bg-[rgba(244,63,94,0.08)] hover:bg-[rgba(244,63,94,0.18)] text-[#f43f5e] transition"
                  title="Delete Group"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    sounds.playSuccess();
                    onSelectGroup(group);
                    onClose();
                  }}
                  className="btn-primary text-xs py-2 px-4"
                  style={{ background: 'linear-gradient(135deg, var(--purple) 0%, #7c3aed 100%)' }}
                >
                  <span>Load Group</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
