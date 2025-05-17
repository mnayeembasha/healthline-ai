"use client";

import * as React from "react";
import * as Toast from "@radix-ui/react-toast";

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Toast.Provider swipeDirection="right" duration={3000}>
      {children}
      <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2" />
    </Toast.Provider>
  );
};

export const useToast = () => {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const toast = (newMessage: string) => {
    setMessage(newMessage);
    setOpen(true);
  };

  return {
    toast,
    Toast: (
      <Toast.Root open={open} onOpenChange={setOpen} className="bg-black text-white p-4 rounded">
        <Toast.Title>{message}</Toast.Title>
      </Toast.Root>
    ),
  };
};
