"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const source = searchParams.get("source");

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setVerifying(false);
        setError("Invalid verification link. No token provided.");
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/auth/verify-email/${token}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Verification failed");
        }

        setSuccess(true);

        // If this verification came from the extension, we need to store the token
        if (source === "extension") {
          // This code only runs if in a browser extension context
          if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({
              knuggetUserInfo: {
                ...data.user,
                token: data.token,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
              },
            });

            // Notify other extension components
            chrome.runtime.sendMessage({
              type: "AUTH_STATE_CHANGED",
              payload: { isLoggedIn: true },
            });

            // Close this tab after 1.5 seconds to return to YouTube
            setTimeout(() => {
              window.close();
            }, 1500);
          }
        } else {
          // Normal web app flow - redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError((err as Error).message || "Verification failed. Please try again.");
      } finally {
        setVerifying(false);
      }
    }

    verifyEmail();
  }, [token, router, source]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8 text-center">
        {verifying ? (
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Verifying your email
            </h2>
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        ) : success ? (
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Email verified!
            </h2>
            <div className="mt-6">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="mt-6 text-gray-600">
              Your email has been successfully verified.
            </p>
            {source === "extension" ? (
              <p className="mt-2 text-gray-600">
                You can now close this tab and return to using the extension.
              </p>
            ) : (
              <p className="mt-2 text-gray-600">
                You will be redirected to the dashboard shortly.
              </p>
            )}
          </div>
        ) : (
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Verification Failed
            </h2>
            <div className="mt-6">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="mt-6 text-red-600">{error}</p>
            <div className="mt-6">
              <Link
                href="/auth/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Return to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
