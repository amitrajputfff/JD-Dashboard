import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  content: React.ReactNode | string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'click' | 'navigate' | 'click-navigate' | 'wait' | 'form-fill';
    payload?: string | Record<string, unknown>;
  };
  skippable?: boolean;
  showNext?: boolean;
  showPrev?: boolean;
}

interface TutorialState {
  // Tutorial progress
  isFirstTimeUser: boolean;
  currentTutorial: string | null;
  currentStep: number;
  completedTutorials: string[];
  skippedTutorials: string[];
  
  // Tutorial visibility
  showWelcomePopover: boolean;
  showTutorialOverlay: boolean;
  
  // Tutorial data
  tutorials: {
    [key: string]: {
      id: string;
      name: string;
      description: string;
      steps: TutorialStep[];
      prerequisites?: string[];
    };
  };
}

interface TutorialActions {
  // User state management
  setFirstTimeUser: (isFirstTime: boolean) => void;
  markUserAsExperienced: () => void;
  
  // Tutorial control
  startTutorial: (tutorialId: string) => void;
  skipTutorial: (tutorialId: string) => void;
  completeTutorial: (tutorialId: string) => void;
  
  // Step navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  
  // UI control
  showWelcome: () => void;
  hideWelcome: () => void;
  showTutorialUI: () => void;
  hideTutorialUI: () => void;
  
  // Tutorial data
  registerTutorial: (tutorial: TutorialState['tutorials'][string]) => void;
  
  // Reset
  resetTutorial: () => void;
  resetAllProgress: () => void;
}

type TutorialStore = TutorialState & TutorialActions;

const agentCreationSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to JustDial! 🎉',
    description: 'Let\'s create your first AI agent together',
    target: 'body',
    position: 'center',
    content: 'We\'ll guide you through creating your first intelligent voice agent. This will take about 5-10 minutes.',
    showNext: true,
    showPrev: false,
  },
  {
    id: 'agents-sidebar',
    title: 'Navigate to AI Agents',
    description: 'Click on the highlighted "AI Agents" link in the sidebar',
    target: '[href="/agents"]',
    position: 'right',
    content: 'Click on the highlighted "AI Agents" link to access your agents dashboard. The highlighted area is clickable.',
    action: {
      type: 'navigate',
      payload: '/agents'
    },
    showNext: false,
    showPrev: true,
  },
  {
    id: 'create-button',
    title: 'Create Your First Agent',
    description: 'Click the "Create Assistant" button in the header to start',
    target: '[data-tutorial="create-agent-button-header"]',
    position: 'bottom',
    content: 'This button will open the agent creation options. Let\'s click it to see what\'s available.',
    action: {
      type: 'click',
    },
    showNext: false,
    showPrev: true,
  },
  {
    id: 'creation-options',
    title: 'Choose Creation Method',
    description: 'Click on "Start from Scratch" to continue',
    target: '[data-tutorial="start-from-scratch-card"]',
    position: 'left',
    content: 'For this tutorial, we\'ll use "Start from Scratch" to learn all the features. This gives you full control over every configuration option.',
    action: {
      type: 'click-navigate',
      payload: '/agents/create'
    },
    showNext: false,
    showPrev: true,
  },
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Fill in your agent\'s basic details',
    target: '[data-tutorial="basic-info-section"]',
    position: 'right',
    content: 'Give your agent a name and description. This helps you identify and organize your agents.',
    showNext: true,
    showPrev: true,
  },
  {
    id: 'llm-config',
    title: 'Configure the AI Brain',
    description: 'Set up how your agent thinks and responds',
    target: '[data-tutorial="llm-tab"]',
    position: 'bottom',
    content: 'Choose the AI model and adjust settings like creativity (temperature) and response length.',
    action: {
      type: 'click',
    },
    showNext: false,
    showPrev: true,
  },
  {
    id: 'voice-setup',
    title: 'Give Your Agent a Voice',
    description: 'Configure text-to-speech settings',
    target: '[data-tutorial="tts-tab"]',
    position: 'bottom',
    content: 'Select a voice that matches your agent\'s personality. You can also adjust speaking rate and pitch.',
    action: {
      type: 'click',
    },
    showNext: false,
    showPrev: true,
  },
  {
    id: 'speech-recognition',
    title: 'Speech Recognition',
    description: 'Configure how your agent understands speech',
    target: '[data-tutorial="stt-tab"]',
    position: 'bottom',
    content: 'Set up speech-to-text to help your agent understand what callers are saying.',
    action: {
      type: 'click',
    },
    showNext: false,
    showPrev: true,
  },
  {
    id: 'advanced-settings',
    title: 'Advanced Settings',
    description: 'Fine-tune your agent\'s behavior',
    target: '[data-tutorial="advanced-tab"]',
    position: 'bottom',
    content: 'Configure call recording, interruption handling, and other advanced features.',
    action: {
      type: 'click',
    },
    showNext: false,
    showPrev: true,
  },
  {
    id: 'create-agent',
    title: 'Create Your Agent! 🚀',
    description: 'Click "Create Assistant" to finish',
    target: '[data-tutorial="create-button"]',
    position: 'left',
    content: 'You\'re all set! Click the create button to bring your AI agent to life.',
    action: {
      type: 'click',
    },
    showNext: false,
    showPrev: true,
  },
  {
    id: 'success',
    title: 'Congratulations! 🎊',
    description: 'Your agent has been created successfully',
    target: 'body',
    position: 'center',
    content: 'Your AI agent is now ready! You can test it, assign it to phone numbers, and monitor its performance from the agents dashboard.',
    showNext: false,
    showPrev: false,
  }
];

