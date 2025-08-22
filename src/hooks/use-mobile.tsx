"use client";


import * as React from "react";


const MOBILE_BREAKPOINT = 768;


/**
* SSR-safe mobile breakpoint detector.
* Why: Prevents importing this hook from a Server Component without a client boundary.
*/
export function useIsMobile() {
const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);


React.useEffect(() => {
const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);


mql.addEventListener("change", onChange);
onChange();
return () => mql.removeEventListener("change", onChange);
}, []);


return !!isMobile;
}