import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  page: "parcel" | "entry";
  pending: number;
};

export function PendingQueueSummary(props: Props) {
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
