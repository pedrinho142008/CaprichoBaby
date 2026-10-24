from pathlib import Path

p = Path("src/AdminPanel.jsx")
s = p.read_text()

def rep(old, new, label):
    global s
    n = s.count(old)
    if n != 1:
        raise SystemExit(f"Cancelado: '{label}' encontrado {n} vezes. Arquivo não alterado.")
    s = s.replace(old, new, 1)

rep(
'''  MessageCircle, Eye, EyeOff, Upload, LayoutDashboard, Users
''',
'''  MessageCircle, Eye, EyeOff, Upload, LayoutDashboard, Users, Tags
''', "ícones")

rep(
'''const CATEGORIES = ["Roupinhas", "Vestidos", "Brinquedos", "Acessórios", "Presentes"];''',
'''const DEFAULT_CATEGORIES = ["Roupinhas", "Vestidos", "Brinquedos", "Acessórios", "Presentes"];
const CLOTHING_SIZES = ["RN", "P", "M", "G", "GG", "1", "2", "3", "4", "6", "8", "10", "12", "14", "16"];
const SHOE_SIZES = ["15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"];
const SIZELESS_CATEGORIES = ["Brinquedos", "Presentes", "Acessórios"];''',
"categorias padrão")

rep(
'''  image: "", imageUrl: "", images: [], description: "", active: true
};''',
'''  image: "", imageUrl: "", images: [], description: "", active: true, sizes: []
};''', "campo de tamanhos")

rep(
'''  const [tab, setTab] = useState("inicio");''',
'''  const [tab, setTab] = useState("inicio");
  const [categories, setCategories] = useState(() => {
    const saved = read("caprichobaby_categories", DEFAULT_CATEGORIES);
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_CATEGORIES;
  });
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [categoryName, setCategoryName] = useState("");''',
"estado das categorias")

rep(
'''  useEffect(() => {
    try { localStorage.setItem("caprichobaby_products", JSON.stringify(products)); } catch {}
  }, [products]);''',
'''  useEffect(() => {
    try { localStorage.setItem("caprichobaby_products", JSON.stringify(products)); } catch {}
  }, [products]);

  useEffect(() => {
    try { localStorage.setItem("caprichobaby_categories", JSON.stringify(categories)); } catch {}
  }, [categories]);''',
"persistência das categorias")

rep(
'''  const visibleProducts = useMemo(() => products.filter((p) => {''',
'''  const sizeOptions = /calç|calc|sapato|tênis|tenis|sandália|sandalia|bota/i.test(form.category)
    ? SHOE_SIZES
    : SIZELESS_CATEGORIES.includes(form.category) ? [] : CLOTHING_SIZES;

  function addCategory(event) {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name) return flash("Digite o nome da categoria.");
    if (categories.some((item) => item.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
      return flash("Essa categoria já existe.");
    }
    setCategories((current) => [...current, name]);
    setNewCategory("");
    flash("Categoria adicionada.");
  }

  function beginCategoryEdit(name) {
    setEditingCategory(name);
    setCategoryName(name);
  }

  function saveCategoryEdit(event) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) return flash("Digite um nome para a categoria.");
    if (categories.some((item) => item !== editingCategory && item.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
      return flash("Já existe uma categoria com esse nome.");
    }
    setCategories((current) => current.map((item) => item === editingCategory ? name : item));
    setProducts((current) => current.map((product) => product.category === editingCategory ? { ...product, category: name } : product));
    if (form.category === editingCategory) updateField("category", name);
    if (categoryFilter === editingCategory) setCategoryFilter(name);
    setEditingCategory("");
    setCategoryName("");
    flash("Categoria renomeada.");
  }

  function deleteCategory(name) {
    if (products.some((product) => product.category === name)) {
      return flash("Há produtos nessa categoria. Mova-os antes de excluí-la.");
    }
    if (!window.confirm(`Excluir a categoria "${name}"?`)) return;
    setCategories((current) => current.filter((item) => item !== name));
    if (categoryFilter === name) setCategoryFilter("Todas");
    flash("Categoria excluída.");
  }

  const visibleProducts = useMemo(() => products.filter((p) => {''',
"funções de categorias")

rep(
'''    { id: "produtos", label: "Produtos", icon: Package },
    { id: "pedidos", label: "Fila de espera", icon: Users }''',
'''    { id: "produtos", label: "Produtos", icon: Package },
    { id: "categorias", label: "Categorias", icon: Tags },
    { id: "pedidos", label: "Fila de espera", icon: Users }''',
"menu de categorias")

# Trocar todas as referências à constante antiga, preservando as variáveis locais.
if "CATEGORIES.map" not in s or s.count("CATEGORIES.map") != 3:
    raise SystemExit("Cancelado: quantidade inesperada de seletores de categoria.")
