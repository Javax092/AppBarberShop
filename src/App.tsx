import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";

import { Spinner } from "./components/ui/Spinner.tsx";
import { router } from "./router/index.tsx";

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="shell flex min-h-screen items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}
