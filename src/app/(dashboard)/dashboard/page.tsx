import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardHomePage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to EvergreenOS</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Choose a section from the sidebar to manage devices, policies, events, users, and tenants. This overview will grow as we
          connect live telemetry from your deployment.
        </CardContent>
      </Card>
    </div>
  );
}
