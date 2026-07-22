import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("Vertus app error boundary caught:", error, info);
    }
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          padding: "40px 24px",
          textAlign: "center",
          background: "#1A2E1A",
          color: "#E8E3D2",
          fontFamily: "'Lato',sans-serif",
        }}
      >
        <h1
          style={{
            fontFamily: "'Newsreader',Georgia,serif",
            fontWeight: 600,
            fontSize: "clamp(24px,4vw,40px)",
            lineHeight: 1.15,
            margin: 0,
            maxWidth: "22ch",
          }}
        >
          Algo salió mal. · Something went wrong.
        </h1>
        <p
          style={{
            fontSize: "16px",
            lineHeight: 1.6,
            color: "#AFBEAF",
            margin: 0,
            maxWidth: "48ch",
          }}
        >
          Vuelve a cargar la página para continuar. · Please reload the page to
          continue.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            fontFamily: "'Prompt',sans-serif",
            fontWeight: 600,
            fontSize: "15px",
            letterSpacing: ".04em",
            color: "#1A2E1A",
            background: "#8BC53F",
            border: "none",
            borderRadius: "22px",
            padding: "14px 30px",
            cursor: "pointer",
          }}
        >
          Recargar · Reload
        </button>
      </div>
    );
  }
}
