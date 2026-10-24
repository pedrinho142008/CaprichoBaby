from pathlib import Path
import shutil
import datetime
import sys

root = Path.cwd()
jsx = root / "src/AdminPanel.jsx"
css = root / "src/AdminPanel.css"

s = jsx.read_text()
c = css.read_text()

checks = [
    'const [orders, setOrders] = useState(() => read("caprichobaby_orders", []));',
    'const nav = [',
    '{tab === "pedidos" && <>',
    'const pending = orders.filter'
]
for text in checks:
    if text not in s:
        sys.exit("ERRO: trecho não encontrado: " + text)

stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
backup = root / "backups" / ("antes-fila-espera-" + stamp)
backup.mkdir(parents=True)
shutil.copy2(jsx, backup / "AdminPanel.jsx")
shutil.copy2(css, backup / "AdminPanel.css")

def replace_once(source, old, new, label):
    count = source.count(old)
    if count != 1:
        sys.exit(f"ERRO: esperado um trecho para {label}; encontrados {count}. Backup: {backup}")
    return source.replace(old, new, 1)

s = replace_once(
    s,
    '  MessageCircle, Eye, EyeOff, Upload, LayoutDashboard',
    '  MessageCircle, Eye, EyeOff, Upload, LayoutDashboard, Users',
    "ícones"
)

s = replace_once(
    s,
    '  const [orders, setOrders] = useState(() => read("caprichobaby_orders", []));',
    '''  const [orders, setOrders] = useState(() => read("caprichobaby_orders", []));
  const [waitlist, setWaitlist] = useState(() => read("caprichobaby_waitlist", []));
  const [waitFormOpen, setWaitFormOpen] = useState(false);
  const [waitForm, setWaitForm] = useState({
    customer: "", phone: "", product: "", quantity: "1",
    size: "", color: "", notes: "", status: "Aguardando"
  });''',
    "estado da fila"
)

s = replace_once(
    s,
    '''  useEffect(() => {
    try { localStorage.setItem("caprichobaby_orders", JSON.stringify(orders)); } catch {}
  }, [orders]);''',
    '''  useEffect(() => {
    try { localStorage.setItem("caprichobaby_orders", JSON.stringify(orders)); } catch {}
  }, [orders]);

  useEffect(() => {
    try { localStorage.setItem("caprichobaby_waitlist", JSON.stringify(waitlist)); } catch {}
  }, [waitlist]);''',
    "persistência da fila"
)

s = replace_once(
    s,
    '  const pending = orders.filter((o) => !["Concluído", "Cancelado"].includes(o.status)).length;',
    '''  const pending = orders.filter((o) => !["Concluído", "Cancelado"].includes(o.status)).length;
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
  }''',
    "funções da fila"
)

s = replace_once(
    s,
    '{ id: "pedidos", label: "Pedidos do WhatsApp", icon: ClipboardList }',
    '{ id: "pedidos", label: "Fila de espera", icon: Users }',
    "navegação"
)

s = replace_once(
    s,
    '{id === "pedidos" && pending > 0 && <i>{pending}</i>}',
    '{id === "pedidos" && waitPending > 0 && <i>{waitPending}</i>}',
    "contador da navegação"
)

s = replace_once(
    s,
    '<small>Pedidos em andamento</small><strong>{pending}</strong><span>Precisam de acompanhamento</span>',
    '<small>Na fila de espera</small><strong>{waitPending}</strong><span>Precisam de retorno</span>',
    "cartão de pendências"
)

s = replace_once(
    s,
    '<small>Pedidos registrados</small><strong>{orders.length}</strong><span>Registro manual do WhatsApp</span>',
    '<small>Clientes na fila (total)</small><strong>{waitlist.length}</strong><span>Registros de interesse</span>',
    "cartão de total"
)

s = replace_once(
    s,
    '<div className="cb-page-heading"><div><span className="cb-eyebrow">SEU CANTINHO DE GESTÃO</span><h1>Visão geral <span>♡</span></h1><p>Acompanhe os produtos e os pedidos da Capricho Baby.</p></div>',
    '<div className="cb-page-heading"><div><span className="cb-eyebrow">SEU CANTINHO DE GESTÃO</span><h1>Visão geral <span>♡</span></h1><p>Acompanhe os produtos e a fila de espera da Capricho Baby.</p></div>',
    "descrição da visão geral"
)

s = replace_once(
    s,
    '<section className="cb-info-banner"><span>💬</span><div><b>Pedidos do WhatsApp</b><p>Registre aqui os pedidos recebidos pela conversa. Eles não são importados automaticamente do WhatsApp.</p></div><button onClick={() => { setTab("pedidos"); setOrderFormOpen(true); }}>Registrar pedido</button></section>',
    '<section className="cb-info-banner"><span>💗</span><div><b>Fila de espera</b><p>Registre clientes interessados em produtos e acompanhe o atendimento pelo painel administrativo.</p></div><button onClick={() => { setTab("pedidos"); setWaitFormOpen(true); }}>Adicionar cliente</button></section>',
    "banner da visão geral"
)

