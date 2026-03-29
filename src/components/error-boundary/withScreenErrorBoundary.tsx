import React, { ComponentType, ErrorInfo } from "react";
import {
  ScreenErrorBoundary,
  type ScreenErrorBoundaryProps,
} from "./ScreenErrorBoundary";

interface WithScreenErrorBoundaryOptions {
  catchErrors?: ScreenErrorBoundaryProps["catchErrors"];
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: React.ReactNode;
}

/**
 * HOC that wraps a screen with a ScreenErrorBoundary.
 *
 * @example
 * ```tsx
 * export default withScreenErrorBoundary(HomeScreen, "HomeScreen");
 * ```
 */
export function withScreenErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  screenName: string,
  options: WithScreenErrorBoundaryOptions = {},
): ComponentType<P> {
  const { catchErrors = "always", onError, fallback } = options;

  const WithErrorBoundary = (props: P) => {
    return (
      <ScreenErrorBoundary
        screenName={screenName}
        catchErrors={catchErrors}
        onError={onError}
        fallback={fallback}
      >
        <WrappedComponent {...props} />
      </ScreenErrorBoundary>
    );
  };

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";
  WithErrorBoundary.displayName = `withScreenErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}
