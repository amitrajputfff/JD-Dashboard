'use client';

import { useEffect } from 'react';
import { useTutorialStore } from '@/lib/stores/tutorial-store';

/**
 * Hook to manage tutorial completion and persistence
 */
export function useTutorial() {
  const {
    isFirstTimeUser,
    currentTutorial,
    currentStep,
    completedTutorials,
    skippedTutorials,
    startTutorial,
    skipTutorial,
    completeTutorial,
    markUserAsExperienced,
  } = useTutorialStore();

  // Mark tutorial as seen in localStorage
  const markTutorialAsSeen = (tutorialId: string) => {
    localStorage.setItem(`tutorial_seen_${tutorialId}`, 'true');
  };

  // Mark tutorial as skipped in localStorage
  const markTutorialAsSkipped = (tutorialId: string) => {
    localStorage.setItem(`tutorial_skipped_${tutorialId}`, 'true');
    localStorage.setItem('has_seen_tutorial', 'true');
  };

  // Mark tutorial as completed in localStorage
  const markTutorialAsCompleted = (tutorialId: string) => {
    localStorage.setItem(`tutorial_completed_${tutorialId}`, 'true');
    localStorage.setItem('has_seen_tutorial', 'true');
  };

  // Check if user has seen any tutorial
  const hasSeenAnyTutorial = () => {
    return localStorage.getItem('has_seen_tutorial') === 'true';
  };

  // Enhanced skip tutorial function
  const skipTutorialWithPersistence = (tutorialId: string) => {
    skipTutorial(tutorialId);
    markTutorialAsSkipped(tutorialId);
    markUserAsExperienced();
  };

  // Enhanced complete tutorial function
  const completeTutorialWithPersistence = (tutorialId: string) => {
    completeTutorial(tutorialId);
    markTutorialAsCompleted(tutorialId);
    markUserAsExperienced();
  };

  // Enhanced start tutorial function
  const startTutorialWithPersistence = (tutorialId: string) => {
    startTutorial(tutorialId);
    markTutorialAsSeen(tutorialId);
  };

  return {
    // State
    isFirstTimeUser,
    currentTutorial,
    currentStep,
    completedTutorials,
    skippedTutorials,
    
    // Actions with persistence
    startTutorial: startTutorialWithPersistence,
    skipTutorial: skipTutorialWithPersistence,
    completeTutorial: completeTutorialWithPersistence,
    
    // Utilities
    hasSeenAnyTutorial,
    markUserAsExperienced,
  };
}
