import React, { Component, ErrorInfo, ReactNode } from "react";
import { devWarn } from "@/utils/logger";
import { type ErrorCatchMode, isErrorCatchingEnabled } from "@/config/config.base";
import { ScreenErrorFallback } from "./ScreenErrorFallback";

export interface ScreenErrorBoundaryProps {
  children: ReactNode;
  screenName: string;
  catchErrors?: ErrorCatchMode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ScreenErrorBoundary extends Component<
  ScreenErrorBoundaryProps,
  State
> {
  static defaultProps = {
    catchErrors: "always" as const,
  };

  override state: State = {
    error: null,
    errorInfo: null,
  };

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (!isErrorCatchingEnabled(this.props.catchErrors!)) {
      throw error;
    }

    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);

    if (__DEV__) {
      devWarn(
        "screen-error-boundary",
        `Error in ${this.props.screenName}:`,
        error,
        errorInfo.componentStack,
      );
    }
  }

  resetError = () => {
    this.setState({ error: null, errorInfo: null });
  };

  override shouldComponentUpdate(
    nextProps: Readonly<ScreenErrorBoundaryProps>,
    nextState: Readonly<State>,
  ): boolean {
    return (
      nextState.error !== this.state.error ||
      nextProps.children !== this.props.children
    );
  }

  override render() {
    const { children, screenName, fallback } = this.props;
    const { error, errorInfo } = this.state;

    if (isErrorCatchingEnabled(this.props.catchErrors!) && error) {
      if (fallback) return fallback;

      return (
        <ScreenErrorFallback
          screenName={screenName}
          error={error}
          errorInfo={errorInfo}
          onRetry={this.resetError}
        />
      );
    }

    return children;
  }
}
