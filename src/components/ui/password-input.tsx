import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function PasswordInput({
  className,
  ref,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selection = React.useRef<{
    start: number;
    end: number;
    direction: "forward" | "backward" | "none";
  } | null>(null);

  React.useImperativeHandle(ref, () => inputRef.current!);

  React.useLayoutEffect(() => {
    const saved = selection.current;
    if (saved) {
      inputRef.current?.setSelectionRange(saved.start, saved.end, saved.direction);
      selection.current = null;
    }
  }, [visible]);

  function toggleVisibility() {
    const input = inputRef.current;
    if (input) {
      selection.current = {
        start: input.selectionStart ?? 0,
        end: input.selectionEnd ?? 0,
        direction: input.selectionDirection ?? "none",
      };
    }
    setVisible((value) => !value);
  }

  return (
    <div className="relative w-full">
      <Input
        {...props}
        ref={inputRef}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn(className, "pr-10")}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-controls={props.id}
        disabled={disabled}
        className="absolute inset-y-0 right-1 flex w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggleVisibility}
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

export { PasswordInput };
