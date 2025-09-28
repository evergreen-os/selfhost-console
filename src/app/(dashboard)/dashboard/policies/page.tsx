'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PoliciesClient } from '@gen/rest';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { useSessionStore } from '@/hooks/useSessionStore';

export default function PoliciesPage() {
  const { session } = useSessionStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const response = await PoliciesClient.listPolicies();
      return response.policies;
    }
  });

  const canEdit = session?.role !== 'Auditor';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Policies</h2>
          <p className="text-sm text-slate-600">Manage policy bundles across your organization.</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href="/dashboard/policies/new/edit">New policy</Link>
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading policies…</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {(error as Error).message}
        </p>
      )}

      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Org</TableHeaderCell>
                <TableHeaderCell>Version</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
                <TableHeaderCell>Updated</TableHeaderCell>
                <TableHeaderCell>Signature</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium text-slate-800">{policy.name}</TableCell>
                  <TableCell>{policy.orgId}</TableCell>
                  <TableCell>{policy.version}</TableCell>
                  <TableCell>{formatDate(policy.createdAt)}</TableCell>
                  <TableCell>{formatDate(policy.updatedAt)}</TableCell>
                  <TableCell>{policy.signed ? 'Signed' : 'Unsigned'}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/policies/${policy.id}/edit`}>{canEdit ? 'Edit' : 'View'}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.length && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                    No policies available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
