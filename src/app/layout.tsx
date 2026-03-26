import type { Metadata } from "next";
import { Geist, Geist_Mono, Public_Sans } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { TutorialProvider } from "@/components/tutorial";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { DialogProvider } from "@/contexts/dialog-context";
import { TimezoneProvider } from "@/contexts/timezone-context";
import { GlobalDialogs } from "@/components/global-dialogs";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geistHeading = Geist({subsets:['latin'],variable:'--font-heading'});

const publicSans = Public_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liaplus AI - Voice Agent Platform",
  description: "Professional AI voice agent management platform with advanced analytics and intelligent call automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", publicSans.variable, geistHeading.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <TimezoneProvider>
            <TutorialProvider>
              <DialogProvider>
                <KeyboardShortcutsProvider>
                  {children}
                  <GlobalDialogs />
                  <Toaster
                    position="top-right"
                    expand
                    richColors
                    closeButton
                  />
                </KeyboardShortcutsProvider>
              </DialogProvider>
            </TutorialProvider>
          </TimezoneProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
