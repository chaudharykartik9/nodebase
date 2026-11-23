"use client";

import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

// Text built from the current time or the viewer's time zone differs between
// the server (which renders the page first) and the browser. React would report
// a mismatch, so these two components keep the server text stable.

// "2 minutes ago". The server and the browser can be a few seconds apart, which
// can flip the text, so a difference here is accepted on purpose.
export const RelativeTime = ({ date }: { date: Date }) => {
  return (
    <span suppressHydrationWarning>
      {formatDistanceToNow(date, { addSuffix: true })}
    </span>
  );
};

// A date and time in the viewer's own time zone. The server does not know that
// zone, so it renders the same moment in UTC, and the browser switches to local
// time right after the page has loaded.
export const LocalTime = ({ date }: { date: Date }) => {
  const [local, setLocal] = useState(false);

  useEffect(() => {
    setLocal(true);
  }, []);

  return (
    <time dateTime={date.toISOString()}>
      {local
        ? format(date, "PPpp")
        : `${date.toISOString().slice(0, 19).replace("T", " ")} UTC`}
    </time>
  );
};
