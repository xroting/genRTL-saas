import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
    }

    const supabase = await createSupabaseServer();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth] Code exchange error:", error);
      return NextResponse.redirect(`${origin}/auth/login?error=${error.message}`);
    }

    console.log("[Auth] OAuth callback successful:", data.user?.email);

    // Create HTML that sends message to opener window (VS Code extension)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              padding: 2rem;
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            h1 { margin: 0 0 1rem 0; }
            p { margin: 0.5rem 0; opacity: 0.9; }
            .spinner {
              border: 3px solid rgba(255, 255, 255, 0.3);
              border-top-color: white;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 1rem auto;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h1>✓ Login Successful!</h1>
            <p>Returning to VS Code...</p>
            <p style="font-size: 0.875rem; margin-top: 1rem;">
              You can close this window if it doesn't close automatically.
            </p>
          </div>
          <script>
            const authData = {
              type: 'auth_success',
              token: '${data.session.access_token}',
              user: {
                id: '${data.user.id}',
                email: '${data.user.email}',
                name: '${data.user.user_metadata?.name || data.user.email}'
              }
            };
            
            // Try to send to opener (VS Code extension webview)
            if (window.opener) {
              window.opener.postMessage(authData, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              // Fallback: store in localStorage and redirect
              localStorage.setItem('genrtl_auth', JSON.stringify(authData));
              setTimeout(() => {
                window.location.href = '/';
              }, 1500);
            }
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("[Auth] Callback error:", error);
    const { origin } = new URL(req.url);
    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
  }
}

