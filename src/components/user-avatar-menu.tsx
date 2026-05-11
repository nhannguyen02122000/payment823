"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

export default function UserAvatarMenu() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [flipUp, setFlipUp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Determine flip direction when menu opens
  useEffect(() => {
    if (isOpen && avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setFlipUp(spaceBelow < 200);
    }
  }, [isOpen]);

  if (!isLoaded) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-700 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = user.username ? user.username[0].toUpperCase() : "?";
  const hasImage = !!user.imageUrl;

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        ref={avatarRef}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="User menu"
        aria-expanded={isOpen}
        className="focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-full transition-opacity hover:opacity-80"
      >
        {hasImage ? (
          <img
            src={user.imageUrl}
            alt="User avatar"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-slate-700"
          />
        ) : (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-500 flex items-center justify-center">
            <span className="text-white font-semibold text-sm sm:text-base">
              {initials}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute right-0 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 ${
            flipUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <button
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
