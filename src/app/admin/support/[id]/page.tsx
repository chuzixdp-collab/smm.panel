'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Message {
  id: string;
  senderType: string;
  content: string;
  createdAt: string;
  senderName?: string;
  senderEmail?: string;
}

interface Ticket {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  subject: string;
  category: string;
  status: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/support/tickets/${ticketId}`);
        if (res.ok) {
          const json = await res.json();
          setTicket(json.data);
        } else {
          toast.error('Failed to load ticket');
        }
      } catch {
        toast.error('Failed to load ticket');
      } finally {
        setLoading(false);
      }
    })();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
      });
      if (res.ok) {
        const json = await res.json();
        setTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, json.data.message || json.data],
                status: 'ANSWERED',
              }
            : prev
        );
        setReply('');
        toast.success('Reply sent');
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to send reply');
      }
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/close`, {
        method: 'POST',
      });
      if (res.ok) {
        setTicket((prev) => (prev ? { ...prev, status: 'CLOSED' } : prev));
        toast.success('Ticket closed');
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to close ticket');
      }
    } catch {
      toast.error('Failed to close ticket');
    } finally {
      setClosing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleReply();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <XCircle className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-sm text-gray-500">Ticket not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/support')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/support')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{ticket.subject}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>{ticket.userEmail || ticket.userName || ticket.userId.slice(0, 8)}</span>
              <span>•</span>
              <span>{ticket.category}</span>
              <span>•</span>
              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          {ticket.status !== 'CLOSED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={closing}
              className="text-red-600"
            >
              {closing && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Close Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {ticket.messages.map((msg) => {
              const isAdmin = msg.senderType === 'ADMIN';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 ${
                      isAdmin
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    }`}
                  >
                    <p className="mb-1 text-xs font-medium opacity-70">
                      {isAdmin
                        ? 'Admin'
                        : ticket.userEmail || ticket.userName || 'User'}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                    <p className={`mt-1.5 text-[10px] ${isAdmin ? 'text-gray-400' : 'text-white/60'}`}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      {ticket.status !== 'CLOSED' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Textarea
              placeholder="Type your reply... (Ctrl+Enter to send)"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <Button
                onClick={handleReply}
                disabled={sending || !reply.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" /> Send Reply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
