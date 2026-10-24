from pathlib import Path
from datetime import datetime
import re
import sys

app = Path("src/App.jsx")
css = Path("src/App.css")

if not app.exists() or not css.exists():
    sys.exit("ERRO: src/App.jsx ou src/App.css não foi encontrado.")

s = app.read_text()
c = css.read_text()

if 'from "./AdminPanel"' in s or "from './AdminPanel'" in s:
    sys.exit("O AdminPanel já parece estar conectado. Não fiz alterações.")

if "function App()" not in s:
    sys.exit("Não encontrei function App() em App.jsx. Nenhuma alteração feita.")

if "const products = [" not in s:
    sys.exit("Não encontrei a lista original de produtos. Nenhuma alteração feita.")

if "const filtered = useMemo(" not in s:
    sys.exit("Não encontrei o filtro de produtos esperado. Nenhuma alteração feita.")

if "footer-bottom" not in s:
    sys.exit("Não encontrei o rodapé esperado. Nenhuma alteração feita.")

# Localiza o fechamento do useMemo para preservar a ordem dos hooks React.
match = re.search(r'  const filtered = useMemo\(\(\) => products\.filter\(\(product\) => \{', s)
if not match:
    sys.exit("Não consegui identificar o filtro com segurança.")

# Faz backup antes de editar.
stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
Path(f"src/App.jsx.backup-admin-{stamp}").write_text(s)
Path(f"src/App.css.backup-admin-{stamp}").write_text(c)

s = s.replace('import { useMemo, useState } from "react";',
              'import { useEffect, useMemo, useState } from "react";', 1)
s = s.replace('import "./App.css";',
              'import "./App.css";\nimport AdminPanel from "./AdminPanel";', 1)
s = s.replace("const products = [", "const initialProducts = [", 1)

# Insere estados dentro do componente, antes dos estados existentes.
app_start = s.index("function App() {") + len("function App() {")
state_code = r'''

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem("caprichobaby_products");
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("caprichobaby_products", JSON.stringify(products));
    } catch (error) {
      console.error("Não foi possível salvar os produtos:", error);
    }
  }, [products]);
'''
s = s[:app_start] + state_code + s[app_start:]

# Atualiza dependências do filtro, sem alterar sua estrutura.
s = s.replace("}), [category, search]);", "}), [products, category, search]);", 1)

# Adiciona o retorno administrativo DEPOIS do useMemo, mantendo a ordem dos hooks.
filter_end = s.find("}), [products, category, search]);")
if filter_end == -1:
    sys.exit("Não consegui localizar o fim do filtro. Restaure o backup se necessário.")
filter_end += len("}), [products, category, search]);")

admin_return = r'''

  if (adminOpen) {
    return (
      <AdminPanel
        products={products}
        setProducts={setProducts}
        onClose={() => setAdminOpen(false)}
      />
    );
  }
'''
s = s[:filter_end] + admin_return + s[filter_end:]

# Adiciona botão ao final do rodapé.
footer_marker = '<div className="container footer-bottom">'
footer_start = s.find(footer_marker)
footer_end = s.find("</footer>", footer_start)
if footer_start == -1 or footer_end == -1:
    sys.exit("Não consegui localizar o fechamento do rodapé. Restaure o backup se necessário.")

admin_button = '''
      <div className="admin-access">
        <button
          type="button"
          className="admin-access-button"
          onClick={() => setAdminOpen(true)}
        >
          Área administrativa
        </button>
      </div>
'''
s = s[:footer_end] + admin_button + s[footer_end:]

# Permite que o painel use URLs de imagens salvas; mantém o fallback atual.
old_img = '<img src={`https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=650&q=80`} alt={product.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />'
new_img = '<img src={product.imageUrl || (product.images && product.images[0]) || `https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=650&q=80`} alt={product.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />'
if old_img in s:
    s = s.replace(old_img, new_img, 1)
else:
    print("AVISO: o formato exato da imagem não foi encontrado; mantive a imagem original.")

if ".admin-access-button" not in c:
    c += r'''

.admin-access {
  display: flex;
  justify-content: center;
  padding: 14px 16px 22px;
}

.admin-access-button {
  border: 1px solid rgba(100, 70, 80, 0.25);
  border-radius: 999px;
  background: transparent;
  color: inherit;
  padding: 10px 18px;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 180ms ease, transform 180ms ease;
}

.admin-access-button:hover {
  background: rgba(180, 130, 150, 0.12);
  transform: translateY(-1px);
}
'''

app.write_text(s)
css.write_text(c)

print("Conexão do painel administrativo aplicada.")
print(f"Backups criados com o identificador: {stamp}")
print("Agora execute: npm run build")
