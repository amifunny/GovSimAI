export function Footer() {
  return (
    <footer className="border-t border-neutral-200/70 py-10 mt-20">
      <div className="wrap flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500">
        <div className="font-display font-semibold text-neutral-700">
          © {new Date().getFullYear()} GovSim AI · Multi-agent policy simulator
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip chip-primary">BYOK · OpenAI</span>
          <span className="chip chip-tertiary">Qdrant RAG</span>
          <span className="chip chip-secondary">MCP adapters</span>
        </div>
      </div>
    </footer>
  );
}
