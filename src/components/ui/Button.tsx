"use client";

import React from "react";
import { getButtonStyle, getButtonHoverHandlers } from "@/lib/button-styles";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "link";
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  children,
  disabled,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const baseStyle = getButtonStyle(variant, disabled || false);
  const hoverHandlers = getButtonHoverHandlers(variant, disabled || false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    hoverHandlers.onMouseEnter(e);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    hoverHandlers.onMouseLeave(e);
    onMouseLeave?.(e);
  };

  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}

