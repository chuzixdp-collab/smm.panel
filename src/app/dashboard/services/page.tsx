'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Package,
  RotateCcw,
  XCircle,
  LayoutList,
  Table2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { formatCurrency, truncate } from '@/lib/utils';
import { PlatformIcon } from '@/components/platform-icon';

interface Service {
  id: string;
  name: string;
  platform: string;
  category: string;
  description: string | null;
  price: number;
  minQuantity: number;
  maxQuantity: number;
  refillAvailable: boolean;
  cancelAvailable: boolean;
  status: string;
}

const PER_PAGE = 20;

type ViewMode = 'table' | 'card';

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-slate-200">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch('/api/services/platforms');
      if (res.ok) {
        const json = await res.json();
        setPlatforms(json.data || []);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PER_PAGE),
      });
      if (platformFilter && platformFilter !== '__all__') params.set('platform', platformFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/services?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setServices(data?.services || []);
        setTotal(data?.total || 0);
        setTotalPages(data?.totalPages || 1);

        // Extract categories from the loaded services
        const cats = [...new Set((data?.services || []).map((s: Service) => s.category))].sort() as string[];
        setCategories(cats);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, platformFilter, search]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  useEffect(() => {
    setPage(1);
  }, [platformFilter, search]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const displayedServices = useMemo(() => {
    if (!categoryFilter || categoryFilter === '__all__') return services;
    return services.filter((s) => s.category === categoryFilter);
  }, [services, categoryFilter]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {pages.map((p, idx) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`e-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  onClick={() => setPage(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total > 0 ? `${total} services available` : 'Browse available services'}
          </p>
        </div>
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2.5"
            onClick={() => setViewMode('table')}
          >
            <Table2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2.5"
            onClick={() => setViewMode('card')}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Platforms</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        viewMode === 'table' ? <TableSkeleton /> : <CardSkeleton />
      ) : displayedServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-slate-100 p-6">
            <Package className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No Services Found</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            {search || platformFilter
              ? 'Try adjusting your search or filters.'
              : 'No services are available at the moment.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
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
                      <TableHead className="text-slate-500">ID</TableHead>
                      <TableHead className="text-slate-500">Platform</TableHead>
                      <TableHead className="text-slate-500">Category</TableHead>
                      <TableHead className="text-slate-500">Name</TableHead>
                      <TableHead className="text-right text-slate-500">Price/1K</TableHead>
                      <TableHead className="text-right text-slate-500">Min</TableHead>
                      <TableHead className="text-right text-slate-500">Max</TableHead>
                      <TableHead className="text-center text-slate-500">Refill</TableHead>
                      <TableHead className="text-center text-slate-500">Cancel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {service.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <PlatformIcon platform={service.platform} showLabel />
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {service.category}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {service.name}
                            </p>
                            {service.description && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-slate-900 tabular-nums">
                          ${service.price.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-600 tabular-nums">
                          {service.minQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-600 tabular-nums">
                          {service.maxQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {service.refillAvailable ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              <RotateCcw className="h-3 w-3" /> Yes
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {service.cancelAvailable ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                              <XCircle className="h-3 w-3" /> Yes
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">No</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {displayedServices.map((service) => (
                  <div key={service.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {service.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {service.platform} · {service.category}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600 tabular-nums flex-shrink-0">
                        ${service.price.toFixed(3)}/1K
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-xs text-slate-400 truncate">{service.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Min: {service.minQuantity.toLocaleString()}</span>
                      <span>Max: {service.maxQuantity.toLocaleString()}</span>
                      <div className="flex gap-1.5 ml-auto">
                        {service.refillAvailable && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                            Refill
                          </Badge>
                        )}
                        {service.cancelAvailable && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">
                            Cancel
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {renderPagination()}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedServices.map((service) => (
              <Card key={service.id} className="border-slate-200 hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {service.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {service.platform} · {service.category}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 tabular-nums flex-shrink-0">
                      ${service.price.toFixed(3)}
                    </span>
                  </div>

                  {service.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{service.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Min: {service.minQuantity.toLocaleString()}</span>
                    <span className="text-slate-300">·</span>
                    <span>Max: {service.maxQuantity.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {service.refillAvailable && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        <RotateCcw className="h-3 w-3 mr-1" /> Refill
                      </Badge>
                    )}
                    {service.cancelAvailable && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                        <XCircle className="h-3 w-3 mr-1" /> Cancel
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs ml-auto font-mono">
                      #{service.id.slice(0, 6)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {renderPagination()}
        </motion.div>
      )}
    </div>
  );
}
