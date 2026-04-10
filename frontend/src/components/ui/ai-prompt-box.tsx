import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Paperclip, SendHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromptInputBoxProps {
  onSend: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  allowFiles?: boolean;
}

export function PromptInputBox({
  onSend,
  isLoading = false,
  placeholder = "Paste JSONL here. One JSON object per line.",
  allowFiles = true,
}: PromptInputBoxProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = message.trim();
    if (!clean && files.length === 0) return;
    onSend(clean, files.length ? files : undefined);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(e.target.files || []);
    setFiles(next);
    // Reset input value so the same file can be selected again after removal
    e.target.value = '';
  };

  const removeFile = (fileToRemove: File) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileToRemove.name));
    // Reset input value to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-cyan-100/20 bg-slate-950/70 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        className="min-h-44 w-full resize-y rounded-xl border border-cyan-100/20 bg-slate-900/70 p-4 text-sm text-cyan-50 outline-none placeholder:text-slate-400 focus:border-cyan-300/40"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {allowFiles && (
            <>
              <input ref={fileInputRef} type="file" accept=".jsonl,.txt,application/json" className="hidden" onChange={onFileChange} />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="mr-2 h-4 w-4" />
                Attach File
              </Button>
            </>
          )}
          {files.map((file) => (
            <span key={file.name} className="inline-flex items-center gap-1 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-50">
              {file.name}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-cyan-200/20"
                onClick={() => removeFile(file)}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <Button type="submit" size="lg" className={cn("rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-6 text-slate-950", isLoading && "opacity-60")} disabled={isLoading}>
          <SendHorizontal className="mr-2 h-4 w-4" />
          {isLoading ? "Launching..." : "Launch Pulse Report"}
        </Button>
      </div>
    </form>
  );
}
