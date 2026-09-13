export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        This module isn't wired up yet. We'll build it in the next round, same way we did
        Dashboard, Students, and Teachers.
      </p>
    </div>
  );
}
