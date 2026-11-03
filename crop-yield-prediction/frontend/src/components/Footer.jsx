import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-soil-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-soil-700 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-2">
          <Logo />
          <p>Predictions are estimates from a model trained on historical district data (1966–2017). They are not guaranteed agricultural outcomes.</p>
        </div>
        <p className="max-w-sm">A college project for local or trusted demonstration use. Not validated for current agricultural conditions.</p>
      </div>
    </footer>
  );
}
