from pathlib import Path
import re
import sys

jsx = Path("src/AdminPanel.jsx")
css = Path("src/AdminPanel.css")

s = jsx.read_text()
c = css.read_text()

# 1. Adiciona os estados do seletor recolhido e a referência do formulário.
marker = '  const [waitFormOpen, setWaitFormOpen] = useState(false);'
if 'waitProductPickerOpen' not in s:
    if marker not in s:
        sys.exit("ERRO: estado waitFormOpen não encontrado.")
    s = s.replace(marker, marker + '''
  const [waitProductPickerOpen, setWaitProductPickerOpen] = useState(false);
  const [waitProductSearch, setWaitProductSearch] = useState("");
  const [waitProductCategory, setWaitProductCategory] = useState("Todas");
  const waitFormRef = useRef(null);
''', 1)

# 2. Rolagem suave quando muda de seção ou abre o formulário da fila.
effect_marker = '  function flash(message) {'
if 'waitFormRef.current?.scrollIntoView' not in s:
    if effect_marker not in s:
        sys.exit("ERRO: função flash não encontrada.")
    s = s.replace(effect_marker, '''
  useEffect(() => {
    if (tab === "pedidos" && waitFormOpen) {
      const frame = window.requestAnimationFrame(() => {
        waitFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab, waitFormOpen]);

''' + effect_marker, 1)

# 3. Substitui a galeria sempre visível por seletor recolhido.
start = s.find('<div className="cb-wait-product-field">')
end_marker = '</div>\n                <label>Quantidade'
end = s.find(end_marker, start)

if start < 0 or end < 0:
    sys.exit("ERRO: não encontrei os limites do seletor de produtos.")

old = s[start:end + len('</div>')]
new = r'''<div className="cb-wait-product-field">
  <div className="cb-wait-product-title">
    <span>Produto desejado</span>
    <small>Escolha um produto do catálogo ou pesquise pelo nome.</small>
  </div>

  {waitForm.product && (() => {
    const selected = products.find((p) => p.name === waitForm.product);
    const photo = selected?.imageUrl || selected?.images?.[0] ||
      (selected?.image?.startsWith("http") ? selected.image : "");
    return (
      <div className="cb-wait-selected-product">
        <span className="cb-wait-selected-photo">
          {photo ? <img src={photo} alt={selected?.name || waitForm.product} /> :
            <span>{selected?.emoji || "🎀"}</span>}
        </span>
        <span className="cb-wait-selected-info">
          <b>{waitForm.product}</b>
          {selected && <strong>{money(selected.price)}</strong>}
        </span>
        <button type="button" className="cb-secondary"
          onClick={() => setWaitProductPickerOpen((open) => !open)}>
          {waitProductPickerOpen ? "Fechar" : "Trocar"}
        </button>
      </div>
    );
  })()}

  {!waitForm.product && (
    <button type="button" className="cb-wait-choose-button"
      onClick={() => setWaitProductPickerOpen((open) => !open)}>
      <Package size={19} />
      <span>Escolher produto</span>
      <Search size={17} />
    </button>
  )}

  {waitProductPickerOpen && (
    <div className="cb-wait-product-picker">
      <div className="cb-wait-product-tools">
        <label className="cb-wait-product-search">
          <Search size={17} />
          <input type="search" value={waitProductSearch}
            onChange={(e) => setWaitProductSearch(e.target.value)}
            placeholder="Buscar produto..." />
          {waitProductSearch && (
            <button type="button" aria-label="Limpar busca"
              onClick={() => setWaitProductSearch("")}><X size={16} /></button>
          )}
        </label>
        <label className="cb-wait-category-filter">
          <span>Categoria</span>
          <select value={waitProductCategory}
            onChange={(e) => setWaitProductCategory(e.target.value)}>
            <option value="Todas">Todas as categorias</option>
            {CATEGORIES.map((category) =>
              <option key={category} value={category}>{category}</option>
            )}
          </select>
        </label>
      </div>

      <div className="cb-wait-product-grid">
        {products.filter((p) => {
          const active = p.active !== false;
          const matchesText = `${p.name} ${p.category || ""}`
            .toLowerCase().includes(waitProductSearch.trim().toLowerCase());
          const matchesCategory = waitProductCategory === "Todas" ||
            p.category === waitProductCategory;
          return active && matchesText && matchesCategory;
        }).map((p, index) => {
          const photo = p.imageUrl || p.images?.[0] ||
            (p.image?.startsWith("http") ? p.image : "");
          const chosen = waitForm.product === p.name;
          return (
            <button type="button" key={p.id || `${p.name}-${index}`}
              className={`cb-wait-product-card ${chosen ? "selected" : ""}`}
              aria-pressed={chosen}
              onClick={() => {
                setWaitForm((current) => ({ ...current, product: p.name }));
                setWaitProductPickerOpen(false);
              }}>
              <span className="cb-wait-product-card-photo">
                {photo ? <img src={photo} alt={p.name} loading="lazy" /> :
                  <span>{p.emoji || "🎀"}</span>}
                {chosen && <span className="cb-wait-product-check">
                  <CheckCircle2 size={19} />
                </span>}
              </span>
              <span className="cb-wait-product-card-info">
                <b>{p.name}</b>
                <strong>{money(p.price)}</strong>
              </span>
            </button>
          );
        })}
        {!products.some((p) => p.active !== false) && (
          <p className="cb-wait-no-products">Nenhum produto disponível no catálogo.</p>
        )}
        {products.some((p) => p.active !== false) &&
          !products.some((p) => p.active !== false &&
            `${p.name} ${p.category || ""}`.toLowerCase()
              .includes(waitProductSearch.trim().toLowerCase()) &&
            (waitProductCategory === "Todas" || p.category === waitProductCategory)) && (
            <p className="cb-wait-no-products">Nenhum produto encontrado com esses filtros.</p>
          )}
      </div>
    </div>
  )}

  {!waitForm.product && (
    <small className="cb-wait-select-hint">Selecione um produto para continuar.</small>
  )}
  {waitForm.product && (
    <p className="cb-wait-selected-label">
      <CheckCircle2 size={16} /> Selecionado: {waitForm.product}
    </p>
  )}
  <input type="text" value={waitForm.product} readOnly required
    aria-label="Produto selecionado" className="cb-wait-validation-input"
    tabIndex={-1} />
</div>'''

