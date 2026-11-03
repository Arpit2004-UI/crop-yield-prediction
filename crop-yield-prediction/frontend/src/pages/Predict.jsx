import { useState } from "react";
import PredictionForm from "../components/PredictionForm";
import PredictionResult from "../components/PredictionResult";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import useOptions from "../hooks/useOptions";
import { useToast } from "../hooks/useToast";
import { postPrediction } from "../services/api";
import { toPayload } from "../utils/validation";

export default function Predict() {
  const { options, loading, error, retry } = useOptions();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const submit = async (values) => {
    setSubmitting(true); setServerErrors({}); setFormError(null);
    try {
      const data = await postPrediction(toPayload(values));
      setResult(data);
      toast.success("Prediction saved to history.");
      setTimeout(() => document.getElementById("result-title")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setResult(null);
      setServerErrors(e.fields || {});
      setFormError(e.message);
      toast.error(e.message);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Predict crop yield</h1>
        <p className="mt-1 text-soil-700">All fields are required. Only the states and districts the model was trained on are available.</p>
      </div>
      {loading && <LoadingSpinner label="Loading supported crops and districts…" />}
      {error && <ErrorMessage message={error} onRetry={retry} />}
      {options && (
        <>
          {formError && <ErrorMessage message={formError} />}
          <PredictionForm options={options} submitting={submitting} serverErrors={serverErrors} onSubmit={submit} />
        </>
      )}
      {result && <PredictionResult result={result} />}
    </div>
  );
}
