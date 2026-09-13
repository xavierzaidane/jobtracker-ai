"use client";

import React, { useState } from "react";
import { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail, signUpWithEmail, signInWithMagicLink, signOutUser } from "@/lib/supabase";
import { ShieldCheck, Mail, Lock, Sparkles, LogOut, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isDemoMode: boolean;
  onRefreshUser?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  isDemoMode,
  onRefreshUser,
}) => {
  const [tab, setTab] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (tab === "signin") {
        await signInWithEmail(email, password);
        toast.success("Signed in successfully!");
        if (onRefreshUser) onRefreshUser();
        onClose();
      } else if (tab === "signup") {
        await signUpWithEmail(email, password);
        toast.success("Account created! Please check your email to verify if required.");
        if (onRefreshUser) onRefreshUser();
        onClose();
      } else if (tab === "magic") {
        await signInWithMagicLink(email);
        setMagicSent(true);
        toast.success("Magic link sent! Check your inbox.");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
      toast.error(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      toast.info("Signed out. Operating in Demo Mode.");
      if (onRefreshUser) onRefreshUser();
      onClose();
    } catch (err: any) {
      toast.error("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-6 bg-background border-border shadow-2xl">
        <DialogHeader className="space-y-2 pb-2">
          <div className="flex items-center space-x-2.5 text-primary">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                CareerOps Access & Security
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Row-Level Security (RLS) and user-scoped data pipeline
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {user ? (
          // Logged in state
          <div className="space-y-5 py-2">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Authenticated Session
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{user.email}</p>
              <p className="text-[11px] text-muted-foreground font-mono truncate">
                User ID: {user.id}
              </p>
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed">
              Your applications, AI triage inbox, and interview records are securely isolated to your account via Supabase Row Level Security.
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs h-9 px-4"
              >
                Close
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSignOut}
                disabled={loading}
                className="text-xs h-9 px-4 gap-1.5"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          // Authentication Form
          <div className="space-y-4 py-1">
            {/* Tab Selector */}
            <div className="flex rounded-lg bg-muted/60 p-1 text-xs font-medium border border-border">
              <button
                type="button"
                onClick={() => { setTab("signin"); setErrorMsg(null); setMagicSent(false); }}
                className={`flex-1 py-1.5 rounded-md transition-all text-center ${
                  tab === "signin"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab("signup"); setErrorMsg(null); setMagicSent(false); }}
                className={`flex-1 py-1.5 rounded-md transition-all text-center ${
                  tab === "signup"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => { setTab("magic"); setErrorMsg(null); setMagicSent(false); }}
                className={`flex-1 py-1.5 rounded-md transition-all text-center ${
                  tab === "magic"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Magic Link
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {magicSent ? (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center space-y-2 py-6">
                <Mail className="h-8 w-8 text-primary mx-auto animate-bounce" />
                <h4 className="text-sm font-semibold">Check your email</h4>
                <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                  We sent a secure login link to <strong className="text-foreground">{email}</strong>. Click the link in your email to sign in instantly.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMagicSent(false)}
                  className="text-xs mt-2"
                >
                  Use a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs bg-muted/30 border-border"
                  />
                </div>

                {tab !== "magic" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-medium flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      Password
                    </Label>
                    <Input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 text-xs bg-muted/30 border-border"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 text-xs font-semibold gap-1.5 mt-2 shadow-xs"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {tab === "signin" && "Sign In with Email"}
                  {tab === "signup" && "Create Account"}
                  {tab === "magic" && "Send Magic Login Link"}
                </Button>
              </form>
            )}

            {/* Demo Mode Notice */}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                {isDemoMode ? "Running in Demo Mode" : "Supabase Live Mode"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs h-7 px-2.5 text-muted-foreground hover:text-foreground"
              >
                Continue in Demo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
