'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  XCircle,
  MessageSquare,
  User,
  Headphones,
  Clock,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { formatDateTime, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

interface TicketMessage {
  id: string;
  content: string;
  sender: 'user' | 'admin';
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

const categoryColors: Record<string, string> = {
  General: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
  'Order Issue': 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  'Payment Issue': 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  Technical: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  Other: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
};

function ConversationSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] space-y-2 ${i % 2 === 0 ? 'text-right' : ''}`}>
              <Skeleton className="h-3 w-16 ml-auto" />
              <Skeleton className="h-16 w-60 rounded-xl" />
              <Skeleton className="h-3 w-20 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`);
      if (res.ok) {
        const json = await res.json();
        setTicket(json.data?.ticket || json.data || null);
      } else {
        toast.error('Failed to load ticket');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    if (ticket?.status === 'CLOSED') return;

    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });
      if (res.ok) {
        setReply('');
        toast.success('Reply sent');
        fetchTicket();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to send reply');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    setClosing(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/close`, {
        method: 'POST',
      });
      if (res.ok) {
        toast.success('Ticket closed');
        fetchTicket();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to close ticket');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setClosing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const isOpen = ticket?.status === 'OPEN' || ticket?.status === 'ANSWERED';

  return (
    <div className="space-y-6">
      {/* Back button + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/tickets')}
            className="text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ticket #{ticketId.slice(0, 8)}</h1>
            <p className="text-sm text-slate-500">Support conversation</p>
          </div>
        </div>
        {isOpen && (
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-fit"
            onClick={handleCloseTicket}
            disabled={closing}
          >
            <XCircle className="h-4 w-4" />
            {closing ? 'Closing...' : 'Close Ticket'}
          </Button>
        )}
      </div>

      {/* Ticket Header Card */}
      {!loading && ticket && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
        >
          <Card className="border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-slate-900">{ticket.subject}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={categoryColors[ticket.category] || categoryColors.Other}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {ticket.category}
                    </Badge>
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDateTime(ticket.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Messages */}
      <Card className="border-slate-200">
        {loading ? (
          <ConversationSkeleton />
        ) : ticket && ticket.messages.length > 0 ? (
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto p-4 sm:p-6 space-y-4">
              {ticket.messages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                const showAvatar = idx === 0 || ticket.messages[idx - 1].sender !== msg.sender;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' as const }}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                            isUser
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isUser ? <User className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                        </div>
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>

                    {/* Message bubble */}
                    <div className={`max-w-[75%] sm:max-w-[65%] space-y-1 ${isUser ? 'text-right' : ''}`}>
                      {showAvatar && (
                        <p className={`text-xs font-medium ${isUser ? 'text-indigo-600' : 'text-emerald-600'}`}>
                          {isUser ? 'You' : 'Support'}
                        </p>
                      )}
                      <div
                        className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isUser
                            ? 'bg-indigo-600 text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-800 rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p className="text-[11px] text-slate-400">{formatDateTime(msg.createdAt)}</p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="rounded-full bg-slate-100 p-4">
              <MessageSquare className="h-8 w-8 text-slate-400" />
            </div>
            <p className="mt-3 text-sm text-slate-500">No messages yet. Start the conversation!</p>
          </div>
        )}
      </Card>

      {/* Message Input */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
        >
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Type your reply... (Ctrl+Enter to send)"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  className="flex-1 resize-none"
                />
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 self-end"
                  onClick={handleSendReply}
                  disabled={!reply.trim() || sending}
                >
                  <Send className="h-4 w-4" />
                  {sending ? '...' : 'Send'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {ticket?.status === 'CLOSED' && (
        <div className="text-center py-4">
          <Badge variant="secondary" className="bg-slate-100 text-slate-500">
            This ticket is closed
          </Badge>
        </div>
      )}
    </div>
  );
}
