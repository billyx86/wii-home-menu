import { useEffect } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { useI18n } from "@/lib/i18n";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      {
        name: "description",
        content: "A polished recreation of the classic Wii Home Menu — channels, soft UI sounds, and living-room vibes.",
      },
      { title: "Wii Home Menu" },
      { name: "theme-color", content: "#d0d7e0" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootDocument,
});

function RootDocument() {
  const locale = useI18n((s) => s.locale);
  useEffect(() => {
    // React does not patch attributes on <html> during hydration, so reconcile
    // the persisted client locale onto the DOM element once hydrated.
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    // Keep suppressHydrationWarning: SSR never knows the persisted client locale, so initial hydration may differ.
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
