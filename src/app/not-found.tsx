'use client';

import { SearchIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';

// Define available pages in the application
const AVAILABLE_PAGES = [
  { path: '/dashboard', title: 'Dashboard', description: 'Main dashboard overview' },
  { path: '/dashboard/analytics', title: 'Analytics', description: 'View analytics and insights' },
  { path: '/dashboard/realtime', title: 'Real-time Dashboard', description: 'Live data monitoring' },
  { path: '/agents', title: 'Agents', description: 'Manage AI agents' },
  { path: '/agents/create', title: 'Create Agent', description: 'Create a new AI agent' },
  { path: '/agents/deleted', title: 'Deleted Agents', description: 'View deleted agents' },
  { path: '/calls', title: 'Calls', description: 'View call history' },
  { path: '/campaigns', title: 'Campaigns', description: 'Manage campaigns' },
  { path: '/campaigns/create', title: 'Create Campaign', description: 'Create a new campaign' },
  { path: '/phone-numbers', title: 'Phone Numbers', description: 'Manage phone numbers' },
  { path: '/recordings', title: 'Recordings', description: 'View call recordings' },
  { path: '/knowledge', title: 'Knowledge Base', description: 'Manage knowledge base' },
  { path: '/providers', title: 'Providers', description: 'Manage service providers' },
  { path: '/providers/llm', title: 'LLM Providers', description: 'Language model providers' },
  { path: '/providers/stt', title: 'STT Providers', description: 'Speech-to-text providers' },
  { path: '/providers/tts', title: 'TTS Providers', description: 'Text-to-speech providers' },
  { path: '/providers/telephony', title: 'Telephony Providers', description: 'Telephony providers' },
  { path: '/roles', title: 'Roles', description: 'Manage user roles' },
  { path: '/roles/users', title: 'Users', description: 'Manage users' },
  { path: '/audit-logs', title: 'Audit Logs', description: 'View audit logs' },
  { path: '/account', title: 'Account', description: 'Account settings' },
  { path: '/support-center', title: 'Support Center', description: 'Get help and support' },
  { path: '/docs', title: 'Documentation', description: 'View documentation' },
];

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPages, setFilteredPages] = useState<typeof AVAILABLE_PAGES>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter pages based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = AVAILABLE_PAGES.filter(
        (page) =>
          page.title.toLowerCase().includes(query) ||
          page.description.toLowerCase().includes(query) ||
          page.path.toLowerCase().includes(query)
      );
      setFilteredPages(filtered);
      setSelectedIndex(0);
    } else {
      setFilteredPages([]);
    }
  }, [searchQuery]);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus input on "/" key
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Navigate through results with arrow keys
      if (filteredPages.length > 0 && document.activeElement === inputRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredPages.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredPages.length) % filteredPages.length);
        } else if (e.key === 'Enter' && filteredPages[selectedIndex]) {
          e.preventDefault();
          router.push(filteredPages[selectedIndex].path);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setSearchQuery('');
          inputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredPages, selectedIndex, router]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = document.getElementById(`search-result-${selectedIndex}`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Empty className="max-w-2xl border-0">
        <EmptyHeader>
          <EmptyTitle>404 - Not Found</EmptyTitle>
          <EmptyDescription>
            The page you&apos;re looking for doesn&apos;t exist. Try searching for what you need
            below.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="w-full space-y-4">
            <InputGroup className="w-full">
              <InputGroupInput
                ref={inputRef}
                placeholder="Try searching for pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <Kbd>/</Kbd>
              </InputGroupAddon>
            </InputGroup>

            {/* Search Results */}
            {searchQuery && filteredPages.length > 0 && (
              <div className="w-full max-h-[400px] overflow-y-auto rounded-lg border bg-card shadow-sm">
                <div className="p-1 space-y-0.5">
                  {filteredPages.map((page, index) => (
                    <Link
                      key={page.path}
                      href={page.path}
                      id={`search-result-${index}`}
                      className={cn(
                        'block px-3 py-2 rounded-md transition-all duration-150 hover:bg-accent/80 group',
                        selectedIndex === index && 'bg-accent shadow-sm'
                      )}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-medium text-sm truncate">{page.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {page.description}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground/50 font-mono shrink-0 text-right group-hover:text-muted-foreground/70 transition-colors">
                          {page.path}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchQuery && filteredPages.length === 0 && (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No pages found matching &quot;{searchQuery}&quot;
              </div>
            )}

            {/* Help Text */}
            {!searchQuery && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span>Press</span>
                  <Kbd>/</Kbd>
                  <span>to search</span>
                  <span className="mx-2">•</span>
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  <span>to navigate</span>
                  <span className="mx-2">•</span>
                  <Kbd>Enter</Kbd>
                  <span>to select</span>
                </div>
              </div>
            )}

            <EmptyDescription className="pt-2">
              Need help?{' '}
              <Link href="/support-center" className="text-primary hover:underline">
                Contact support
              </Link>
            </EmptyDescription>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
