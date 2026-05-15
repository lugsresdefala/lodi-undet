import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

const SITE_TITLE = "lodi-t — Hormonização com testosterona, referência clínica";
const SITE_DESCRIPTION =
  "Modelo farmacocinético do undecilato de testosterona para ajustar intervalos posológicos individualizados. Endocrine Society 2017, WPATH SOC-8.";
const SITE_URL = "https://lodi-undet.lovable.app";
const OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/65a6ecf9-c43e-4b68-8bf7-1850b798668d";

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "lodi-t",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
};

const SITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "lodi-t",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "pt-PT",
};

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "author", content: "lodi-t" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "lodi-t" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(ORG_JSONLD),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(SITE_JSONLD),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
