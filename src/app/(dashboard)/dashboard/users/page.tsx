'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UsersApi } from '@/lib/api/clients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { useSessionStore } from '@/hooks/useSessionStore';
import { formatDate } from '@/lib/utils';

const ROLES: Array<'Owner' | 'Admin' | 'Auditor'> = ['Owner', 'Admin', 'Auditor'];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { session } = useSessionStore();
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'Admin' as 'Owner' | 'Admin' | 'Auditor' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await UsersApi.listUsers();
      return response.users;
    }
  });

  const inviteMutation = useMutation({
    mutationFn: () => UsersApi.inviteUser(inviteForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setInviteForm({ email: '', role: 'Admin' });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'Owner' | 'Admin' | 'Auditor' }) =>
      UsersApi.updateUserRole(userId, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => UsersApi.deactivateUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const canManage = session?.role === 'Owner' || session?.role === 'Admin';

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    inviteMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite new user</CardTitle>
        </CardHeader>
        <form onSubmit={handleInvite}>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })}
                required
                disabled={!canManage}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <select
                value={inviteForm.role}
                onChange={(event) => setInviteForm({ ...inviteForm, role: event.target.value as typeof inviteForm.role })}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                disabled={!canManage}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={!canManage || inviteMutation.isLoading}>
              {inviteMutation.isLoading ? 'Sending invite…' : 'Send invite'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isLoading && <p className="text-sm text-slate-500">Loading users…</p>}
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
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <select
                      value={user.role}
                      onChange={(event) => updateRoleMutation.mutate({ userId: user.id, role: event.target.value as typeof user.role })}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                      disabled={!canManage || updateRoleMutation.isLoading}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deactivateMutation.mutate(user.id)}
                      disabled={!canManage || deactivateMutation.isLoading}
                    >
                      Deactivate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.length && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                    No users found.
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
