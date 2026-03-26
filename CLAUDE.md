# Frontend Implementation Guide

## Project Overview
This is a modern React-based dashboard application built with Next.js, TypeScript, and Tailwind CSS. The application provides a comprehensive interface for managing AI agents and their conversational widgets.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useEffect)
- **Notifications**: Sonner (toast notifications)
- **File Structure**: Feature-based organization

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Dashboard-V2

# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev
```

### Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── agents/            # Agent management pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui base components
│   ├── agents/           # Agent-specific components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks
```

## Key Components

### Agent Management
- **Agent List**: Displays all agents with search and filtering
- **Agent Creation**: Form for creating new agents
- **Agent Configuration**: Settings for agent behavior and appearance
- **Widget Integration**: Embeddable widget configuration

### Widget System
The widget system allows embedding conversational AI directly into websites:

#### Widget Configuration
```typescript
interface WidgetConfig {
  mode: 'chat' | 'voice' | 'both';
  theme: 'light' | 'dark' | 'auto';
  baseBgColor: string;
  accentColor: string;
  ctaButtonColor: string;
  ctaButtonTextColor: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  size: 'small' | 'medium' | 'large' | 'full';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  title: string;
  startButtonText: string;
  endButtonText: string;
  chatFirstMessage: string;
  chatPlaceholder: string;
  voiceShowTranscript: boolean;
  consentRequired: boolean;
  consentTitle: string;
  consentContent: string;
  consentStorageKey: string;
  customImageUrl: string; // Custom logo/image URL
}
```

#### Widget Embed Code Generation
The system generates optimized embed codes that only include non-default values:

```html
<lia-widget assistant-id="agent-id" custom-image-url="https://example.com/logo.png"></lia-widget>
<script src="https://your-domain.com/widget-sdk.js" async></script>
```

## Development Guidelines

### Code Style
- Use TypeScript for all components and functions
- Follow React functional component patterns with hooks
- Use Tailwind CSS for styling
- Implement proper error handling and loading states
- Use semantic HTML elements

### Component Structure
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { ComponentProps } from '@/types/component';

interface ComponentNameProps {
  // Define props interface
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  const [state, setState] = useState(initialValue);
  
  // Component logic
  
  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  );
}
```

### State Management
- Use `useState` for local component state
- Use `useEffect` for side effects and data fetching
- Lift state up when multiple components need access
- Consider custom hooks for complex state logic

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow the design system defined in shadcn/ui
- Use consistent spacing (4, 8, 12, 16, 24, 32px)
- Implement responsive design with mobile-first approach
- Use CSS variables for theme colors

### Form Handling
```typescript
const [formData, setFormData] = useState({
  field1: '',
  field2: '',
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    // Handle form submission
    await submitForm(formData);
    toast.success('Form submitted successfully');
  } catch (error) {
    toast.error('Failed to submit form');
  }
};
```

### Error Handling
- Use try-catch blocks for async operations
- Display user-friendly error messages with toast notifications
- Implement proper loading states
- Handle network errors gracefully

### Performance Optimization
- Use React.memo for expensive components
- Implement proper key props for lists
- Lazy load heavy components
- Optimize images with Next.js Image component
- Use dynamic imports for code splitting

## Widget Customization Features

### Appearance Customization
- **Colors**: Background, accent, and button colors
- **Typography**: Font sizes and weights
- **Layout**: Size, position, and border radius
- **Custom Images**: Logo/image URL support with preview

### Behavior Configuration
- **Interaction Modes**: Chat, voice, or both
- **Consent Management**: GDPR-compliant consent handling
- **Message Customization**: First message and placeholder text
- **Voice Settings**: Transcript display options

### Real-time Preview
- Live preview of widget changes
- Floating widget preview component
- Instant visual feedback for all customizations

## API Integration

### Data Fetching
```typescript
const fetchAgents = async () => {
  try {
    const response = await fetch('/api/agents');
    const data = await response.json();
    setAgents(data);
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    toast.error('Failed to load agents');
  }
};
```

### Error Handling
- Implement proper HTTP status code handling
- Show loading states during API calls
- Provide fallback UI for failed requests
- Log errors for debugging

## Testing Strategy

### Component Testing
- Test component rendering with different props
- Test user interactions and state changes
- Test error handling scenarios
- Mock API calls for isolated testing

### Integration Testing
- Test complete user workflows
- Test API integration
- Test responsive design across devices
- Test accessibility compliance

## Deployment

### Build Process
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
- Set production API URLs
- Configure authentication keys
- Set up analytics tracking
- Configure error reporting

## Best Practices

### Security
- Validate all user inputs
- Sanitize data before rendering
- Use HTTPS in production
- Implement proper CORS policies

### Accessibility
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers

### SEO
- Use proper meta tags
- Implement structured data
- Optimize page load times
- Use semantic URLs

### Maintenance
- Keep dependencies updated
- Monitor bundle size
- Regular code reviews
- Document complex logic

## Troubleshooting

### Common Issues
1. **Build Errors**: Check TypeScript types and imports
2. **Styling Issues**: Verify Tailwind classes and CSS imports
3. **API Errors**: Check network requests and error handling
4. **Performance**: Monitor bundle size and component re-renders

### Debug Tools
- React Developer Tools
- Next.js development tools
- Browser DevTools
- Network tab for API debugging

## Contributing

### Code Standards
- Follow existing code patterns
- Write meaningful commit messages
- Add proper TypeScript types
- Include error handling
- Test your changes

### Pull Request Process
1. Create feature branch
2. Implement changes with tests
3. Update documentation if needed
4. Submit pull request with description
5. Address review feedback

This guide should be your primary reference for frontend development on this project. Keep it updated as the project evolves.
