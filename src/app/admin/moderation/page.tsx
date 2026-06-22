import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Flag,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createModerationFlagAction,
  updateModerationFlagStatusAction,
} from "@/app/actions/moderation";
import { AdminModerationMetricsClient } from "@/app/admin/moderation/AdminModerationMetricsClient";
import {
  getModerationDashboardData,
  type ModerationFlagView,
  type ModerationMetrics,
  type ModerationStatus,
} from "@/lib/services/moderation";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { stackServerApp } from "@/stack/server";

type SearchParams = Promise<{
  status?: string;
}>;

const statusFilters: Array<{ value: string; label: string }> = [
  { value: "all", label: "Alle" },
  { value: "flagged", label: "Flagget" },
  { value: "reviewing", label: "Under arbeid" },
  { value: "resolved", label: "Løst" },
  { value: "dismissed", label: "Avvist" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("nb-NO").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: ModerationStatus) {
  if (status === "flagged") return "Flagget";
  if (status === "reviewing") return "Under arbeid";
  if (status === "resolved") return "Løst";
  return "Avvist";
}

function statusBadgeClass(status: ModerationStatus) {
  if (status === "flagged") return "border-red-200 bg-red-50 text-red-700";
  if (status === "reviewing") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-stone-200 bg-stone-100 text-stone-700";
}

function entityLabel(entityType: string) {
  if (entityType === "request") return "Forespørsel";
  if (entityType === "offer") return "Tilbud";
  return "Forhandler";
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Flag;
}) {
  return (
    <Card className="rounded-lg border-stone-200 bg-white shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm text-stone-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-stone-950">{value}</p>
          <p className="mt-1 text-xs text-stone-500">{detail}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-700">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ModerationMetricsGrid({ metrics }: { metrics: ModerationMetrics }) {
  const resolutionLabel =
    metrics.averageResolutionHours === null
      ? "Ingen løste saker ennå"
      : `${metrics.averageResolutionHours.toFixed(1)} timer i snitt`;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Åpen kø"
        value={formatNumber(metrics.openQueue)}
        detail={`${formatNumber(metrics.flagged)} nye, ${formatNumber(metrics.reviewing)} under arbeid`}
        icon={Flag}
      />
      <MetricCard
        title="Totalt flagget"
        value={formatNumber(metrics.total)}
        detail={`${formatNumber(metrics.resolvedLast7Days)} løst siste 7 dager`}
        icon={BarChart3}
      />
      <MetricCard
        title="Løste saker"
        value={formatNumber(metrics.resolved)}
        detail={resolutionLabel}
        icon={CheckCircle2}
      />
      <MetricCard
        title="Avvist"
        value={formatNumber(metrics.dismissed)}
        detail="Flagg vurdert uten tiltak"
        icon={ShieldCheck}
      />
    </div>
  );
}

function FlagActionForm({
  flag,
  status,
  label,
}: {
  flag: ModerationFlagView;
  status: ModerationStatus;
  label: string;
}) {
  return (
    <form action={updateModerationFlagStatusAction} className="flex min-w-0 flex-col gap-2 sm:flex-row">
      <input type="hidden" name="flagId" value={flag.id} />
      <input type="hidden" name="status" value={status} />
      <Input
        name="notes"
        placeholder="Kort notat"
        defaultValue={flag.resolutionNotes}
        className="min-w-0 bg-white"
      />
      <Button type="submit" variant="outline" className="shrink-0">
        {label}
      </Button>
    </form>
  );
}

function ModerationQueue({ flags }: { flags: ModerationFlagView[] }) {
  if (flags.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
        <p className="font-medium text-stone-900">Ingen saker i dette filteret</p>
        <p className="mt-1 text-sm text-stone-500">
          Nye rapporter og manuelle flagg vil vises her.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flags.map((flag) => (
        <Card key={flag.id} className="rounded-lg border-stone-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={statusBadgeClass(flag.status)}>
                    {statusLabel(flag.status)}
                  </Badge>
                  <Badge variant="outline" className="border-stone-200 bg-stone-50 text-stone-700">
                    {entityLabel(flag.entityType)}
                  </Badge>
                  <span className="text-xs text-stone-500">{formatDate(flag.createdAt)}</span>
                </div>
                <div>
                  <h2 className="break-words text-base font-semibold text-stone-950">
                    {flag.entityTitle}
                  </h2>
                  <p className="mt-1 break-words text-sm text-stone-500">
                    {flag.entitySubtitle}
                  </p>
                  <p className="mt-1 break-all text-xs text-stone-400">
                    {flag.entityId}
                  </p>
                </div>
                <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-700">
                  {flag.reason}
                </div>
                <p className="text-xs text-stone-500">Rapportert av {flag.reporterId}</p>
              </div>

              <div className="w-full space-y-2 lg:w-[420px]">
                {flag.status !== "reviewing" && flag.status !== "resolved" && (
                  <FlagActionForm flag={flag} status="reviewing" label="Start review" />
                )}
                {flag.status !== "resolved" && (
                  <FlagActionForm flag={flag} status="resolved" label="Marker løst" />
                )}
                {flag.status !== "dismissed" && (
                  <FlagActionForm flag={flag} status="dismissed" label="Avvis" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await stackServerApp.getUser();
  if (!user) redirect("/handler/sign-in");

  const profile = await ensureUserProfile({ id: user.id });
  if (profile.role !== "admin") redirect("/");

  const params = await searchParams;
  const selectedStatus = statusFilters.some((filter) => filter.value === params.status)
    ? params.status ?? "all"
    : "all";
  const { metrics, flags } = await getModerationDashboardData({
    adminUserId: profile.userId,
    status: selectedStatus,
  });

  return (
    <main className="min-h-screen bg-stone-50">
      <AdminModerationMetricsClient metrics={metrics} />
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <Link href="/" className="text-sm font-medium text-stone-500 hover:text-stone-900">
              AutoAnbud
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-stone-950">
              Moderering
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Kvalitetskontroll for forespørsler, tilbud og forhandlere.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            Sentry metrics aktivert
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <ModerationMetricsGrid metrics={metrics} />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">Kø</h2>
                <p className="text-sm text-stone-500">
                  Viser de 50 nyeste sakene for valgt status.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    asChild
                    variant={selectedStatus === filter.value ? "default" : "outline"}
                    size="sm"
                  >
                    <Link href={`/admin/moderation?status=${filter.value}`}>
                      {filter.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            <ModerationQueue flags={flags} />
          </section>

          <aside className="space-y-4">
            <Card className="rounded-lg border-stone-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Manuelt flagg
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form action={createModerationFlagAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="entityType">Type</Label>
                    <select
                      id="entityType"
                      name="entityType"
                      className="h-9 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900"
                      defaultValue="request"
                    >
                      <option value="request">Forespørsel</option>
                      <option value="offer">Tilbud</option>
                      <option value="dealership">Forhandler</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entityId">Objekt-ID</Label>
                    <Input id="entityId" name="entityId" placeholder="UUID" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Årsak</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="Spam, feilaktig innhold eller kvalitetsproblem"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Opprett flagg
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-stone-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock3 className="h-4 w-4 text-stone-600" />
                  Fordeling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-stone-500">Forespørsler</span>
                  <span className="font-medium text-stone-950">
                    {formatNumber(metrics.requestFlags)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between gap-3">
                  <span className="text-stone-500">Tilbud</span>
                  <span className="font-medium text-stone-950">
                    {formatNumber(metrics.offerFlags)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between gap-3">
                  <span className="text-stone-500">Forhandlere</span>
                  <span className="font-medium text-stone-950">
                    {formatNumber(metrics.dealershipFlags)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
