import { AuctionStatus } from "../../../entities/auction";

type Props = { status: AuctionStatus };

const color: Record<AuctionStatus, string> = {
  scheduled: "created",
  active: "running",
  ended: "finished",
};

export function StatusBadge({ status }: Props) {
  return <span className={`badge ${color[status]}`}>{status}</span>;
}
