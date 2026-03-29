import React, { Component, ErrorInfo, ReactNode } from "react";
import { ErrorDetails } from "./ErrorDetails";
import { type ErrorCatchMode, isErrorCatchingEnabled } from "@/config/config.base";

interface Props {
  children: ReactNode;
  catchErrors: ErrorCatchMode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, errorInfo: null };

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (!isErrorCatchingEnabled(this.props.catchErrors)) return;
    this.setState({ error, errorInfo });
  }

  resetError = () => {
    this.setState({ error: null, errorInfo: null });
  };

  override shouldComponentUpdate(
    nextProps: Readonly<Props>,
    nextState: Readonly<State>,
  ): boolean {
    return (
      nextState.error !== this.state.error ||
      nextProps.children !== this.props.children
    );
  }

  override render() {
    return isErrorCatchingEnabled(this.props.catchErrors) && this.state.error ? (
      <ErrorDetails
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        onReset={this.resetError}
      />
    ) : (
      this.props.children
    );
  }
}
