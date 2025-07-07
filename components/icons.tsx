import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 2L1 9l4 1.5V21h14v-9.5L23 9l-11-7zm-4.5 10.5L12 15l4.5-2.5L12 10l-4.5 2.5zM17 19H7v-5.5l5 2.75 5-2.75V19z"></path>
    </svg>
  );
}
