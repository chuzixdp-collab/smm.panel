'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  ChevronRight,
  HelpCircle,
  Hash,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/status-badge';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ['General', 'Order Issue', 'Payment Issue', 'Technical', 'Other'];

const categoryColors: Record<string, string> = {
  General: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
  'Order Issue': 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  'Payment Issue': 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  Technical: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  Other: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
};

function TicketsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const json = await res.json();
        setTickets(json.data?.tickets || json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, message }),
      });
      if (res.ok) {
        const json = await res.json();
        toast.success('Ticket created successfully');
        setDialogOpen(false);
        setSubject('');
        setCategory('');
        setMessage('');
        fetchTickets();
        if (json.data?.id) {
          router.push(`/dashboard/tickets/${json.data.id}`);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to create ticket');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowClick = (id: string) => {
    router.push(`/dashboard/tickets/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tickets.length > 0
              ? `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`
              : 'Get help from our support team'}
          </p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 w-fit"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and our team will respond as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe your issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Submit Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <Card className="border-slate-200">
          <CardContent className="p-6"><TicketsSkeleton /></CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="rounded-full bg-slate-100 p-6">
            <HelpCircle className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No tickets yet</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            Need help? Create a support ticket and our team will get back to you shortly.
          </p>
          <Button
            className="mt-4 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Your First Ticket
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
        >
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="text-slate-500">Subject</TableHead>
                      <TableHead className="text-slate-500">Category</TableHead>
                      <TableHead className="text-slate-500">Status</TableHead>
                      <TableHead className="text-right text-slate-500">Messages</TableHead>
                      <TableHead className="text-right text-slate-500">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer"
                        onClick={() => handleRowClick(ticket.id)}
                      >
                        <TableCell className="font-medium text-slate-900">
                          <span className="inline-flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-slate-400" />
                            {ticket.subject}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={categoryColors[ticket.category] || categoryColors.Other}
                          >
                            {ticket.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={ticket.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1 text-sm text-slate-600 tabular-nums">
                            <Hash className="h-3 w-3" />
                            {ticket.messageCount || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {timeAgo(ticket.createdAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(ticket.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {ticket.subject}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${categoryColors[ticket.category] || categoryColors.Other}`}
                          >
                            {ticket.category}
                          </Badge>
                          <StatusBadge status={ticket.status} />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs text-slate-500">{timeAgo(ticket.createdAt)}</span>
                        <span className="text-xs text-slate-400 tabular-nums">
                          {ticket.messageCount || 0} messages
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
