'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';

interface Message {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  messages: Message[];
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`);
      if (res.ok) {
        const json = await res.json();
        setTicket(json.data);
      } else {
        toast.error('Ticket not found');
        router.push('/dashboard/support');
      }
    } catch {
      toast.error('Failed to load ticket');
      router.push('/dashboard/support');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) fetchTicket();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setReply('');
        fetchTicket();
      } else {
        toast.error(json.error || 'Failed to send reply');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/close`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('Ticket closed');
        fetchTicket();
      } else {
        toast.error(json.error || 'Failed to close ticket');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const canClose = ticket.status === 'OPEN' || ticket.status === 'ANSWERED';
  const isClosed = ticket.status === 'CLOSED';

  return (
    <div className="space-y-4">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/support')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </button>
        {canClose && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleClose}
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" /> Close Ticket
          </Button>
        )}
      </div>

      {/* Ticket Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 lg:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{ticket.subject}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Badge variant="outline" className="font-normal">{ticket.category}</Badge>
                <StatusBadge status={ticket.status} />
              </div>
            </div>
            <span className="text-xs text-gray-400">{formatTime(ticket.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <div className="space-y-3">
        {ticket.messages.map((msg) => {
          const isAdmin = msg.user.role === 'ADMIN' || msg.user.role === 'SUPER_ADMIN';
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  isAdmin
                    ? 'rounded-tl-md bg-gray-100 text-gray-900'
                    : 'rounded-tr-md bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                }`}
              >
                <p className="text-xs font-medium opacity-75">
                  {isAdmin ? 'Support Team' : 'You'}
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{msg.message}</p>
                <p className={`mt-1.5 text-[10px] ${isAdmin ? 'text-gray-400' : 'text-white/70'}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input */}
      {!isClosed && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 lg:p-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                className="flex-1 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleReply();
                  }
                }}
              />
              <Button
                onClick={handleReply}
                disabled={!reply.trim() || submitting}
                className="self-end bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                size="icon"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isClosed && (
        <p className="text-center text-sm text-gray-400">This ticket is closed.</p>
      )}
    </div>
  );
}
