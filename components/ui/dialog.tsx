"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | null>(null);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog compound components must be rendered within a Dialog");
  }
  return context;
}

interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open: controlledOpen, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({
  asChild,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { onOpenChange } = useDialog();
  return (
    <button
      type="button"
      onClick={() => onOpenChange(true)}
      {...props}
    >
      {children}
    </button>
  );
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

function DialogOverlay({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { onOpenChange } = useDialog();
  return (
    <div
      onClick={() => onOpenChange(false)}
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200",
        className
      )}
      {...props}
    />
  );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  showCloseButton?: boolean;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, showCloseButton = true, ...props }, ref) => {
    const { open, onOpenChange } = useDialog();

    // Escape key listener
    React.useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false);
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    // Prevent body scroll when open
    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [open]);

    if (!open) return null;

    return (
      <DialogPortal>
        <DialogOverlay />
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div
            ref={ref}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl transition-all duration-200",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              className
            )}
            {...props}
          >
            {showCloseButton && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="absolute right-5 top-5 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {children}
          </div>
        </div>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = "DialogContent";

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-border mt-6",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xl font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function DialogClose({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useDialog();
  return (
    <button
      type="button"
      onClick={() => onOpenChange(false)}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogOverlay,
  DialogPortal,
};
