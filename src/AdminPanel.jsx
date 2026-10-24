import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Package, ShoppingBag, Plus, Search, Pencil, Trash2,
  ImagePlus, X, Save, ClipboardList, CheckCircle2, Clock3,
  MessageCircle, Eye, EyeOff, Upload, LayoutDashboard, Users, Tags
} from "lucide-react";
import "./AdminPanel.css";

const DEFAULT_CATEGORIES = ["Roupinhas", "Vestidos", "Brinquedos", "Acessórios", "Presentes"];
const CLOTHING_SIZES = ["RN", "P", "M", "G", "GG", "1", "2", "3", "4", "6", "8", "10", "12", "14", "16"];
const SHOE_SIZES = ["15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"];
const SIZELESS_CATEGORIES = ["Brinquedos", "Presentes", "Acessórios"];
const STATUSES = ["Novo", "Em atendimento", "Aguardando pagamento", "Concluído", "Cancelado"];
const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};
const makeId = () => Date.now() + Math.floor(Math.random() * 10000);

const emptyProduct = {
  name: "", category: "Roupinhas", price: "", oldPrice: "",
  tag: "Novidade", emoji: "🎀", color: "product-pink",
  image: "", imageUrl: "", images: [], description: "", active: true, sizes: []
};

function AdminPanel({ products, setProducts, onClose }) {
  const [tab, setTab] = useState("inicio");
  const [categories, setCategories] = useState(() => {
    const saved = read("caprichobaby_categories", DEFAULT_CATEGORIES);
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_CATEGORIES;
  });
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [orders, setOrders] = useState(() => read("caprichobaby_orders", []));
  const [waitlist, setWaitlist] = useState(() => read("caprichobaby_waitlist", []));
  const [waitFormOpen, setWaitFormOpen] = useState(false);
  const [waitProductPickerOpen, setWaitProductPickerOpen] = useState(false);
  const [waitProductSearch, setWaitProductSearch] = useState("");
  const [waitProductCategory, setWaitProductCategory] = useState("Todas");
  const waitFormRef = useRef(null);

  const [waitForm, setWaitForm] = useState({
    customer: "", phone: "", product: "", quantity: "1",
    size: "", color: "", notes: "", status: "Aguardando"
  });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [notice, setNotice] = useState("");
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({ customer: "", phone: "", items: "", total: "", notes: "" });
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem("caprichobaby_orders", JSON.stringify(orders)); } catch {}
  }, [orders]);

  useEffect(() => {
    try { localStorage.setItem("caprichobaby_waitlist", JSON.stringify(waitlist)); } catch {}
  }, [waitlist]);

  useEffect(() => {
    try { localStorage.setItem("caprichobaby_products", JSON.stringify(products)); } catch {}
  }, [products]);

  useEffect(() => {
    try { localStorage.setItem("caprichobaby_categories", JSON.stringify(categories)); } catch {}
  }, [categories]);


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

  function flash(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }

  const sizeOptions = /calç|calc|sapato|tênis|tenis|sandália|sandalia|bota/i.test(form.category)
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

  const visibleProducts = useMemo(() => products.filter((p) => {
    const matchText = `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase());
    return matchText && (categoryFilter === "Todas" || p.category === categoryFilter);
  }), [products, query, categoryFilter]);

  const totalValue = orders.filter((o) => o.status !== "Cancelado").reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pending = orders.filter((o) => !["Concluído", "Cancelado"].includes(o.status)).length;
  const waitPending = waitlist.filter((item) => item.status === "Aguardando").length;

  function createWaitlistEntry(event) {
    event.preventDefault();
    if (!waitForm.customer.trim() || !waitForm.product.trim()) {
      flash("Informe o nome do cliente e o produto desejado.");
      return;
    }
    const entry = {
      ...waitForm,
      id: makeId(),
      customer: waitForm.customer.trim(),
      phone: waitForm.phone.trim(),
      product: waitForm.product.trim(),
      quantity: Math.max(1, Number(waitForm.quantity) || 1),
      createdAt: new Date().toISOString()
    };
    setWaitlist((current) => [entry, ...current]);
    setWaitForm({
      customer: "", phone: "", product: "", quantity: "1",
      size: "", color: "", notes: "", status: "Aguardando"
    });
    setWaitFormOpen(false);
    setWaitProductPickerOpen(false);
    setWaitProductSearch("");
    setWaitProductCategory("Todas");
    flash("Cliente adicionado à fila de espera.");
  }

  function updateWaitlistStatus(id, status) {
    setWaitlist((current) => current.map((item) =>
      item.id === id ? { ...item, status } : item
    ));
    flash("Status da fila atualizado.");
  }

  function deleteWaitlistEntry(item) {
    if (!window.confirm("Remover " + item.customer + " da fila de espera?")) return;
    setWaitlist((current) => current.filter((entry) => entry.id !== item.id));
    flash("Registro removido da fila.");
  }

  function startNew() {
    setEditing(null);
    setForm({ ...emptyProduct, id: undefined });
    setTab("produto-form");
  }

  function startEdit(product) {
    setEditing(product.id);
    setForm({ ...emptyProduct, ...product, images: product.images || [] });
    setTab("produto-form");
  }

  function updateField(key, value) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  async function processPhotos(files) {
    const selected = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    if (!selected.length) return;
    setPhotoBusy(true);
    try {
      const compressed = await Promise.all(selected.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
          const img = new Image();
          img.onerror = reject;
          img.onload = () => {
            const max = 1100;
            const ratio = Math.min(1, max / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * ratio));
            canvas.height = Math.max(1, Math.round(img.height * ratio));
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.78));
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      })));
      setForm((old) => {
        const images = [...(old.images || []), ...compressed].slice(0, 5);
        return { ...old, images, imageUrl: images[0] || old.imageUrl, image: "" };
      });
      flash(`${compressed.length} foto(s) adicionada(s).`);
    } catch {
      flash("Não foi possível carregar uma das imagens.");
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removePhoto(index) {
    setForm((old) => {
      const images = (old.images || []).filter((_, i) => i !== index);
      return { ...old, images, imageUrl: images[0] || "" };
    });
  }

  function saveProduct(event) {
    event.preventDefault();
    if (!form.name.trim() || form.price === "" || Number(form.price) < 0) {
      flash("Informe o nome e um preço válido.");
      return;
    }
    const saved = {
      ...form,
      id: editing ?? makeId(),
      name: form.name.trim(),
      price: Number(form.price),
      oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
      imageUrl: form.images?.[0] || form.imageUrl || "",
      images: form.images || [],
      active: Boolean(form.active)
    };
    setProducts((current) => editing === null
      ? [saved, ...current]
      : current.map((p) => p.id === editing ? saved : p));
    setTab("produtos");
    setEditing(null);
    flash(editing === null ? "Produto cadastrado com sucesso!" : "Produto atualizado!");
  }

  function deleteProduct(product) {
    if (!window.confirm(`Excluir "${product.name}" do catálogo?`)) return;
    setProducts((current) => current.filter((p) => p.id !== product.id));
    flash("Produto excluído.");
  }

  function toggleActive(product) {
    setProducts((current) => current.map((p) => p.id === product.id ? { ...p, active: p.active === false } : p));
    flash(product.active === false ? "Produto voltou a ficar disponível." : "Produto ocultado da loja.");
  }

  function createOrder(event) {
    event.preventDefault();
    if (!orderForm.customer.trim() || !orderForm.items.trim()) {
      flash("Informe o nome do cliente e os produtos do pedido.");
      return;
    }
    const order = {
      id: makeId(),
      customer: orderForm.customer.trim(),
      phone: orderForm.phone.trim(),
      items: orderForm.items.trim(),
      total: Number(orderForm.total || 0),
      notes: orderForm.notes.trim(),
      status: "Novo",
      createdAt: new Date().toISOString()
    };
    setOrders((current) => [order, ...current]);
    setOrderForm({ customer: "", phone: "", items: "", total: "", notes: "" });
    setOrderFormOpen(false);
    setTab("pedidos");
    flash("Pedido registrado!");
  }

  function updateStatus(id, status) {
    setOrders((current) => current.map((o) => o.id === id ? { ...o, status } : o));
  }

  function deleteOrder(order) {
    if (!window.confirm(`Excluir o pedido de ${order.customer}?`)) return;
    setOrders((current) => current.filter((o) => o.id !== order.id));
    flash("Pedido removido.");
  }

  const nav = [
    { id: "inicio", label: "Visão geral", icon: LayoutDashboard },
    { id: "produtos", label: "Produtos", icon: Package },
    { id: "categorias", label: "Categorias", icon: Tags },
    { id: "pedidos", label: "Fila de espera", icon: Users }
  ];

  if (tab === "produto-form") {
    return (
      <div className="cb-admin">
        <header className="cb-admin-top">
          <button className="cb-back" onClick={() => setTab("produtos")}><ArrowLeft size={18} /> Voltar aos produtos</button>
          <img className="cb-admin-logo" src="/icon_capricho.png" alt="Capricho Baby" />
        </header>
        <main className="cb-admin-content cb-form-page">
          <div className="cb-page-heading">
            <div><span className="cb-eyebrow">CATÁLOGO DA LOJA</span><h1>{editing === null ? "Adicionar produto" : "Editar produto"}</h1><p>Preencha os detalhes e escolha as fotos do produto.</p></div>
          </div>
          <form className="cb-product-form" onSubmit={saveProduct}>
            <section className="cb-panel">
              <h2>Informações do produto</h2>
              <label>Nome do produto<input required value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Ex.: Vestido Jardim de Flores" /></label>
              <div className="cb-form-grid">
                <label>Categoria<select value={form.category} onChange={(e) => {
                  const category = e.target.value;
                  setForm((old) => ({ ...old, category, sizes: SIZELESS_CATEGORIES.includes(category) ? [] : (old.sizes || []) }));
                }}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
                <label>Etiqueta curta<input value={form.tag || ""} onChange={(e) => updateField("tag", e.target.value)} placeholder="Novidade, Queridinho..." /></label>
                <label>Preço (R$)<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField("price", e.target.value)} placeholder="59,90" /></label>
                <label>Preço anterior (opcional)<input type="number" min="0" step="0.01" value={form.oldPrice ?? ""} onChange={(e) => updateField("oldPrice", e.target.value)} placeholder="74,90" /></label>
              </div>
              {!SIZELESS_CATEGORIES.includes(form.category) && <section className="cb-size-picker">
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
              <label>Descrição<textarea rows="4" value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} placeholder="Descreva tecido, tamanhos, cores e outros detalhes." /></label>
              <label className="cb-switch"><input type="checkbox" checked={form.active !== false} onChange={(e) => updateField("active", e.target.checked)} /><span>Produto disponível na loja</span></label>
            </section>

            <section className="cb-panel">
              <div className="cb-section-heading"><div><h2>Fotos do produto</h2><p>Até 5 imagens. A foto aparecerá inteira, sem cortes.</p></div><span className="cb-photo-count">{(form.images || []).length}/5</span></div>
              <input ref={fileRef} className="cb-hidden-input" type="file" accept="image/*" multiple onChange={(e) => processPhotos(e.target.files)} />
              
              <button type="button" className="cb-upload-zone" onClick={() => fileRef.current?.click()} disabled={photoBusy || (form.images || []).length >= 5}>
                <span className="cb-upload-icon">{photoBusy ? <Clock3 /> : <ImagePlus />}</span>
                <b>{photoBusy ? "Preparando fotos..." : "Escolher fotos da galeria"}</b>
                <small>Toque para abrir as imagens do celular</small>
                <span className="cb-upload-action"><Upload size={16} /> Selecionar imagens</span>
              </button>
              {(form.images || []).length > 0 && <div className="cb-photo-grid">{form.images.map((photo, index) => <div className="cb-photo-preview" key={`${index}-${photo.slice(0, 25)}`}><img src={photo} alt={`Foto ${index + 1}`} /><span>{index === 0 ? "Foto principal" : `Foto ${index + 1}`}</span><button type="button" onClick={() => removePhoto(index)} aria-label="Remover foto"><X size={15} /></button></div>)}</div>}
              {!(form.images || []).length && form.imageUrl && <div className="cb-photo-preview cb-single-preview"><img src={form.imageUrl} alt="Prévia do produto" /><button type="button" onClick={() => updateField("imageUrl", "")}><X size={15} /> Remover</button></div>}
              <p className="cb-help-note">Dica: prefira fotos claras e com o produto centralizado. As imagens são reduzidas para ajudar a economizar espaço no navegador.</p>
            </section>
            <div className="cb-form-actions"><button type="button" className="cb-secondary" onClick={() => setTab("produtos")}>Cancelar</button><button className="cb-primary" type="submit"><Save size={17} /> Salvar produto</button></div>
          </form>
        </main>
        {notice && <div className="cb-notice">{notice}</div>}
      </div>
    );
  }

  return (
    <div className="cb-admin">
      <header className="cb-admin-top">
        <img className="cb-admin-logo" src="/icon_capricho.png" alt="Capricho Baby" />
        <div className="cb-top-actions"><span className="cb-admin-pill"><span /> Painel da loja</span><button className="cb-store-button" onClick={onClose}><ArrowLeft size={17} /> Voltar à loja</button></div>
      </header>
      <div className="cb-admin-layout">
        <aside className="cb-sidebar">
          <div className="cb-sidebar-welcome"><span className="cb-avatar">♡</span><div><b>Olá, lojista!</b><small>Vamos cuidar da loja?</small></div></div>
          <span className="cb-nav-label">GERENCIAMENTO</span>
          {nav.map(({ id, label, icon: Icon }) => <button key={id} className={`cb-nav-item ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}><Icon size={19} /><span>{label}</span>{id === "pedidos" && waitPending > 0 && <i>{waitPending}</i>}</button>)}
          <div className="cb-sidebar-tip"><span>🌷</span><b>Um toque de carinho</b><p>Mantenha seus produtos e pedidos organizados por aqui.</p></div>
          <button className="cb-sidebar-back" onClick={onClose}><ArrowLeft size={17} /> Voltar para a loja</button>
        </aside>

        <main className="cb-admin-content">
          {tab === "inicio" && <>
            <div className="cb-page-heading"><div><span className="cb-eyebrow">SEU CANTINHO DE GESTÃO</span><h1>Visão geral <span>♡</span></h1><p>Acompanhe os produtos e a fila de espera da Capricho Baby.</p></div><button className="cb-primary" onClick={startNew}><Plus size={18} /> Novo produto</button></div>
              <div className="cb-stat-grid">
                <div className="cb-stat-card cb-stat-pink"><span className="cb-stat-icon"><Package /></span><small>Produtos cadastrados</small><strong>{products.length}</strong><span>Itens no catálogo</span></div>
                <div className="cb-stat-card cb-stat-blue"><span className="cb-stat-icon"><ClipboardList /></span><small>Na fila de espera</small><strong>{waitPending}</strong><span>Precisam de retorno</span></div>
                <div className="cb-stat-card cb-stat-yellow"><span className="cb-stat-icon"><ShoppingBag /></span><small>Clientes na fila (total)</small><strong>{waitlist.length}</strong><span>Registros de interesse</span></div>
                <div className="cb-stat-card cb-stat-lilac"><span className="cb-stat-icon"><CheckCircle2 /></span><small>Valor dos pedidos ativos</small><strong>{money(totalValue)}</strong><span>Não representa faturamento confirmado</span></div>
              </div>
              <section className="cb-panel cb-recent-panel"><div className="cb-section-heading"><div><h2>Produtos recentes</h2><p>Edite preços, fotos e disponibilidade.</p></div><button className="cb-text-button" onClick={() => setTab("produtos")}>Ver todos <ArrowLeft size={15} /></button></div>
                {products.length ? <div className="cb-recent-list">{products.slice(0, 5).map((p) => <div className="cb-recent-item" key={p.id}><div className="cb-mini-photo">{(p.imageUrl || p.images?.[0]) ? <img src={p.imageUrl || p.images[0]} alt="" /> : <span>{p.emoji || "🎀"}</span>}</div><div className="cb-recent-name"><b>{p.name}</b><small>{p.category}</small></div><strong>{money(p.price)}</strong><button className="cb-icon-action" onClick={() => startEdit(p)} aria-label="Editar produto"><Pencil size={17} /></button></div>)}</div> : <div className="cb-empty"><Package /><p>Nenhum produto cadastrado.</p></div>}
              </section>
              <section className="cb-info-banner"><span>💗</span><div><b>Fila de espera</b><p>Registre clientes interessados em produtos e acompanhe o atendimento pelo painel administrativo.</p></div><button onClick={() => { setTab("pedidos"); setWaitProductPickerOpen(false); setWaitProductSearch(""); setWaitProductCategory("Todas"); setWaitFormOpen(true); }}>Adicionar cliente</button></section>
          </>}

          {tab === "produtos" && <>
            <div className="cb-page-heading"><div><span className="cb-eyebrow">CATÁLOGO</span><h1>Seus produtos <span>✿</span></h1><p>Cadastre, edite e organize o que aparece na loja.</p></div><button className="cb-primary" onClick={startNew}><Plus size={18} /> Adicionar produto</button></div>
            <div className="cb-toolbar"><label className="cb-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto..." /></label><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option>Todas</option>{categories.map((c) => <option key={c}>{c}</option>)}</select><span className="cb-result-count">{visibleProducts.length} produto(s)</span></div>
            {visibleProducts.length ? <div className="cb-product-grid">{visibleProducts.map((p) => <article className={`cb-product-card ${p.active === false ? "is-hidden" : ""}`} key={p.id}>
              <div className="cb-product-photo">{(p.imageUrl || p.images?.[0]) ? <img src={p.imageUrl || p.images[0]} alt={p.name} /> : p.image ? <img src={`https://images.unsplash.com/${p.image}?auto=format&fit=contain&w=500&q=75`} alt={p.name} /> : <span>{p.emoji || "🎀"}</span>}<span className={`cb-status ${p.active === false ? "off" : ""}`}>{p.active === false ? "Oculto" : "Disponível"}</span></div>
              <div className="cb-product-info"><small>{p.category}</small><h3>{p.name}</h3><div className="cb-product-price">{money(p.price)} {p.oldPrice && <del>{money(p.oldPrice)}</del>}</div><div className="cb-product-actions"><button onClick={() => startEdit(p)}><Pencil size={15} /> Editar</button><button onClick={() => toggleActive(p)} aria-label={p.active === false ? "Mostrar produto" : "Ocultar produto"}>{p.active === false ? <Eye size={16} /> : <EyeOff size={16} />}</button><button className="cb-delete" onClick={() => deleteProduct(p)} aria-label="Excluir produto"><Trash2 size={16} /></button></div></div>
            </article>)}</div> : <div className="cb-empty cb-panel"><Package size={30} /><h3>Nenhum produto encontrado</h3><p>Tente mudar a busca ou adicione um novo produto.</p><button className="cb-primary" onClick={startNew}><Plus size={17} /> Adicionar produto</button></div>}
          </>}

          {tab === "categorias" && <>
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

          {tab === "pedidos" && <>
            <div className="cb-page-heading cb-waitlist-heading">
              <div>
                <span className="cb-eyebrow">ATENDIMENTO</span>
                <h1>Fila de espera <span>💗</span></h1>
                <p>Organize clientes interessados e acompanhe cada solicitação.</p>
              </div>
              <button className="cb-primary" onClick={() => { setWaitProductPickerOpen(false); setWaitProductSearch(""); setWaitProductCategory("Todas"); setWaitFormOpen(true); }}>
                <Plus size={18} /> Adicionar cliente
              </button>
            </div>

            <div className="cb-info-banner">
              <Users size={23} />
              <div>
                <b>Controle interno da fila</b>
                <p>Os registros são adicionados manualmente e ficam salvos neste navegador. Não são importados automaticamente do WhatsApp nem sincronizados entre dispositivos nesta versão.</p>
              </div>
            </div>

            <div className="cb-stat-grid cb-wait-stats">
              <div className="cb-stat-card cb-stat-pink"><span className="cb-stat-icon"><Users /></span><small>Clientes na fila</small><strong>{waitlist.length}</strong><span>Total de registros</span></div>
              <div className="cb-stat-card cb-stat-blue"><span className="cb-stat-icon"><Clock3 /></span><small>Aguardando</small><strong>{waitPending}</strong><span>Precisam de retorno</span></div>
              <div className="cb-stat-card cb-stat-yellow"><span className="cb-stat-icon"><MessageCircle /></span><small>Cliente avisado</small><strong>{waitlist.filter((item) => item.status === "Cliente avisado").length}</strong><span>Retorno enviado</span></div>
              <div className="cb-stat-card cb-stat-lilac"><span className="cb-stat-icon"><CheckCircle2 /></span><small>Atendidos</small><strong>{waitlist.filter((item) => item.status === "Atendido").length}</strong><span>Solicitações concluídas</span></div>
            </div>

            {waitFormOpen && <form ref={waitFormRef} className="cb-panel cb-order-form" onSubmit={createWaitlistEntry}>
              <div className="cb-section-heading">
                <div><h2>Novo registro na fila</h2><p>Preencha os dados do cliente e do produto desejado.</p></div>
                <button type="button" className="cb-icon-action" onClick={() => { setWaitFormOpen(false); setWaitProductPickerOpen(false); }} aria-label="Fechar"><X /></button>
              </div>
              <div className="cb-form-grid">
                <label>Nome do cliente<input required value={waitForm.customer} onChange={(e) => setWaitForm({ ...waitForm, customer: e.target.value })} placeholder="Nome do cliente" /></label>
                <label>Telefone / WhatsApp<input value={waitForm.phone} onChange={(e) => setWaitForm({ ...waitForm, phone: e.target.value })} placeholder="(84) 99999-9999" /></label>
                
<div className="cb-wait-product-field">
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
            {categories.map((category) =>
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
</div>
                <label>Quantidade<input type="number" min="1" step="1" value={waitForm.quantity} onChange={(e) => setWaitForm({ ...waitForm, quantity: e.target.value })} /></label>
                <label>Tamanho<input value={waitForm.size} onChange={(e) => setWaitForm({ ...waitForm, size: e.target.value })} placeholder="Ex.: P, M, 2 anos" /></label>
                <label>Cor<input value={waitForm.color} onChange={(e) => setWaitForm({ ...waitForm, color: e.target.value })} placeholder="Cor desejada" /></label>
              </div>
              <label>Observações<textarea rows="2" value={waitForm.notes} onChange={(e) => setWaitForm({ ...waitForm, notes: e.target.value })} placeholder="Detalhes, prazo ou preferência..." /></label>
              <div className="cb-form-actions">
                <button type="button" className="cb-secondary" onClick={() => { setWaitFormOpen(false); setWaitProductPickerOpen(false); }}>Cancelar</button>
                <button type="submit" className="cb-primary"><Save size={17} /> Salvar na fila</button>
              </div>
            </form>}

            {waitlist.length ? <div className="cb-orders-list">
              {waitlist.map((item) => <article className="cb-order-card cb-wait-card" key={item.id}>
                <div className="cb-order-icon"><Clock3 /></div>
                <div className="cb-order-main">
                  <div className="cb-order-title"><h3>{item.customer}</h3><span>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</span></div>
                  <p><b>Produto:</b> {item.product} · <b>Qtd.:</b> {item.quantity || 1}</p>
                  {(item.size || item.color) && <small>{[item.size && "Tamanho: " + item.size, item.color && "Cor: " + item.color].filter(Boolean).join(" · ")}</small>}
                  {item.phone && <small>{item.phone}</small>}
                  {item.notes && <small>Observações: {item.notes}</small>}
                  <div className="cb-order-bottom"><label>Status<select value={item.status || "Aguardando"} onChange={(e) => updateWaitlistStatus(item.id, e.target.value)}>{["Aguardando", "Cliente avisado", "Atendido", "Cancelado"].map((status) => <option key={status}>{status}</option>)}</select></label></div>
                </div>
                <div className="cb-order-actions">
                  {item.phone && <a href={"https://wa.me/" + item.phone.replace(/\D/g, "")} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp"><MessageCircle size={17} /></a>}
                  <button onClick={() => deleteWaitlistEntry(item)} aria-label="Excluir registro"><Trash2 size={17} /></button>
                </div>
              </article>)}
            </div> : <div className="cb-empty cb-panel"><Users size={30} /><h3>A fila de espera está vazia</h3><p>Adicione manualmente os clientes interessados em produtos.</p><button className="cb-primary" onClick={() => { setWaitProductPickerOpen(false); setWaitProductSearch(""); setWaitProductCategory("Todas"); setWaitFormOpen(true); }}><Plus size={17} /> Adicionar primeiro cliente</button></div>}
          </>}
        </main>
      </div>
      {notice && <div className="cb-notice">{notice}</div>}
    </div>
  );
}

export default AdminPanel;
