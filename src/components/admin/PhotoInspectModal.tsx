import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import type { Profile } from '../../types';

interface PhotoInspectModalProps {
  target: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoInspectModal({ target, isOpen, onClose }: PhotoInspectModalProps) {
  if (!isOpen || !target) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-lg w-full bg-white border border-slate-200 rounded-[28px] p-5 shadow-2xl space-y-4"
        >
          {/* Close button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-sm">{target.name}</h3>
              <p className="text-xs font-mono text-slate-500">{target.college_id} &bull; {target.department || 'General'}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Photo */}
          <div className="w-full aspect-square max-h-[60vh] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
            <img
              src={target.photo_url}
              alt={target.name}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Score: <strong className="text-slate-900 font-mono">{target.elo_rating} pts</strong></span>
            <a
              href={target.photo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff5864] hover:underline inline-flex items-center space-x-1 font-bold"
            >
              <span>View Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
