
import * as React from "react";

const TooltipProvider = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

const Tooltip = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    // This is a simplified implementation. It might show a warning if the child,
    // like a plain `<a>` tag, doesn't forward the ref.
    return React.cloneElement(children as React.ReactElement<any>, { ...props, ref });
  }
  return (
    <button ref={ref} {...props}>
      {children}
    </button>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number }
>(({ className, sideOffset = 4, ...props }, ref) => {
    // This component now does nothing, effectively removing the tooltip from view.
    return null;
});
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
