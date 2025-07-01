// This version removes AI SDK dependency and implements local-only chat behavior
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import ChatBottombar from '@/components/chat/chat-bottombar';
import ChatLanding from '@/components/chat/chat-landing';
import ChatMessageContent from '@/components/chat/chat-message-content';
import { SimplifiedChatView } from '@/components/chat/simple-chat-view';
import {
  ChatBubble,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import WelcomeModal from '@/components/welcome-modal';
import { Info } from 'lucide-react';
import GitHubButton from 'react-github-btn';
import HelperBoost from './HelperBoost';

const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  return hasMounted ? <>{children}</> : null;
};

const Avatar = dynamic(
  () =>
    Promise.resolve(
      ({ hasActiveTool, videoRef, isTalking }: any) => {
        const isIOS = () => {
          const ua = navigator.userAgent;
          const platform = navigator.platform;
          const maxTouchPoints = navigator.maxTouchPoints || 0;
          return /iPad|iPhone|iPod/.test(ua) ||
            /iPad|iPhone|iPod/.test(platform) ||
            (platform === 'MacIntel' && maxTouchPoints > 1);
        };

        return (
          <div className={`flex items-center justify-center rounded-full transition-all duration-300 ${hasActiveTool ? 'h-20 w-20' : 'h-28 w-28'}`}>
            <div className="relative cursor-pointer" onClick={() => (window.location.href = '/')}> 
              {isIOS() ? (
                <img src="/landing-memojis.png" alt="iOS avatar" className="h-full w-full scale-[1.8] object-contain" />
              ) : (
                <video ref={videoRef} className="h-full w-full scale-[1.8] object-contain" muted playsInline loop>
                  <source src="/final_memojis.webm" type="video/webm" />
                  <source src="/final_memojis_ios.mp4" type="video/mp4" />
                </video>
              )}
            </div>
          </div>
        );
      }
    ),
  { ssr: false }
);

const MOTION_CONFIG = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

const Chat = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query');

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Hi! I'm Deepika's assistant. Ask me anything!" },
  ]);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  const submitQuery = (query: string) => {
    if (!query.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: query },
      { role: 'bot', content: `🤖 You said: "${query}" — I'm a demo bot.` },
    ]);
  };

  useEffect(() => {
    if (initialQuery && !autoSubmitted) {
      setAutoSubmitted(true);
      setInput('');
      submitQuery(initialQuery);
    }
  }, [initialQuery, autoSubmitted]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(input);
    setInput('');
  };

  const latestUserMessage = messages.findLast((m) => m.role === 'user');
  const currentAIMessage = messages.findLast((m) => m.role === 'bot');
  const isEmptyState = messages.length <= 1;

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="absolute top-6 right-8 z-51 flex flex-col-reverse items-center justify-center gap-1 md:flex-row">
        <WelcomeModal
          trigger={<div className="hover:bg-accent cursor-pointer rounded-2xl px-3 py-1.5"><Info className="text-accent-foreground h-8" /></div>}
        />
        <div className="pt-2">
          <GitHubButton
            href="https://github.com/toukoum/portfolio"
            data-color-scheme="no-preference: light; light: light; dark: light_high_contrast;"
            data-size="large"
            data-show-count
            aria-label="Star toukoum/portfolio on GitHub"
          >Star</GitHubButton>
        </div>
      </div>

      <div className="fixed top-0 right-0 left-0 z-50" style={{ background: 'linear-gradient(to bottom, #fff 0%, #fff 95%, #fff0 100%)' }}>
        <div className="py-6">
          <div className="flex justify-center">
            <ClientOnly>
              <Avatar hasActiveTool={false} videoRef={videoRef} isTalking={isTalking} />
            </ClientOnly>
          </div>
        </div>
      </div>

      <div className="container mx-auto flex h-full max-w-3xl flex-col">
        <div className="flex-1 overflow-y-auto px-2" style={{ paddingTop: `180px` }}>
          <AnimatePresence mode="wait">
            {isEmptyState ? (
              <motion.div key="landing" className="flex min-h-full items-center justify-center" {...MOTION_CONFIG}>
                <ChatLanding submitQuery={submitQuery} />
              </motion.div>
            ) : (
              <div className="pb-4">
                {messages.map((msg, idx) => (
                  <ChatBubble key={idx} variant={msg.role === 'user' ? 'sent' : 'received'}>
                    <ChatBubbleMessage>{msg.content}</ChatBubbleMessage>
                  </ChatBubble>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="sticky bottom-0 bg-white px-2 pt-3 md:px-0 md:pb-4">
          <div className="relative flex flex-col items-center gap-3">
            <HelperBoost submitQuery={submitQuery} setInput={setInput} />
            <ChatBottombar
              input={input}
              handleInputChange={(e) => setInput(e.target.value)}
              handleSubmit={onSubmit}
              isLoading={false}
              stop={() => setIsTalking(false)}
              isToolInProgress={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
