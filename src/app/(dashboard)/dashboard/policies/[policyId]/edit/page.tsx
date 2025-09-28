'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PoliciesClient } from '@gen/rest';
import { validatePolicyBundle } from '@/features/policies/policyValidator.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSessionStore } from '@/hooks/useSessionStore';

const APP_CATALOG = [
  { id: 'slack', name: 'Slack' },
  { id: 'vscode', name: 'VS Code' },
  { id: 'zoom', name: 'Zoom' },
  { id: 'chrome', name: 'Chrome' }
];

interface PolicyFormState {
  name: string;
  orgId: string;
  version: string;
  updateChannel: 'stable' | 'beta' | 'dev';
  homepageUrl: string;
  allowPopups: boolean;
  wifiSsid: string;
  wifiSecurity: 'wpa2' | 'wpa3';
  diskEncryption: boolean;
  lockAfterMinutes: number;
  selectedApps: string[];
  signed: boolean;
}

function buildDefaultState(orgId: string = ''): PolicyFormState {
  return {
    name: '',
    orgId,
    version: '1.0.0',
    updateChannel: 'stable',
    homepageUrl: 'https://www.evergreenos.dev',
    allowPopups: false,
    wifiSsid: 'EvergreenNet',
    wifiSecurity: 'wpa2',
    diskEncryption: true,
    lockAfterMinutes: 5,
    selectedApps: ['chrome'],
    signed: false
  };
}

export default function PolicyEditorPage() {
  const router = useRouter();
  const params = useParams<{ policyId: string }>();
  const { session } = useSessionStore();
  const [form, setForm] = useState<PolicyFormState>(buildDefaultState());
  const [errors, setErrors] = useState<string[]>([]);

  const isNew = params.policyId === 'new';

  const { data } = useQuery({
    queryKey: ['policy', params.policyId],
    queryFn: async () => {
      if (isNew) return null;
      const response = await PoliciesClient.getPolicy(params.policyId);
      return response;
    }
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        orgId: data.orgId,
        version: data.version,
        updateChannel: data.bundle?.configuration?.updateChannel ?? 'stable',
        homepageUrl: data.bundle?.configuration?.browser?.homepageUrl ?? '',
        allowPopups: Boolean(data.bundle?.configuration?.browser?.allowPopups),
        wifiSsid: data.bundle?.configuration?.network?.wifiNetworks?.[0]?.ssid ?? '',
        wifiSecurity: (data.bundle?.configuration?.network?.wifiNetworks?.[0]?.security as 'wpa2' | 'wpa3') ?? 'wpa2',
        diskEncryption: Boolean(data.bundle?.configuration?.security?.diskEncryption ?? true),
        lockAfterMinutes: Number(data.bundle?.configuration?.security?.lockAfterMinutes ?? 5),
        selectedApps:
          data.bundle?.configuration?.apps?.map((assignment: any) => assignment.id) ?? ['chrome'],
        signed: data.signed
      });
    } else if (session?.tenantId) {
      setForm((current) => ({ ...current, orgId: session.tenantId! }));
    }
  }, [data, session?.tenantId]);

  const mutation = useMutation({
    mutationFn: async () => {
      const bundle = buildBundle(form, params.policyId ?? (globalThis.crypto?.randomUUID?.() ?? `policy-${Date.now()}`));
      const validation = validatePolicyBundle(bundle);
      if (!validation.valid) {
        setErrors(validation.errors);
        throw new Error('Policy validation failed');
      }
      setErrors([]);
      if (isNew) {
        await PoliciesClient.createPolicy({
          name: bundle.name,
          orgId: bundle.orgId,
          bundle,
          signed: form.signed
        });
      } else {
        await PoliciesClient.updatePolicy(params.policyId, {
          name: bundle.name,
          orgId: bundle.orgId,
          bundle,
          signed: form.signed
        });
      }
    },
    onSuccess: () => {
      router.push('/dashboard/policies');
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isNew ? 'Create policy' : `Edit ${form.name}`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Policy name</label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Organization</label>
              <Input value={form.orgId} onChange={(event) => setForm({ ...form, orgId: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Version</label>
              <Input value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Update channel</label>
              <select
                value={form.updateChannel}
                onChange={(event) => setForm({ ...form, updateChannel: event.target.value as PolicyFormState['updateChannel'] })}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="stable">Stable</option>
                <option value="beta">Beta</option>
                <option value="dev">Dev</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Homepage URL</label>
              <Input value={form.homepageUrl} onChange={(event) => setForm({ ...form, homepageUrl: event.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Approved applications</label>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {APP_CATALOG.map((app) => {
                const checked = form.selectedApps.includes(app.id);
                return (
                  <label key={app.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          selectedApps: event.target.checked
                            ? [...current.selectedApps, app.id]
                            : current.selectedApps.filter((id) => id !== app.id)
                        }));
                      }}
                    />
                    {app.name}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Wi-Fi SSID</label>
              <Input value={form.wifiSsid} onChange={(event) => setForm({ ...form, wifiSsid: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Wi-Fi security</label>
              <select
                value={form.wifiSecurity}
                onChange={(event) => setForm({ ...form, wifiSecurity: event.target.value as PolicyFormState['wifiSecurity'] })}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="wpa2">WPA2</option>
                <option value="wpa3">WPA3</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Lock after (minutes)</label>
              <Input
                type="number"
                min={1}
                value={form.lockAfterMinutes}
                onChange={(event) => setForm({ ...form, lockAfterMinutes: Number(event.target.value) })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.allowPopups}
                onChange={(event) => setForm({ ...form, allowPopups: event.target.checked })}
              />
              Allow pop-ups in browser
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.diskEncryption}
                onChange={(event) => setForm({ ...form, diskEncryption: event.target.checked })}
              />
              Require disk encryption
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.signed}
              onChange={(event) => setForm({ ...form, signed: event.target.checked })}
            />
            Policy is signed
          </label>

          {!!errors.length && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <p className="font-semibold">Please fix the following before saving:</p>
              <ul className="list-disc pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/policies')}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Saving…' : 'Save policy'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function buildBundle(form: PolicyFormState, id: string) {
  return {
    id,
    name: form.name,
    version: form.version,
    orgId: form.orgId,
    configuration: {
      apps: form.selectedApps.map((appId) => ({ id: appId, target: 'all' })),
      updateChannel: form.updateChannel,
      browser: {
        homepageUrl: form.homepageUrl,
        allowPopups: form.allowPopups
      },
      network: {
        wifiNetworks: form.wifiSsid
          ? [
              {
                ssid: form.wifiSsid,
                security: form.wifiSecurity
              }
            ]
          : []
      },
      security: {
        diskEncryption: form.diskEncryption,
        lockAfterMinutes: form.lockAfterMinutes
      }
    },
    signature: form.signed ? { status: 'signed', signer: sessionSigner(form) } : { status: 'unsigned' }
  };
}

function sessionSigner(form: PolicyFormState) {
  return `${form.orgId}-policy-signer`;
}
