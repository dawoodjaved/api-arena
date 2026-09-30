"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export function SwaggerDocs({ spec }: { spec: object }) {
  if (!spec) {
    return <p className="text-gray-400">No OpenAPI specification available.</p>;
  }

  return (
    <div className="swagger-wrapper rounded-lg overflow-hidden bg-white">
      <SwaggerUI spec={spec} docExpansion="list" defaultModelsExpandDepth={1} />
    </div>
  );
}
