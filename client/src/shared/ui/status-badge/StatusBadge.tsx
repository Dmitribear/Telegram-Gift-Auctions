import { AuctionStatus } from "../../../entities/auction";

type Props = { status: AuctionStatus };

const color = {
  CREATED: "created",
  RUNNING: "running",
  FINISHED: "finished",
};

export function StatusBadge({ status }: Props) {
  return <span className={`badge ${color[status]}`}>{status}</span>;
}
