import { MessageCircleQuestion } from "lucide-react";

interface QuestionListProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export function QuestionList({ questions, onSelect }: QuestionListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary"
        >
          <MessageCircleQuestion className="h-3.5 w-3.5" />
          {q}
        </button>
      ))}
    </div>
  );
}
