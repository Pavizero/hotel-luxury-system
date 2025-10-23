if (typeof window !== "undefined") {
  window.onerror = function(message, source, lineno, colno, error) {
    console.error("[UNCAUGHT ERROR]", { message, source, lineno, colno, error });
  };
  window.onunhandledrejection = function(event) {
    console.error("[UNHANDLED REJECTION]", event.reason);
  };
}