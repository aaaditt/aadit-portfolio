/** True on the plain list page, where the world is switched off. */
export const isListPage = (pathname: string) => pathname === "/work" || pathname.startsWith("/work/");
