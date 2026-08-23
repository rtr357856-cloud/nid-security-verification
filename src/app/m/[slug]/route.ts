import type { NextRequest } from "next/server";

import { createPublicClient } from "@/lib/supabase/public";
import { buildDeepLink } from "@/lib/deep-link";
import { parseUserAgent } from "@/lib/ua";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const userAgent = request.headers.get("user-agent") ?? "";

  const supabase = createPublicClient();

  const { data: link } = await supabase
    .rpc("resolve_link", { p_slug: slug })
    .maybeSingle();

  if (!link) {
    return htmlResponse(page({ kind: "not-found" }));
  }

  if (link.status !== "active") {
    return htmlResponse(page({ kind: "inactive" }));
  }

  // Record the visit (fire-and-forget — analytics must never block the redirect).
  const device = parseUserAgent(userAgent);
  void (async () => {
    try {
      await supabase.from("clicks").insert({
        link_id: link.id,
        device_type: device.device_type,
        browser: device.browser,
        os: device.os,
      });
    } catch {
      // Analytics is best-effort.
    }
  })();

  const uri = buildDeepLink({
    platform: link.platform,
    recipientNumber: link.recipient_number,
    message: link.message,
    userAgent,
  });

  return htmlResponse(
    page({
      kind: "redirect",
      uri,
      recipient: link.recipient_number,
      message: link.message,
    }),
  );
}

function htmlResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type PageOptions =
  | { kind: "not-found" }
  | { kind: "inactive" }
  | { kind: "redirect"; uri: string; recipient: string; message: string };

function page(opts: PageOptions): string {
  if (opts.kind === "not-found") {
    return shell({
      title: "Link not found",
      body: `
        <div class="icon">?</div>
        <h1>This link isn&rsquo;t valid</h1>
        <p>The link you opened doesn&rsquo;t exist or may have been removed.</p>
      `,
    });
  }

  if (opts.kind === "inactive") {
    return shell({
      title: "Link unavailable",
      body: `
        <div class="icon">!</div>
        <h1>This link is currently unavailable</h1>
        <p>The owner has disabled this link. Please try again later.</p>
      `,
    });
  }

  const uri = escapeHtml(opts.uri);
  const recipient = escapeHtml(opts.recipient);
  const message = escapeHtml(opts.message);

  return shell({
    title: "Opening your messaging app…",
    body: `
      <div class="icon spinner"></div>
      <h1>Opening your messaging app…</h1>
      <p>If nothing happens, tap the button below.</p>

      <div class="preview">
        <div class="row"><span>To</span><code>${recipient}</code></div>
        <div class="row message">${message}</div>
      </div>

      <a class="btn" href="${uri}">Open Messaging App</a>
      <button class="btn ghost" id="copy">Copy Message</button>
      <p class="hint">Only the recipient and message are pre-filled. You press Send.</p>

      <script>
        (function () {
          setTimeout(function () {
            window.location.href = ${JSON.stringify(opts.uri)};
          }, 150);
          document.getElementById("copy").addEventListener("click", function () {
            var text = ${JSON.stringify(opts.message)};
            if (navigator.clipboard) {
              navigator.clipboard.writeText(text).then(function () {
                var b = document.getElementById("copy");
                b.textContent = "Copied!";
                setTimeout(function () { b.textContent = "Copy Message"; }, 1500);
              });
            } else {
              var ta = document.createElement("textarea");
              ta.value = text;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand("copy");
              document.body.removeChild(ta);
            }
          });
        })();
      </script>
    `,
  });
}

function shell({ title, body }: { title: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #f1f5f9;
        color: #0f172a;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .card {
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        padding: 32px 24px;
        width: 100%;
        max-width: 380px;
        text-align: center;
      }
      .icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: #eff6ff;
        color: #2563eb;
        font-size: 26px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .spinner {
        border: 3px solid #bfdbfe;
        border-top-color: #2563eb;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      h1 { font-size: 20px; margin-bottom: 8px; }
      p { font-size: 14px; color: #475569; line-height: 1.5; }
      .preview {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px;
        margin: 20px 0;
        text-align: left;
      }
      .row { font-size: 14px; color: #0f172a; margin-bottom: 6px; }
      .row span { display: block; font-size: 11px; text-transform: uppercase; color: #94a3b8; }
      .row.message { white-space: pre-wrap; word-break: break-word; }
      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        background: #e2e8f0;
        padding: 1px 6px;
        border-radius: 6px;
        font-size: 13px;
      }
      .btn {
        display: block;
        width: 100%;
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 12px;
        padding: 14px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        margin-bottom: 10px;
      }
      .btn.ghost {
        background: transparent;
        color: #2563eb;
        border: 1px solid #bfdbfe;
      }
      .hint { margin-top: 14px; font-size: 12px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="card">
      ${body}
    </div>
  </body>
</html>`;
}