s = s.replace("CATEGORIES.map", "categories.map")

rep(
'''<label>Categoria<select value={form.category} onChange={(e) => updateField("category", e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>''',
'''<label>Categoria<select value={form.category} onChange={(e) => {
                  const category = e.target.value;
                  setForm((old) => ({ ...old, category, sizes: SIZELESS_CATEGORIES.includes(category) ? [] : (old.sizes || []) }));
                }}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>''',
"seletor do formulário")

rep(
'''              <label>Descrição<textarea rows="4" value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} placeholder="Descreva tecido, tamanho, cores e outros detalhes." /></label>''',
'''              {!SIZELESS_CATEGORIES.includes(form.category) && <section className="cb-size-picker">
                <h3>Tamanhos disponíveis</h3>
                <p>Marque os tamanhos que existem para este produto.</p>
                <div className="cb-size-options">
                  {sizeOptions.map((size) => <label key={size} className="cb-size-option">
                    <input type="checkbox" checked={(form.sizes || []).includes(size)} onChange={(e) => updateField("sizes", e.target.checked ? [...new Set([...(form.sizes || []), size])] : (form.sizes || []).filter((item) => item !== size))} />
                    <span>{size}</span>
                  </label>)}
                </div>
                <label>Adicionar tamanho personalizado<input value={form.customSize || ""} onChange={(e) => updateField("customSize", e.target.value)} placeholder="Ex.: 18 meses ou tamanho único" /></label>
                <button type="button" className="cb-secondary" onClick={() => {
                  const custom = (form.customSize || "").trim();
                  if (!custom) return flash("Digite o tamanho personalizado.");
                  if ((form.sizes || []).some((item) => item.toLocaleLowerCase("pt-BR") === custom.toLocaleLowerCase("pt-BR"))) return flash("Esse tamanho já foi selecionado.");
                  setForm((old) => ({ ...old, sizes: [...(old.sizes || []), custom], customSize: "" }));
                }}>Adicionar tamanho</button>
                {(form.sizes || []).length > 0 && <p>Selecionados: {(form.sizes || []).join(", ")}</p>}
              </section>}
              <label>Descrição<textarea rows="4" value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} placeholder="Descreva tecido, tamanhos, cores e outros detalhes." /></label>''',
"seletor de tamanhos")

rep(
'''          {tab === "pedidos" && <>''',
'''          {tab === "categorias" && <>
            <div className="cb-page-heading">
              <div><span className="cb-eyebrow">ORGANIZAÇÃO DA LOJA</span><h1>Categorias</h1><p>Crie e organize as categorias do catálogo.</p></div>
            </div>
            <section className="cb-panel">
              <h2>Adicionar categoria</h2>
              <form className="cb-category-add" onSubmit={addCategory}>
                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Ex.: Calçados, Bodies, Kits..." aria-label="Nome da nova categoria" />
                <button className="cb-primary" type="submit"><Plus size={17} /> Adicionar</button>
              </form>
              <div className="cb-category-list">
                {categories.map((category) => <div className="cb-category-row" key={category}>
                  {editingCategory === category ? <form className="cb-category-edit" onSubmit={saveCategoryEdit}>
                    <input autoFocus value={categoryName} onChange={(e) => setCategoryName(e.target.value)} aria-label="Novo nome da categoria" />
                    <button className="cb-primary" type="submit"><Save size={15} /> Salvar</button>
                    <button className="cb-secondary" type="button" onClick={() => { setEditingCategory(""); setCategoryName(""); }}>Cancelar</button>
                  </form> : <>
                    <div><b>{category}</b><small>{products.filter((product) => product.category === category).length} produto(s) vinculado(s)</small></div>
                    <div className="cb-category-actions">
                      <button type="button" className="cb-icon-action" onClick={() => beginCategoryEdit(category)} aria-label={`Renomear ${category}`}><Pencil size={16} /></button>
                      <button type="button" className="cb-icon-action" onClick={() => deleteCategory(category)} aria-label={`Excluir ${category}`}><Trash2 size={16} /></button>
                    </div>
                  </>}
                </div>)}
              </div>
              <p className="cb-help-note">Ao renomear uma categoria, os produtos vinculados são atualizados. Categorias com produtos não podem ser excluídas.</p>
            </section>
          </>}

          {tab === "pedidos" && <>''',
"tela de categorias")

backup = p.with_name("AdminPanel.jsx.backup-aplicacao-manual")
backup.write_text(p.read_text())
p.write_text(s)
print("Atualização aplicada; backup salvo em", backup)
