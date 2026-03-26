'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTutorialStore } from '@/lib/stores/tutorial-store';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  SkipForward, 
  CheckCircle,
  Target,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';

interface TutorialOverlayProps {
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TutorialOverlay({ className }: TutorialOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const {
    showTutorialOverlay,
    currentTutorial,
    currentStep,
    tutorials,
    nextStep,
    prevStep,
    hideTutorialUI,
    skipTutorial,
    showTutorialUI,
    setFirstTimeUser,
  } = useTutorialStore();

  const currentTutorialData = currentTutorial ? tutorials[currentTutorial] : null;
  const currentStepData = currentTutorialData?.steps[currentStep];



  // Handle tutorial completion
  useEffect(() => {
    if (currentTutorial && currentStepData?.id === 'success') {
      // Set user as no longer first time
      setFirstTimeUser(false);
    }
  }, [currentTutorial, currentStepData?.id, setFirstTimeUser]);
  


  // Ensure tutorial overlay shows when there's an active tutorial after navigation
  useEffect(() => {
    if (currentTutorial && currentTutorialData && !showTutorialOverlay) {
      // Clear navigation flags when tutorial starts
      sessionStorage.removeItem('tutorial-navigated-to-agents');
      sessionStorage.removeItem('tutorial-navigated-to-agents-create');
      showTutorialUI();
    }
  }, [currentTutorial, currentTutorialData, showTutorialOverlay, showTutorialUI]);

  // Handle step advancement after navigation completes
  useEffect(() => {
    if (pendingNavigation && pathname === pendingNavigation) {
      // Navigation completed, advance the step
      setTimeout(() => {
        nextStep();
        setPendingNavigation(null);
      }, 500); // Increased delay to prevent auto-advancing
    }
  }, [pathname, pendingNavigation, nextStep]);

  // Remove auto-advancing logic - let user control the tutorial flow
  // Users should manually advance steps by clicking buttons or interactive elements

  // Handle navigation requirements for current step
  useEffect(() => {
    if (currentStepData?.action?.type === 'navigate' || currentStepData?.action?.type === 'click-navigate') {
      const requiredPath = currentStepData.action.payload;
      if (typeof requiredPath === 'string' && pathname !== requiredPath && !pendingNavigation) {
        // Navigate to required page
        setPendingNavigation(requiredPath);
        router.push(requiredPath);
      }
    }
  }, [currentStepData, pathname, pendingNavigation, router]);

  // Calculate progress
  const progress = currentTutorialData 
    ? ((currentStep + 1) / currentTutorialData.steps.length) * 100 
    : 0;

  // Update highlighted element and tooltip position
  useEffect(() => {
    if (!currentStepData || !showTutorialOverlay) {
      setHighlightedElement(null);
      return;
    }

    const updateHighlight = () => {
      const target = document.querySelector(currentStepData.target) as HTMLElement;
      const tooltipWidth = 320;
      const tooltipHeight = 200;
      const margin = 16;
      
      if (target) {
        setHighlightedElement(target);
        
        // Calculate tooltip position based on step position preference
        const rect = target.getBoundingClientRect();

        let x = 0;
        let y = 0;

        switch (currentStepData.position) {
          case 'top':
            x = rect.left + rect.width / 2 - tooltipWidth / 2;
            y = rect.top - tooltipHeight - margin;
            break;
          case 'bottom':
            x = rect.left + rect.width / 2 - tooltipWidth / 2;
            y = rect.bottom + margin;
            break;
          case 'left':
            x = rect.left - tooltipWidth - margin;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
          case 'right':
            x = rect.right + margin;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
          case 'center':
          default:
            x = window.innerWidth / 2 - tooltipWidth / 2;
            y = window.innerHeight / 2 - tooltipHeight / 2;
            break;
        }

        // Ensure tooltip stays within viewport
        x = Math.max(margin, Math.min(x, window.innerWidth - tooltipWidth - margin));
        y = Math.max(margin, Math.min(y, window.innerHeight - tooltipHeight - margin));

        setTooltipPosition({ x, y });

        // Scroll element into view if needed
        if (currentStepData.position !== 'center') {
          target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
        }
      } else {
        setHighlightedElement(null);
        // Center tooltip if no target found
        setTooltipPosition({
          x: window.innerWidth / 2 - tooltipWidth / 2,
          y: window.innerHeight / 2 - tooltipHeight / 2,
        });
      }
    };

    // Initial update
    updateHighlight();

    // Update on resize and scroll
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    // Update after a short delay to handle dialog animations
    const timeoutId = setTimeout(updateHighlight, 100);

    // Update after a longer delay to handle dialog animations
    const timeoutId2 = setTimeout(updateHighlight, 300);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [currentStepData, showTutorialOverlay]);

  // Handle tutorial actions
  const handleNext = () => {
    if (currentStepData?.action) {
      const { action } = currentStepData;
      
      switch (action.type) {
        case 'navigate':
          // Set pending navigation to track when route change completes
          if (typeof action.payload === 'string') {
            setPendingNavigation(action.payload);
            // Navigate immediately, step will advance when route changes
            router.push(action.payload);
          }
          break;
        case 'click':
          const element = document.querySelector(currentStepData.target) as HTMLElement;
          if (element) {
            element.click();
          }
          setTimeout(() => {
            nextStep();
          }, 50);
          break;
        case 'click-navigate':
          // Click element and set up navigation tracking
          const clickElement = document.querySelector(currentStepData.target) as HTMLElement;
          if (clickElement && typeof action.payload === 'string') {
            setPendingNavigation(action.payload);
            clickElement.click();
          }
          break;
        default:
          nextStep();
          break;
      }
    } else {
      nextStep();
    }
  };

  const handlePrev = () => {
    if (currentTutorial && currentStep > 0) {
      const tutorial = tutorials[currentTutorial];
      const previousStep = tutorial.steps[currentStep - 1];
      
      // Check if previous step requires navigation
      if (previousStep?.action?.type === 'navigate' || previousStep?.action?.type === 'click-navigate') {
        // Navigate to the required page first
        const targetPath = previousStep.action.payload;
        if (typeof targetPath === 'string' && pathname !== targetPath) {
          setPendingNavigation(targetPath);
          router.push(targetPath);
        }
      }
      
      // Then go to previous step
      prevStep();
    }
  };

  const handleSkip = () => {
    setPendingNavigation(null);
    // Clear navigation flags
    sessionStorage.removeItem('tutorial-navigated-to-agents');
    sessionStorage.removeItem('tutorial-navigated-to-agents-create');
    if (currentTutorial) {
      setFirstTimeUser(false);
      skipTutorial(currentTutorial);
    }
  };

  const handleClose = () => {
    setPendingNavigation(null);
    // Clear navigation flags
    sessionStorage.removeItem('tutorial-navigated-to-agents');
    sessionStorage.removeItem('tutorial-navigated-to-agents-create');
    if (currentTutorial) {
      setFirstTimeUser(false);
    }
    hideTutorialUI();
  };

  // Don't render if no tutorial is active
  if (!showTutorialOverlay || !currentTutorialData || !currentStepData) {
    return null;
  }

  // Create spotlight effect style for highlighted element
  const getSpotlightStyle = () => {
    if (!highlightedElement) return {};

    const rect = highlightedElement.getBoundingClientRect();
    const padding = 8; // Add padding around highlighted element
    return {
      clipPath: `polygon(0 0, 0 100%, ${rect.left - padding}px 100%, ${rect.left - padding}px ${rect.top - padding}px, ${rect.right + padding}px ${rect.top - padding}px, ${rect.right + padding}px ${rect.bottom + padding}px, ${rect.left - padding}px ${rect.bottom + padding}px, ${rect.left - padding}px 100%, 100% 100%, 100% 0)`,
    };
  };

  // Handle overlay clicks - allow clicks through to highlighted element
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (highlightedElement && currentStepData?.action) {
      const rect = highlightedElement.getBoundingClientRect();
      const { clientX, clientY } = e;
      
      // Check if click is within highlighted element bounds (with padding)
      const padding = 8;
      if (
        clientX >= rect.left - padding &&
        clientX <= rect.right + padding &&
        clientY >= rect.top - padding &&
        clientY <= rect.bottom + padding
      ) {
        const { action } = currentStepData;
        
        switch (action.type) {
          case 'navigate':
            // Set pending navigation to track when route change completes
            if (typeof action.payload === 'string') {
              setPendingNavigation(action.payload);
            }
            
            // Allow the click to pass through by clicking the actual element
            if (highlightedElement.tagName === 'A' || highlightedElement.closest('a')) {
              const link = highlightedElement.tagName === 'A' ? highlightedElement : highlightedElement.closest('a');
              if (link) {
                // Navigate immediately, step will advance when route changes
                link.click();
              }
            }
            break;
          case 'click':
            // Click the element and advance step
            highlightedElement.click();
            nextStep();
            break;
          case 'click-navigate':
            // Click element and set up navigation tracking
            if (typeof currentStepData.action.payload === 'string') {
              setPendingNavigation(currentStepData.action.payload);
            }
            highlightedElement.click();
            break;
          default:
            // For any other action type, just advance the step
            nextStep();
            break;
        }
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60]" ref={overlayRef} key={`${currentTutorial}-${currentStep}`}>
        {/* Dark overlay with spotlight effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-all duration-300"
          style={getSpotlightStyle()}
          onClick={handleOverlayClick}
        />

        {/* Highlight ring around target element */}
        {highlightedElement && currentStepData.position !== 'center' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none border-2 border-primary/60 bg-primary/5"
              style={{
                left: highlightedElement.getBoundingClientRect().left - 4,
                top: highlightedElement.getBoundingClientRect().top - 4,
                width: highlightedElement.getBoundingClientRect().width + 8,
                height: highlightedElement.getBoundingClientRect().height + 8,
                borderRadius: '8px',
                boxShadow: '0 0 0 4px hsl(var(--primary) / 0.2)',
              }}
            />
            
            {/* Clickable area overlay for interactive steps */}
            {(currentStepData.action?.type === 'navigate' || currentStepData.action?.type === 'click' || currentStepData.action?.type === 'click-navigate') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 0.1, 0], 
                  scale: [1, 1.02, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut"
                }}
                className="absolute cursor-pointer bg-primary/5 border-2 border-primary/30 hover:bg-primary/10"
                style={{
                  left: highlightedElement.getBoundingClientRect().left - 8,
                  top: highlightedElement.getBoundingClientRect().top - 8,
                  width: highlightedElement.getBoundingClientRect().width + 16,
                  height: highlightedElement.getBoundingClientRect().height + 16,
                  borderRadius: '12px',
                  zIndex: 61,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentStepData?.action) {
                    const { action } = currentStepData;
                    
                    switch (action.type) {
                      case 'navigate':
                        // Set pending navigation to track when route change completes
                        if (typeof action.payload === 'string') {
                          setPendingNavigation(action.payload);
                        }
                        
                        // Click link if this is a link element
                        if (highlightedElement.tagName === 'A' || highlightedElement.closest('a')) {
                          const link = highlightedElement.tagName === 'A' ? highlightedElement : highlightedElement.closest('a');
                          if (link) {
                            link.click();
                          }
                        }
                        break;
                      case 'click':
                        // Click the element and advance step
                        highlightedElement.click();
                        setTimeout(() => {
                          nextStep();
                        }, 50);
                        break;
                      case 'click-navigate':
                        // Click element and set up navigation tracking
                        if (typeof currentStepData.action.payload === 'string') {
                          setPendingNavigation(currentStepData.action.payload);
                        }
                        highlightedElement.click();
                        // Don't call nextStep() here - it will be called when navigation completes
                        break;
                      default:
                        // For any other action type, just advance the step
                        nextStep();
                        break;
                    }
                  } else {
                    // No action defined, just advance step
                    nextStep();
                  }
                }}
                title="Click to continue"
              />
            )}
          </>
        )}

        {/* Tutorial tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute pointer-events-auto"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            width: '320px',
          }}
        >
          <Card className="w-80 shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-background/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <Target className="h-3 w-3 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs border-primary/20">
                    Step {currentStep + 1} of {currentTutorialData.steps.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleClose}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <Progress value={progress} className="h-2 bg-muted" />
                <div>
                  <CardTitle className="text-lg font-semibold leading-tight">
                    {currentStepData.title}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 leading-relaxed">
                    {currentStepData.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {/* Step content */}
              <div className="space-y-3">
                {typeof currentStepData.content === 'string' ? (
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {currentStepData.content}
                  </div>
                ) : (
                  currentStepData.content
                )}

                {currentStepData.id === 'creation-options' && (
                  <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p className="font-medium mb-1 text-primary">
                          Recommendation:
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          Choose &quot;Create with AI&quot; for your first agent. It provides guided setup with smart defaults.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentStepData.showPrev !== false && currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrev}
                      className="h-8"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Back
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="h-8 text-muted-foreground"
                  >
                    <SkipForward className="h-3 w-3 mr-1" />
                    Skip Tutorial
                  </Button>
                  
                  {/* Only show Next button if:
                      1. showNext is not explicitly false
                      2. Step doesn't have an interactive action (click/navigate) OR
                      3. This is the final step
                  */}
                  {currentStepData.showNext !== false && 
                   (!currentStepData.action || 
                    currentStepData.action.type === 'wait' ||
                    currentStep === currentTutorialData.steps.length - 1) && (
                    <Button
                      onClick={handleNext}
                      size="sm"
                      className="h-8"
                    >
                      {currentStep === currentTutorialData.steps.length - 1 ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Finish
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Show action hint for interactive steps */}
                  {currentStepData.action && 
                   currentStepData.action.type !== 'wait' &&
                   currentStep < currentTutorialData.steps.length - 1 && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {currentStepData.action.type === 'click' ? 'Click the highlighted area' :
                       currentStepData.action.type === 'navigate' ? 'Click to navigate' :
                       currentStepData.action.type === 'click-navigate' ? 'Click to continue' : 'Interact with the element'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
