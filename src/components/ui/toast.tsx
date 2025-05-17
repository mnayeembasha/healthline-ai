"use client";

import * as React from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

const ToastProvider = RadixToast.Provider;
const ToastViewport = RadixToast.Viewport;
const ToastClose = RadixToast.Close;

// Define the ToastActionElement type
export type ToastActionElement = React.ReactElement<any, any>;

interface ToastProps extends React.ComponentPropsWithoutRef<typeof RadixToast.Root> {
  className?: string;
  description?: React.ReactNode;
  title?: string;
  action?: ToastActionElement;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof RadixToast.Root>,
  ToastProps
>(({ className, title, description, action, ...props }, ref) => (
  <RadixToast.Root
    ref={ref}
    className={cn(
      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-4 flex flex-col gap-1",
      className
    )}
    {...props}
  >
    <div className="flex justify-between items-start gap-2">
      <div className="flex flex-col gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action && <div>{action}</div>}
      <RadixToast.Close className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
        <span className="sr-only">Close</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </RadixToast.Close>
    </div>
  </RadixToast.Root>
));
Toast.displayName = "Toast";

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof RadixToast.Title>,
  React.ComponentPropsWithoutRef<typeof RadixToast.Title>
>(({ className, ...props }, ref) => (
  <RadixToast.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof RadixToast.Description>,
  React.ComponentPropsWithoutRef<typeof RadixToast.Description>
>(({ className, ...props }, ref) => (
  <RadixToast.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

// Export the ToastProps interface
export type { ToastProps };

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
};