import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auctionApi } from "../entities/auction";
import { ErrorBox } from "../shared/ui/error-box";

type FormState = {
  title: string;
  description: string;
  startingPrice: string;
  minBidStep: string;
  roundDurationSeconds: string;
  maxParticipantsPerRound: string;
  botMaxBidAmount: string;
  totalRounds: string;
  prizesCount: string;
};

const initialForm: FormState = {
  title: "",
  description: "",
  startingPrice: "0",
  minBidStep: "1",
  roundDurationSeconds: "60",
  maxParticipantsPerRound: "10",
  botMaxBidAmount: "",
  totalRounds: "1",
  prizesCount: "1",
};

export default function CreateAuctionPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        startingPrice: Number(form.startingPrice),
        minBidStep: Number(form.minBidStep),
        roundDurationSeconds: Number(form.roundDurationSeconds),
        maxParticipantsPerRound: Number(form.maxParticipantsPerRound),
        botMaxBidAmount:
          form.botMaxBidAmount.trim() === ""
            ? undefined
            : Number(form.botMaxBidAmount),
        totalRounds: Number(form.totalRounds),
        prizesCount: Number(form.prizesCount),
      };

      const auction = await auctionApi.create(payload);
      setSuccess("Auction created");
      setTimeout(() => navigate(`/auctions/${auction._id}`), 600);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ display: "grid", gap: 16 }}>
      <h2 style={{ margin: 0 }}>Create Auction</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className="row">
          <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
            <label htmlFor="startingPrice">Starting price</label>
            <input
              id="startingPrice"
              name="startingPrice"
              type="number"
              step="0.01"
              value={form.startingPrice}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
            <label htmlFor="minBidStep">Min bid step</label>
            <input
              id="minBidStep"
              name="minBidStep"
              type="number"
              step="0.01"
              value={form.minBidStep}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="row">
          <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
            <label htmlFor="roundDurationSeconds">Round duration (sec)</label>
            <input
              id="roundDurationSeconds"
              name="roundDurationSeconds"
              type="number"
              value={form.roundDurationSeconds}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
            <label htmlFor="maxParticipantsPerRound">
              Max participants/round
            </label>
            <input
              id="maxParticipantsPerRound"
              name="maxParticipantsPerRound"
              type="number"
              value={form.maxParticipantsPerRound}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="botMaxBidAmount">Bot max bid (optional)</label>
          <input
            id="botMaxBidAmount"
            name="botMaxBidAmount"
            type="number"
            min={0}
            value={form.botMaxBidAmount}
            onChange={handleChange}
            placeholder="e.g. 500"
          />
        </div>

        <div className="row">
          <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
            <label htmlFor="totalRounds">Total rounds</label>
            <input
              id="totalRounds"
              name="totalRounds"
              type="number"
              min={1}
              value={form.totalRounds}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
            <label htmlFor="prizesCount">Prizes count</label>
            <input
              id="prizesCount"
              name="prizesCount"
              type="number"
              min={1}
              value={form.prizesCount}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {error && <ErrorBox message={error} />}
        {success && <div className="success">{success}</div>}

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