start = s.find('          {tab === "pedidos" && <>')
end_marker = '          </>}'
end = s.find(end_marker, start)
if start < 0 or end < 0:
    sys.exit("ERRO: bloco da aba de pedidos não localizado. Nenhuma alteração gravada.")

end += len(end_marker)
old_block = s[start:end]
if 'cb-order-card' not in old_block or 'createOrder' not in old_block:
    sys.exit("ERRO: bloco de pedidos diferente do esperado. Nenhuma alteração gravada.")

new_block = '''          {tab === "pedidos" && <>
            <div className="cb-page-heading">
              <div>
                <span className="cb-eyebrow">ATENDIMENTO</span>
                <h1>Fila de espera <span>💗</span></h1>
                <p>Organize clientes interessados e acompanhe cada solicitação.</p>
              </div>
              <button className="cb-primary" onClick={() => setWaitFormOpen(true)}>
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

            {waitFormOpen && <form className="cb-panel cb-order-form" onSubmit={createWaitlistEntry}>
              <div className="cb-section-heading">
                <div><h2>Novo registro na fila</h2><p>Preencha os dados do cliente e do produto desejado.</p></div>
                <button type="button" className="cb-icon-action" onClick={() => setWaitFormOpen(false)} aria-label="Fechar"><X /></button>
              </div>
              <div className="cb-form-grid">
                <label>Nome do cliente<input required value={waitForm.customer} onChange={(e) => setWaitForm({ ...waitForm, customer: e.target.value })} placeholder="Nome do cliente" /></label>
                <label>Telefone / WhatsApp<input value={waitForm.phone} onChange={(e) => setWaitForm({ ...waitForm, phone: e.target.value })} placeholder="(84) 99999-9999" /></label>
                <label>Produto desejado<input required value={waitForm.product} onChange={(e) => setWaitForm({ ...waitForm, product: e.target.value })} placeholder="Nome do produto" /></label>
                <label>Quantidade<input type="number" min="1" step="1" value={waitForm.quantity} onChange={(e) => setWaitForm({ ...waitForm, quantity: e.target.value })} /></label>
                <label>Tamanho<input value={waitForm.size} onChange={(e) => setWaitForm({ ...waitForm, size: e.target.value })} placeholder="Ex.: P, M, 2 anos" /></label>
                <label>Cor<input value={waitForm.color} onChange={(e) => setWaitForm({ ...waitForm, color: e.target.value })} placeholder="Cor desejada" /></label>
              </div>
              <label>Observações<textarea rows="2" value={waitForm.notes} onChange={(e) => setWaitForm({ ...waitForm, notes: e.target.value })} placeholder="Detalhes, prazo ou preferência..." /></label>
              <div className="cb-form-actions">
                <button type="button" className="cb-secondary" onClick={() => setWaitFormOpen(false)}>Cancelar</button>
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
                  {item.phone && <a href={"https://wa.me/" + item.phone.replace(/\\D/g, "")} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp"><MessageCircle size={17} /></a>}
                  <button onClick={() => deleteWaitlistEntry(item)} aria-label="Excluir registro"><Trash2 size={17} /></button>
                </div>
              </article>)}
            </div> : <div className="cb-empty cb-panel"><Users size={30} /><h3>A fila de espera está vazia</h3><p>Adicione manualmente os clientes interessados em produtos.</p><button className="cb-primary" onClick={() => setWaitFormOpen(true)}><Plus size={17} /> Adicionar primeiro cliente</button></div>}
          </>}'''

s = s[:start] + new_block + s[end:]

css_add = '''
/* Ajustes do painel administrativo e da fila de espera */
.cb-admin .cb-search input {
  border: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  height: auto;
  background: transparent !important;
  outline: none;
}
.cb-admin .cb-search input:focus {
  border: 0 !important;
  box-shadow: none !important;
}
.cb-admin .cb-product-photo img {
  object-fit: contain;
  object-position: center;
  padding: 4px;
}
.cb-wait-stats { margin-top: 18px; }
.cb-wait-card .cb-order-bottom { justify-content: flex-start; }
.cb-wait-card .cb-order-bottom label { max-width: 250px; }
@media (max-width: 560px) {
  .cb-wait-card { align-items: flex-start; }
  .cb-wait-card .cb-order-main { min-width: 0; }
  .cb-wait-card .cb-order-actions { flex-direction: column; }
  .cb-wait-card .cb-order-bottom label { max-width: 100%; }
}
'''
if "Ajustes do painel administrativo e da fila de espera" not in c:
    c += "\n" + css_add

jsx.write_text(s)
css.write_text(c)
print("Patch aplicado com sucesso.")
print("Backup:", backup)
