import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type IntakeProps = {
  page: "intake";
  parcelPending: number;
  entryPending: number;
};

type SingleQueueProps = {
  page: "parcel" | "entry";
  pending: number;
};

type Props = IntakeProps | SingleQueueProps;

export function PendingQueueSummary(props: Props) {
  if (props.page === "intake") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Queue snapshot</CardTitle>
          <CardDescription>
            How many orders are still waiting in each step right now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/40 px-4 py-3">
              <dt className="text-sm font-medium text-muted-foreground">
                Parcel creation
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {props.parcelPending}
              </dd>
            </div>
            <div className="rounded-lg border bg-muted/40 px-4 py-3">
              <dt className="text-sm font-medium text-muted-foreground">
                Pathao entry
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {props.entryPending}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    );
  }

  const label =
    props.page === "parcel"
      ? "Pending parcel creation"
      : "Pending Pathao entry";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{label}</CardTitle>
        <CardDescription>
          Orders in this list until your team marks them done.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{props.pending}</p>
      </CardContent>
    </Card>
  );
}
