import React, { useState } from 'react';
import { X, Check, Plus, Trash2, Cpu } from 'lucide-react';
import { SkillPlugin } from '../types';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: SkillPlugin[];
  activeSkillIds: string[];
  onToggleSkill: (skillId: string) => void;
  onCreateCustomSkill: (skill: Omit<SkillPlugin, 'id' | 'enabled'>) => void;
  onDeleteCustomSkill: (skillId: string) => void;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({
  isOpen,
  onClose,
  skills,
  activeSkillIds,
  onToggleSkill,
  onCreateCustomSkill,
  onDeleteCustomSkill,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'create'>('catalog');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [newCategory, setNewCategory] = useState<SkillPlugin['category']>('code');
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 180);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newInstruction.trim()) return;

    onCreateCustomSkill({
      name: newTitle.trim(),
      description: newDesc.trim() || 'Custom skill plugin',
      category: newCategory,
      instruction: newInstruction.trim(),
    });

    setNewTitle('');
    setNewDesc('');
    setNewInstruction('');
    setActiveTab('catalog');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none"
      onClick={handleClose}
    >
      <div
        className={`bg-[#141416] border border-white/10 rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden shadow-2xl ${
          isClosing ? 'animate-modal-close' : 'animate-fadeIn'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-white/50" />
            <span className="text-sm font-semibold text-white">Skills & Capabilities</span>
            <span className="text-xs text-white/40">
              · {activeSkillIds.length} active
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors ios-tap"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch - Apple Segmented Control */}
        <div className="px-5 pt-3 pb-2.5 border-b border-white/[0.06]">
          <div className="inline-flex bg-[#121214] p-0.5 rounded-full border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all ios-tap ${
                activeTab === 'catalog'
                  ? 'bg-[#2c2c2e] text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Catalog ({skills.length})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium rounded-full transition-all ios-tap ${
                activeTab === 'create'
                  ? 'bg-[#2c2c2e] text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Skill</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-3">
          {activeTab === 'catalog' ? (
            <div className="space-y-2">
              {skills.map((skill) => {
                const isActive = activeSkillIds.includes(skill.id);
                const isCustom = skill.id.startsWith('custom-');

                return (
                  <div
                    key={skill.id}
                    onClick={() => onToggleSkill(skill.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ios-tap ${
                      isActive
                        ? 'bg-[#141416] border-white/20'
                        : 'bg-[#141416]/50 border-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs">
                            {skill.name}
                          </span>
                          <span className="text-[10px] font-mono uppercase text-white/40">
                            {skill.category}
                          </span>
                          {isCustom && (
                            <span className="text-[10px] text-white/60 bg-white/10 px-1.5 py-0.5 rounded font-mono">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-[11px] mt-1 leading-relaxed">
                          {skill.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCustomSkill(skill.id);
                            }}
                            className="p-1 text-white/30 hover:text-[#ff453a] rounded-full transition-colors"
                            title="Delete custom skill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isActive
                              ? 'bg-white border-white text-black shadow-sm'
                              : 'border-white/20 bg-transparent'
                          }`}
                        >
                          {isActive && <Check className="w-3 h-3 stroke-[2.5]" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Tailwind Master"
                  className="w-full bg-[#121214] text-white border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#121214] text-white border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-white/30 font-mono"
                >
                  <option value="code">Code & Architecture</option>
                  <option value="design">UI & Design System</option>
                  <option value="testing">Testing & Audit</option>
                  <option value="tools">Integration & Tools</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Short summary of this skill..."
                  className="w-full bg-[#121214] text-white border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-1">
                  System Instructions (Prompt)
                </label>
                <textarea
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  placeholder="Instructions for the AI when this skill is active..."
                  rows={4}
                  className="w-full bg-[#121214] text-white border border-white/10 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-white/30 resize-y leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-1.5 rounded-full text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-semibold transition-all ios-tap shadow-sm"
                >
                  Save Skill
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