const initialState: TutorialState = {
  isFirstTimeUser: true,
  currentTutorial: null,
  currentStep: 0,
  completedTutorials: [],
  skippedTutorials: [],
  showWelcomePopover: true,
  showTutorialOverlay: false,
  tutorials: {
    'first-agent': {
      id: 'first-agent',
      name: 'Create Your First Agent',
      description: 'Learn how to create and configure your first AI voice agent',
      steps: agentCreationSteps,
    },
  },
};

export const useTutorialStore = create<TutorialStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // User state management
        setFirstTimeUser: (isFirstTime) => {
          const currentState = get();
          set({ 
            ...currentState,
            isFirstTimeUser: isFirstTime 
          }, false, 'setFirstTimeUser');
        },

        markUserAsExperienced: () => {
          set({ 
            isFirstTimeUser: false, 
            showWelcomePopover: false 
          }, false, 'markUserAsExperienced');
        },

        // Tutorial control
        startTutorial: (tutorialId) => {
          const tutorial = get().tutorials[tutorialId];
          if (tutorial) {
            set({
              currentTutorial: tutorialId,
              currentStep: 0,
              showTutorialOverlay: true,
              showWelcomePopover: false,
            }, false, 'startTutorial');
          }
        },

        skipTutorial: (tutorialId) => {
          set((state) => ({
            skippedTutorials: [...state.skippedTutorials, tutorialId],
            currentTutorial: null,
            showTutorialOverlay: false,
            showWelcomePopover: false,
            isFirstTimeUser: false, // Mark user as no longer first time even if they skip
          }), false, 'skipTutorial');
        },

        completeTutorial: (tutorialId) => {
          set((state) => ({
            completedTutorials: [...state.completedTutorials, tutorialId],
            currentTutorial: null,
            currentStep: 0,
            showTutorialOverlay: false,
            isFirstTimeUser: false, // Mark user as no longer first time
          }), false, 'completeTutorial');
        },

        // Step navigation
        nextStep: () => {
          const { currentTutorial, currentStep, tutorials } = get();
          if (currentTutorial && tutorials[currentTutorial]) {
            const tutorial = tutorials[currentTutorial];
            const nextStepIndex = currentStep + 1;
            
            if (nextStepIndex < tutorial.steps.length) {
              set({ currentStep: nextStepIndex }, false, 'nextStep');
            } else {
              // Tutorial completed
              get().completeTutorial(currentTutorial);
            }
          }
        },

        prevStep: () => {
          const { currentStep } = get();
          if (currentStep > 0) {
            set({ currentStep: currentStep - 1 }, false, 'prevStep');
          }
        },

        goToStep: (stepIndex) => {
          const { currentTutorial, tutorials } = get();
          if (currentTutorial && tutorials[currentTutorial]) {
            const tutorial = tutorials[currentTutorial];
            if (stepIndex >= 0 && stepIndex < tutorial.steps.length) {
              set({ currentStep: stepIndex }, false, 'goToStep');
            }
          }
        },

        // UI control
        showWelcome: () =>
          set({ showWelcomePopover: true }, false, 'showWelcome'),

        hideWelcome: () =>
          set({ showWelcomePopover: false }, false, 'hideWelcome'),

        showTutorialUI: () =>
          set({ showTutorialOverlay: true }, false, 'showTutorialUI'),

        hideTutorialUI: () =>
          set({ 
            showTutorialOverlay: false,
            currentTutorial: null,
            currentStep: 0,
          }, false, 'hideTutorialUI'),

        // Tutorial data
        registerTutorial: (tutorial) =>
          set((state) => ({
            tutorials: {
              ...state.tutorials,
              [tutorial.id]: tutorial,
            }
          }), false, 'registerTutorial'),

        // Reset
        resetTutorial: () =>
          set({
            currentTutorial: null,
            currentStep: 0,
            showTutorialOverlay: false,
          }, false, 'resetTutorial'),

        resetAllProgress: () =>
          set({
            ...initialState,
            tutorials: get().tutorials, // Keep registered tutorials
          }, false, 'resetAllProgress'),
      }),
      {
        name: 'tutorial-store',
        partialize: (state) => ({
          isFirstTimeUser: state.isFirstTimeUser,
          completedTutorials: state.completedTutorials,
          skippedTutorials: state.skippedTutorials,
          currentTutorial: state.currentTutorial,
          currentStep: state.currentStep,
          showTutorialOverlay: state.showTutorialOverlay,
          showWelcomePopover: state.showWelcomePopover,
        }),
      }
    ),
    { name: 'tutorial-store' }
  )
);
