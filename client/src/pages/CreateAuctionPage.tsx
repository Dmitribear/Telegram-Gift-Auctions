import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auctionApi } from "../entities/auction";
import { ErrorBox } from "../shared/ui/error-box";

type FormState = {
  title: string;
  description: string;
  startPrice: string;
  bidStep: string;
  baseDurationMinutes: string;
  startTime: string;
  antiSnipeWindowMinutes: string;
  antiSnipeExtensionMinutes: string;
};

const initialForm: FormState = {
  title: "",
  description: "",
  startPrice: "0",
  bidStep: "1",
  baseDurationMinutes: "10",
  startTime: "",
  antiSnipeWindowMinutes: "10",
  antiSnipeExtensionMinutes: "5",
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
    const { name, value, type } = e.target;
    const cleaned =
      type === "number" ? value.replace(/^0+(?=\d)/, "") : value;
    setForm((prev) => ({ ...prev, [name]: cleaned }));
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
        startPrice: Number(form.startPrice),
        bidStep: Number(form.bidStep),
        baseDurationMinutes: Number(form.baseDurationMinutes),
        startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
        antiSnipeWindowMinutes: Number(form.antiSnipeWindowMinutes),
        antiSnipeExtensionMinutes: Number(form.antiSnipeExtensionMinutes),
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
            <label htmlFor="startPrice">Start price</label>
            <input
              id="startPrice"
              name="startPrice"
              type="number"
              step="0.01"
              value={form.startPrice}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
            <label htmlFor="bidStep">Bid step</label>
            <input
              id="bidStep"
              name="bidStep"
              type="number"
              step="0.01"
              value={form.bidStep}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="row">
          <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
            <label htmlFor="baseDurationMinutes">Duration (minutes)</label>
            <input
              id="baseDurationMinutes"
              name="baseDurationMinutes"
              type="number"
              value={form.baseDurationMinutes}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
            <label htmlFor="startTime">Start time (optional)</label>
            <input
              id="startTime"
              name="startTime"
              type="datetime-local"
              value={form.startTime}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="antiSnipeWindowMinutes">Anti-snipe window (minutes)</label>
          <input
            id="antiSnipeWindowMinutes"
            name="antiSnipeWindowMinutes"
            type="number"
            min={0}
            value={form.antiSnipeWindowMinutes}
            onChange={handleChange}
            placeholder="e.g. 10"
          />
        </div>

        <div className="row">
          <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
            <label htmlFor="antiSnipeExtensionMinutes">Anti-snipe extend (minutes)</label>
            <input
              id="antiSnipeExtensionMinutes"
              name="antiSnipeExtensionMinutes"
              type="number"
              min={0}
              value={form.antiSnipeExtensionMinutes}
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
