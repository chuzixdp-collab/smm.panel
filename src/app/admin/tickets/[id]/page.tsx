'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Loader2,
  User,
  Clock,
  Tag,
  MessageSquare,
  Inbox,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';

const priorityStyles: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
  MEDIUM: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  HIGH: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  URGENT: 'bg-red-100 text-red-700 hover:bg-red-100',
};

interface TicketMessage {
  id: string;
  content: string;
  isAdmin: boolean;
  sender?: { name?: string; email: string };
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  user?: { name?: string; email: string };
  category?: string;
  priority: string;
  status: string;
  messages: TicketMessage[];
  createdAt: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket || data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
      });
      if (res.ok) {
        toast.success('Reply sent successfully');
        setReply('');
        fetchTicket();
      } else {
        toast.error('Failed to send reply');
      }
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleChangePriority = async (priority: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });
      if (res.ok) {
        toast.success('Priority updated');
        fetchTicket();
      } else {
        toast.error('Failed to update priority');
      }
    } catch {
      toast.error('Failed to update priority');
    }
  };

  const handleToggleStatus = async () => {
    if (!ticket) return;
    setChangingStatus(true);
    const newStatus = ticket.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Ticket ${newStatus === 'CLOSED' ? 'closed' : 'reopened'}`);
        fetchTicket();
      } else {
        toast.error('Failed to update ticket status');
      }
    } catch {
      toast.error('Failed to update ticket status');
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card><CardContent className="space-y-4 p-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-4 md:p-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Inbox className="size-12 mb-3" />
          <p className="text-sm font-medium">Ticket not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <Button variant="ghost" onClick={() => router.push('/admin/tickets')} className="gap-2 mb-4">
          <ArrowLeft className="size-4" /> Back to Tickets
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{ticket.subject}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1"><User className="size-3.5" />{ticket.user?.email || '-'}</span>
              {ticket.category && <span className="flex items-center gap-1"><Tag className="size-3.5" />{ticket.category}</span>}
              <span className="flex items-center gap-1"><Clock className="size-3.5" />{formatDate(ticket.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={ticket.priority} onValueChange={handleChangePriority}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                  <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className={priorityStyles[ticket.priority] || ''}>{ticket.priority}</Badge>
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </motion.div>

      <Separator />

      <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-4">
        <div className="space-y-3">
          {ticket.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <MessageSquare className="size-10 mb-2" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            ticket.messages.map((msg) => (
              <Card key={msg.id} className={msg.isAdmin ? 'border-l-4 border-l-indigo-500' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{msg.isAdmin ? 'Admin' : msg.sender?.name || msg.sender?.email || 'User'}</span>
                      {msg.isAdmin && (
                        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100" variant="secondary">Admin</Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Separator />

        {ticket.status === 'CLOSED' ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">This ticket is closed.</p>
            <Button variant="outline" onClick={handleToggleStatus} disabled={changingStatus}>
              {changingStatus ? <Loader2 className="size-4 animate-spin" /> : null}
              Reopen Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Type your reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
            />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600 border-red-200"
                onClick={handleToggleStatus}
                disabled={changingStatus}
              >
                {changingStatus ? <Loader2 className="size-4 animate-spin" /> : null}
                Close Ticket
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSendReply}
                disabled={sending || !reply.trim()}
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {sending ? 'Sending...' : 'Send Reply'}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
