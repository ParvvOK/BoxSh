import React from "react";

type Props = {
  onRun: () => void;
  titleClassName?: string;
};

export function AppHeader({ onRun, titleClassName }: Props) {
  return (
    <div className="flex items-center w-full justify-between">
      <h2 className={`font-extrabold tracking-tight ${titleClassName ?? "text-4xl"}`}>BoxSh</h2>
      <button
        onClick={onRun}
        className="px-4 py-2 font-bold bg-gray-700 hover:bg-gray-600 rounded-md transition"
      >
        Run
      </button>
    </div>
  );
}
