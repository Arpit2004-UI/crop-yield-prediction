import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-soil-700">That address does not exist in this application.</p>
      <Link to="/" className="btn-primary mt-6">Go to home</Link>
    </div>
  );
}
