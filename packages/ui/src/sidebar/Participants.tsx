import React from "react";

export function Participants({ users }: { users: string[] }) {
  return (
    <div className="w-full">
      <div className="text-sm text-gray-300 mb-2">Participants</div>
      <ul className="max-h-64 overflow-y-auto divide-y divide-gray-800 rounded-md bg-[#1b1b1b] border border-gray-800">
        {users.length === 0 && (
          <li className="px-3 py-2 text-gray-500">No participants yet</li>
        )}
        {users.map((name) => (
          <li key={name} className="px-3 py-2">
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
