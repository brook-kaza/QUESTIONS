'use client';

import React, { useState } from 'react';
import { Question } from '@/types/question';
import { Star, CheckCircle, Check, Copy, Trash2, Clock, User, Tag } from 'lucide-react';
import { formatAmharicTime } from '@/lib/date-utils';

interface QuestionCardProps {
  question: Question;
  onToggleAnswered: (id: string, current: boolean) => void;
  onToggleStarred: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  isNew?: boolean;
}

export default function QuestionCard({
  question,
  onToggleAnswered,
  onToggleStarred,
  onDelete,
  isNew = false,
}: QuestionCardProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(question.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteClick = () => {
    if (confirm('ይህን ጥያቄ መሰረዝ እርግጠኛ ነዎት?')) {
      setIsDeleting(true);
      onDelete(question.id);
    }
  };

  // Category badge colors
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'ለአባቶች':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ለወጣቶች':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ለቤተሰብ':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-200 p-5 ${
        question.is_answered
          ? 'bg-stone-50/70 border-stone-200 opacity-65'
          : question.is_starred
          ? 'bg-amber-50/40 border-amber-300/80 shadow-xs ring-1 ring-amber-300/40'
          : 'bg-white border-stone-200/90 shadow-xs hover:border-stone-300'
      } ${isNew ? 'ring-2 ring-emerald-500 animate-pulse' : ''}`}
    >
      {/* Top Header: Author, Category & Time */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border inline-flex items-center gap-1 ${getCategoryBadgeClass(
              question.category
            )}`}
          >
            <Tag className="w-3 h-3" />
            <span>{question.category}</span>
          </span>

          <span className="text-xs font-medium text-stone-600 inline-flex items-center gap-1">
            <User className="w-3 h-3 text-stone-400" />
            <span>{question.author_name || 'አይታወቅም'}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-stone-400">
          <Clock className="w-3 h-3" />
          <span>{formatAmharicTime(question.created_at)}</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="mb-4">
        <p
          className={`text-base sm:text-lg leading-relaxed whitespace-pre-wrap ${
            question.is_answered
              ? 'text-stone-500 line-through decoration-stone-400 decoration-1'
              : 'text-stone-900 font-medium'
          }`}
        >
          {question.content}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100">
        <div className="flex items-center gap-2">
          {/* Star Toggle Button */}
          <button
            type="button"
            onClick={() => onToggleStarred(question.id, question.is_starred)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              question.is_starred
                ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                : 'bg-stone-100 hover:bg-amber-50 hover:text-amber-700 text-stone-600'
            }`}
            title="አስፈላጊ / ቅድሚያ የሚሰጠው"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                question.is_starred ? 'fill-current text-white' : 'text-stone-400'
              }`}
            />
            <span>{question.is_starred ? 'አስፈላጊ ተደርጓል' : 'አስፈላጊ (Star)'}</span>
          </button>

          {/* Answered Toggle Button */}
          <button
            type="button"
            onClick={() => onToggleAnswered(question.id, question.is_answered)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              question.is_answered
                ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                : 'bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 text-stone-600'
            }`}
            title="መልስ የተሰጠበት ሁኔታ"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{question.is_answered ? 'ተመልሷል' : 'መልስ ተሰጥቷል'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="ጥያቄውን ቅዳ"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Delete Button */}
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDeleteClick}
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="ጥያቄውን ሰርዝ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

