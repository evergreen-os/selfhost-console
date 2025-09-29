'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TenantsApi } from '@/lib/api/clients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSessionStore } from '@/hooks/useSessionStore';

interface TenantNode {
  id: string;
  name: string;
  parentId?: string;
  reseller?: boolean;
  children: TenantNode[];
}

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const { session } = useSessionStore();
  const [form, setForm] = useState({ name: '', parentId: '', reseller: false });
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await TenantsApi.listTenants();
      return response.tenants;
    }
  });

  const tree = useMemo(() => buildTree(data ?? []), [data]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (selectedTenant) {
        await TenantsApi.updateTenant(selectedTenant, {
          name: form.name,
          parentId: form.parentId || undefined,
          reseller: form.reseller
        });
      } else {
        await TenantsApi.createTenant({
          name: form.name,
          parentId: form.parentId || undefined,
          reseller: form.reseller
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setForm({ name: '', parentId: '', reseller: false });
      setSelectedTenant(null);
    }
  });

  const canManage = session?.role === 'Owner';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    upsertMutation.mutate();
  }

  function handleSelectTenant(tenantId: string) {
    if (!data) return;
    const tenant = data.find((item) => item.id === tenantId);
    if (!tenant) return;
    setSelectedTenant(tenant.id);
    setForm({
      name: tenant.name,
      parentId: tenant.parentId ?? '',
      reseller: Boolean(tenant.reseller)
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
      <Card>
        <CardHeader>
          <CardTitle>{selectedTenant ? 'Edit tenant' : 'Create tenant'}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Name</label>
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                disabled={!canManage}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Parent tenant</label>
              <select
                value={form.parentId}
                onChange={(event) => setForm({ ...form, parentId: event.target.value })}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                disabled={!canManage}
              >
                <option value="">Top-level</option>
                {data?.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.reseller}
                onChange={(event) => setForm({ ...form, reseller: event.target.checked })}
                disabled={!canManage}
              />
              Reseller tenant
            </label>
          </CardContent>
          <CardFooter className="flex justify-between">
            {selectedTenant && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedTenant(null);
                  setForm({ name: '', parentId: '', reseller: false });
                }}
                disabled={!canManage}
              >
                Clear selection
              </Button>
            )}
            <Button type="submit" disabled={!canManage || upsertMutation.isLoading}>
              {upsertMutation.isLoading ? 'Saving…' : selectedTenant ? 'Update tenant' : 'Create tenant'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-slate-500">Loading tenants…</p>}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {(error as Error).message}
            </p>
          )}
          {!isLoading && !error && (
            <HierarchyTree nodes={tree} onSelect={handleSelectTenant} selected={selectedTenant} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HierarchyTree({ nodes, onSelect, selected }: { nodes: TenantNode[]; onSelect: (id: string) => void; selected: string | null }) {
  return (
    <ul className="space-y-2 text-sm">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            onClick={() => onSelect(node.id)}
            className={`rounded-md px-3 py-2 text-left transition-colors ${selected === node.id ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-emerald-50'}`}
          >
            <span className="font-medium">{node.name}</span>
            {node.reseller && <span className="ml-2 rounded bg-emerald-200 px-2 py-0.5 text-xs text-emerald-800">Reseller</span>}
          </button>
          {node.children.length > 0 && (
            <div className="ml-4 border-l border-slate-200 pl-4">
              <HierarchyTree nodes={node.children} onSelect={onSelect} selected={selected} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function buildTree(tenants: Array<{ id: string; name: string; parentId?: string; reseller?: boolean }>): TenantNode[] {
  const map = new Map<string, TenantNode>();
  const roots: TenantNode[] = [];
  tenants.forEach((tenant) => {
    map.set(tenant.id, { ...tenant, children: [] });
  });
  map.forEach((tenant) => {
    if (tenant.parentId && map.has(tenant.parentId)) {
      map.get(tenant.parentId)!.children.push(tenant);
    } else {
      roots.push(tenant);
    }
  });
  return roots;
}
