import { useEffect, useState } from "react";
import { getOptions } from "../services/api";

export default function useOptions() {
  const [state, setState] = useState({ options: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setState({ options: null, loading: true, error: null });
    getOptions()
      .then((d) => alive && setState({ options: d.options, loading: false, error: null }))
      .catch((e) => alive && setState({ options: null, loading: false, error: e.message }));
    return () => { alive = false; };
  }, [attempt]);
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
