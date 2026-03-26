# Dashboard V2

A modern dashboard application built with Next.js, shadcn/ui, Tailwind CSS, and Turbopack for optimal development performance.

## 🚀 Features

### Core Platform
- **Next.js 15** with App Router and TypeScript
- **Turbopack** for lightning-fast development builds
- **shadcn/ui** component library with sidebar-07
- **Tailwind CSS** for utility-first styling
- **Responsive Design** with collapsible sidebar
- **Modern UI Components** with proper accessibility

### LiaPlus AI Features
- **🤖 AI Agents Management**: Create, configure, and deploy intelligent voice agents
- **📚 Interactive Tutorial System**: Step-by-step guidance for first-time users with spotlight effects
- **📖 Comprehensive Documentation**: Built-in docs with search functionality accessible via sidebar
- **📞 Call Management**: Monitor live calls, view recordings, and analyze performance
- **⚙️ Provider Integration**: Support for multiple AI, voice, and telephony providers
- **📊 Analytics Dashboard**: Real-time metrics and performance insights
- **🗂️ Knowledge Base**: Upload and manage training documents for AI agents
- **☎️ Phone Number Management**: Purchase and assign phone numbers to agents
- **🛡️ Audit Logs**: Comprehensive security monitoring and compliance tracking

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Bundler**: Turbopack (for faster development)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: Zustand with persistence
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form with Zod validation

## 🚀 Getting Started

First, run the development server with Turbopack:

```bash
npm run dev          # Next.js with Turbopack (default)
npm run dev:turbo    # Explicit Turbopack development
npm run build:turbo  # Build with Turbopack
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The application will automatically redirect to `/dashboard` where you can see the sidebar-07 component in action.

### 📚 Using the Documentation

The built-in documentation is accessible via the "Documentation" button in the sidebar. It includes:

- **Getting Started Guide**: Platform overview and first agent creation
- **AI Agents**: Comprehensive guide to agent management
- **Call Management**: Live monitoring and recording features
- **Analytics**: Dashboard metrics and reporting
- **Knowledge Base**: Document management and training
- **Phone Numbers**: Number purchase and assignment
- **Provider Settings**: AI, voice, and telephony configuration
- **Tutorial System**: Interactive onboarding features
- **Audit Logs**: Security monitoring and compliance tracking

### 🎯 Tutorial System

First-time users will see an interactive tutorial that guides through agent creation:

1. **Welcome Popover**: Choose to start tutorial or explore independently
2. **Step-by-Step Guide**: 11 interactive steps with spotlight effects
3. **Smart Navigation**: Automatic page transitions with context preservation
4. **Progress Tracking**: Visual progress indicators and completion tracking

The tutorial can be skipped at any time and will remember user preferences.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