s = s[:start] + new + s[end + len('</div>'):]

# 4. Referência para a rolagem até o formulário.
s = s.replace(
    '<form className="cb-panel cb-order-form" onSubmit={createWaitlistEntry}>',
    '<form ref={waitFormRef} className="cb-panel cb-order-form" onSubmit={createWaitlistEntry}>',
    1
)

# 5. Sempre que o formulário for fechado, recolhe e limpa o seletor.
s = s.replace(
    'onClick={() => setWaitFormOpen(false)}',
    'onClick={() => { setWaitFormOpen(false); setWaitProductPickerOpen(false); }}'
)

# Abre o formulário com o seletor fechado.
s = s.replace(
    'setWaitFormOpen(true)',
    'setWaitProductPickerOpen(false); setWaitProductSearch(""); setWaitProductCategory("Todas"); setWaitFormOpen(true)'
)

# Reseta o seletor depois de salvar.
s = s.replace(
    '    setWaitFormOpen(false);\n    flash("Cliente adicionado à fila de espera.");',
    '    setWaitFormOpen(false);\n    setWaitProductPickerOpen(false);\n    setWaitProductSearch("");\n    setWaitProductCategory("Todas");\n    flash("Cliente adicionado à fila de espera.");',
    1
)

# Corrige a possível duplicação de reset se o trecho de salvar já foi alterado.
jsx.write_text(s)

# 6. Estilos: seletor recolhido, busca/filtro e espaçamento.
c += r'''

/* Seletor compacto de produto da fila de espera */
.cb-admin .cb-wait-selected-product {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 10px;
  border: 1px solid #efdce2;
  border-radius: 16px;
  background: #fff9fb;
}
.cb-admin .cb-wait-selected-photo {
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  overflow: hidden;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #f7e8ee;
  font-size: 24px;
}
.cb-admin .cb-wait-selected-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cb-admin .cb-wait-selected-info {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-wrap: anywhere;
}
.cb-admin .cb-wait-selected-info strong {
  color: #9b6178;
}
.cb-admin .cb-wait-choose-button {
  width: 100%;
  min-height: 52px;
  margin-top: 12px;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px dashed #d8a8b9;
  border-radius: 15px;
  background: #fff8fb;
  color: #87516a;
  font: inherit;
  cursor: pointer;
}
.cb-admin .cb-wait-product-picker {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #f0dfe5;
  border-radius: 16px;
  background: #fffafb;
}
.cb-admin .cb-wait-product-tools {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(150px, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}
.cb-admin .cb-wait-product-search {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid #ead8df;
  border-radius: 12px;
  background: #fff;
}
.cb-admin .cb-wait-product-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
}
.cb-admin .cb-wait-product-search button {
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: inherit;
}
.cb-admin .cb-wait-category-filter {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
}
.cb-admin .cb-wait-category-filter select {
  width: 100%;
  min-width: 0;
  padding: 10px;
  border: 1px solid #ead8df;
  border-radius: 12px;
  background: white;
}
.cb-admin .cb-order-form > label {
  margin-top: 22px;
}
.cb-admin .cb-order-form .cb-form-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f1e5e9;
  gap: 12px;
}
.cb-admin .cb-order-form {
  scroll-margin-top: 18px;
}
@media (max-width: 560px) {
  .cb-admin .cb-wait-product-tools {
    grid-template-columns: 1fr;
  }
  .cb-admin .cb-wait-selected-product {
    flex-wrap: wrap;
  }
  .cb-admin .cb-wait-selected-info {
    flex-basis: calc(100% - 85px);
  }
  .cb-admin .cb-wait-selected-product > button {
    width: 100%;
  }
  .cb-admin .cb-order-form .cb-form-actions {
    margin-top: 22px;
    flex-wrap: wrap;
  }
}
'''
css.write_text(c)

print("Alterações aplicadas.")
