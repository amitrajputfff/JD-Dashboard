'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTutorialStore } from '@/lib/stores/tutorial-store';
import { X, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeTutorialPopoverProps {
  className?: string;
}

export function WelcomeTutorialPopover({ className }: WelcomeTutorialPopoverProps) {
  const {
    showWelcomePopover,
    isFirstTimeUser,
    hideWelcome,
    startTutorial,
    skipTutorial,
    markUserAsExperienced,
  } = useTutorialStore();

  // Don't show if user is not first time or popover is hidden
  if (!isFirstTimeUser || !showWelcomePopover) {
    return null;
  }

  const handleStartTutorial = () => {
    startTutorial('first-agent');
  };

  const handleSkipTutorial = () => {
    skipTutorial('first-agent');
    markUserAsExperienced();
  };

  const handleClose = () => {
    // When user says "I'll explore on my own", mark them as experienced
    markUserAsExperienced();
    hideWelcome();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative z-10"
        >
          <Card className="w-[90vw] max-w-md mx-auto shadow-2xl border-2">
            <CardHeader className="relative pb-4">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-6 w-6 p-0"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <Badge variant="outline" className="text-xs border-primary/20">
                  Welcome
                </Badge>
              </div>
              
              <CardTitle className="text-xl font-bold">
                Welcome to LiaPlus AI! 🎉
              </CardTitle>
              <CardDescription className="text-sm">
                Let&apos;s get you started with creating your first AI voice agent
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    What you&apos;ll learn:
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• How to create and configure your first AI agent</li>
                    <li>• Setting up voice and speech recognition</li>
                    <li>• Managing agent behavior and responses</li>
                    <li>• Testing and deploying your agent</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Estimated time: 5-10 minutes</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkipTutorial}
                  className="h-9"
                >
                  Skip Tutorial
                </Button>
                <Button
                  onClick={handleStartTutorial}
                  size="sm"
                  className="h-9"
                >
                  Get Started
                </Button>
              </div>

              <div className="text-center">
                <button
                  onClick={handleClose}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  I&apos;ll explore on my own
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
