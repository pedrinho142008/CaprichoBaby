import { useEffect, useMemo, useState } from "react";
import {
  Search, ShoppingBag, Heart, Menu, X, Plus, Minus, Trash2,
  ArrowRight, Sparkles, Star, Truck, ShieldCheck, MessageCircle,
  ChevronRight, ChevronLeft, Baby, Gift, PackageCheck
} from "lucide-react";
import "./App.css";

const WHATSAPP = "5584994551777";

const categories = [
  { name: "Todos", emoji: "✨", color: "lilac" },
  { name: "Roupinhas", emoji: "👕", color: "pink" },
  { name: "Vestidos", emoji: "🎀", color: "yellow" },
  { name: "Brinquedos", emoji: "🧸", color: "blue" },
  { name: "Acessórios", emoji: "🌈", color: "mint" },
  { name: "Presentes", emoji: "🎁", color: "peach" },
];

const initialProducts = [
  { id: 1, name: "Conjunto Mini Encanto", category: "Roupinhas", price: 59.9, oldPrice: 74.9, tag: "Queridinho", emoji: "👚", color: "product-pink", image: "photo-1519238263530-99bdd11df2ea" },
  { id: 2, name: "Vestido Jardim de Flores", category: "Vestidos", price: 79.9, oldPrice: 99.9, tag: "Novidade", emoji: "👗", color: "product-yellow", image: "photo-1519689680058-324335c77eba" },
  { id: 3, name: "Ursinho Abraço Doce", category: "Brinquedos", price: 39.9, oldPrice: null, tag: "Muito fofo", emoji: "🧸", color: "product-blue", image: "photo-1559454403-b8fb88521f11" },
  { id: 4, name: "Kit Laços Encantados", category: "Acessórios", price: 24.9, oldPrice: null, tag: "Pequenos mimos", emoji: "🎀", color: "product-lilac", image: "photo-1522312346375-d1a52e2b99b3" },
  { id: 5, name: "Macacão Sonho de Nuvem", category: "Roupinhas", price: 64.9, oldPrice: 79.9, tag: "Confortinho", emoji: "☁️", color: "product-mint", image: "photo-1519689680058-324335c77eba" },
  { id: 6, name: "Kit Presente Pequeno Amor", category: "Presentes", price: 89.9, oldPrice: null, tag: "Para presentear", emoji: "🎁", color: "product-peach", image: "photo-1513475382585-d06e58bcb0e0" },
  { id: 7, name: "Tênis Passinhos", category: "Acessórios", price: 49.9, oldPrice: 59.9, tag: "Última tendência", emoji: "👟", color: "product-blue", image: "photo-1542291026-7eec264c27ff" },
  { id: 8, name: "Bonequinha Doce Amiga", category: "Brinquedos", price: 44.9, oldPrice: null, tag: "Diversão", emoji: "🌷", color: "product-pink", image: "photo-1566004100631-35d015d6a491" },
];

const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function WhatsAppIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 .8A15.1 15.1 0 0 0 3.05 23.66L1 31l7.55-1.98A15.15 15.15 0 1 0 16 .8Zm0 27.55a12.3 12.3 0 0 1-6.27-1.72l-.45-.27-4.48 1.17 1.2-4.36-.3-.47A12.38 12.38 0 1 1 16 28.35Zm6.8-9.27c-.37-.19-2.2-1.09-2.54-1.21-.34-.13-.59-.19-.84.19-.25.37-.97 1.21-1.19 1.46-.22.25-.44.28-.81.09-.37-.19-1.57-.58-2.99-1.85-1.1-.98-1.85-2.19-2.07-2.56-.22-.37-.02-.58.17-.77.17-.17.37-.44.56-.65.19-.22.25-.37.37-.62.13-.25.06-.47-.03-.65-.09-.19-.84-2.02-1.15-2.77-.3-.73-.61-.63-.84-.64h-.72c-.25 0-.65.09-.99.47-.34.37-1.3 1.27-1.3 3.1s1.33 3.6 1.52 3.85c.19.25 2.62 4 6.35 5.61.89.38 1.58.61 2.12.78.89.28 1.7.24 2.34.15.71-.11 2.2-.9 2.51-1.77.31-.87.31-1.61.22-1.77-.09-.15-.34-.25-.71-.44Z"/>
    </svg>
  );
}

function App() {

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem("caprichobaby_products");
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("caprichobaby_products", JSON.stringify(products));
    } catch (error) {
      console.error("Não foi possível salvar os produtos:", error);
    }
  }, [products]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => products.filter((product) => {
    const matchesCategory = category === "Todos" || product.category === category;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [products, category, search]);
const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  function notify(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2300);
  }

  function addToCart(product) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) return current.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...current, { ...product, qty: 1 }];
    });
    notify(`${product.name} adicionado à sacola!`);
  }

  function changeQty(id, amount) {
    setCart((current) => current
      .map((item) => item.id === id ? { ...item, qty: item.qty + amount } : item)
      .filter((item) => item.qty > 0));
  }

  function toggleFavorite(product) {
    const exists = favorites.includes(product.id);
    setFavorites((current) => exists ? current.filter((id) => id !== product.id) : [...current, product.id]);
    notify(exists ? "Produto removido dos favoritos" : "Adicionado aos seus favoritos 💗");
  }

  function getProductPhoto(product) {
    const photo = product.imageUrl || product.images?.[0];

    if (photo && /^https?:\/\//i.test(photo)) {
      return photo;
    }

    if (product.image) {
      return `https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=900&q=85`;
    }

    return "";
  }

  function checkout() {
    if (!cart.length) return;

    const lines = cart.map((item) => {
      const photo = getProductPhoto(item);
      return [
        `• *${item.name}*`,
        `Quantidade: ${item.qty}`,
        `Valor unitário: ${money(item.price)}`,
        `Subtotal: ${money(item.price * item.qty)}`,
        photo ? `Foto do produto: ${photo}` : "Foto: não disponível"
      ].join("\\n");
    });

    const message = [
      "Olá, Capricho Baby! 💗 Quero fazer um pedido:",
      "",
      ...lines,
      "",
      `*Total dos produtos: ${money(cartTotal)}*`,
      "",
      "Poderiam confirmar a disponibilidade e me informar sobre a entrega? 🌸"
    ].join("\\n");

    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function selectCategory(name) {
    setCategory(name);
    setMobileMenu(false);
    document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <div className="announcement">
        <Sparkles size={15} /> Um mundo de fofura esperando por você!
        <span className="announcement-extra">Feito com carinho para os pequenos <Heart size={13} fill="currentColor" /></span>
      </div>

      <header className="site-header">
        <button className="icon-button mobile-only" aria-label="Abrir menu" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <X /> : <Menu />}
        </button>

        <a className="brand" href="#inicio" aria-label="Capricho Baby início">
          <img className="brand-logo" src="/icon_capricho.png" alt="Capricho Baby" />
        </a>

        <nav className={`main-nav ${mobileMenu ? "nav-open" : ""}`}>
          <a className="nav-link" href="#inicio" onClick={() => setMobileMenu(false)}>Início</a>
          <a className="nav-link" href="#novidades" onClick={() => { setCategory("Todos"); setSearch(""); setMobileMenu(false); }}>Novidades</a>
          <a className="nav-link" href="#categorias" onClick={() => setMobileMenu(false)}>Categorias</a>
          <a className="nav-link" href="#como-comprar" onClick={() => setMobileMenu(false)}>Como comprar</a>
          <a className="nav-link" href="#atendimento" onClick={() => setMobileMenu(false)}>Atendimento</a>
          <a className="nav-link" href="#ofertas" onClick={() => { setCategory("Todos"); setMobileMenu(false); }}>Presentes</a>
        </nav>

        <div className="header-actions">
          <button className="icon-button" aria-label="Pesquisar produtos" onClick={() => { setSearchOpen(!searchOpen); setTimeout(() => document.getElementById("product-search")?.focus(), 50); }}>
            <Search />
          </button>
          <button className="icon-button favorite-action" aria-label="Ver favoritos" onClick={() => setFavoritesOpen(true)}>
            <Heart />
            {favorites.length > 0 && <span className="count-badge">{favorites.length}</span>}
          </button>
          <button className="icon-button cart-action" aria-label="Abrir sacola" onClick={() => setCartOpen(true)}>
            <ShoppingBag />
            <span className="count-badge">{cartCount}</span>
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="search-panel">
          <Search size={19} />
          <input id="product-search" value={search} onChange={(e) => { setSearch(e.target.value); document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" }); }} placeholder="O que você está procurando?" />
          {search && <button className="icon-button small" onClick={() => setSearch("")} aria-label="Limpar busca"><X size={17} /></button>}
          <button className="search-close" onClick={() => { setSearchOpen(false); setSearch(""); }}>Fechar</button>
        </div>
      )}

      <main>
        <section className="hero container" id="inicio">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={15} /> Um encanto de loja</span>
            <h1>Pequenos momentos,<br /><span>grandes encantos.</span></h1>
            <p>Roupinhas, brinquedos e mimos escolhidos com muito amor para acompanhar as descobertas mais lindas da infância.</p>
            <div className="hero-buttons">
              <button className="primary-button" onClick={() => selectCategory("Todos")}>Explorar a loja <ArrowRight size={18} /></button>
              <button className="text-button" onClick={() => selectCategory("Presentes")}>Encontrar um presente <Gift size={17} /></button>
            </div>
            <div className="hero-trust"><span><span className="trust-icon"><Heart size={15} fill="currentColor" /></span> Escolhidos com carinho</span><span><span className="trust-icon"><Star size={15} fill="currentColor" /></span> Fofura em cada detalhe</span></div>
          </div>
          <div className="hero-art">
            <div className="hero-blob"></div>
            <div className="floating floating-one">🌈</div>
            <div className="floating floating-two">✦</div>
            <div className="hero-photo">
              <img src="https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1000&q=85" alt="Momento especial da infância" />
            </div>
            <div className="hero-sticker sticker-top"><span>♡</span><div><b>Amor em cada</b><small>detalhezinho</small></div></div>
            <div className="hero-sticker sticker-bottom"><span>🧸</span><div><b>Um mundo</b><small>de descobertas</small></div></div>
            <span className="hero-spark spark-a">✳</span><span className="hero-spark spark-b">✦</span>
          </div>
        </section>

        <section className="benefits-strip" id="como-comprar">
          <div className="container benefits-grid">
            <div className="benefit"><span className="benefit-icon pink-bg"><Truck /></span><div><b>Entrega combinada</b><small>Consulte as opções disponíveis</small></div></div>
            <div className="benefit"><span className="benefit-icon blue-bg"><Heart /></span><div><b>Escolhido com carinho</b><small>Peças cheias de encanto</small></div></div>
            <div className="benefit"><span className="benefit-icon yellow-bg"><MessageCircle /></span><div><b>Atendimento próximo</b><small>Fale com a gente pelo WhatsApp</small></div></div>
          </div>
        </section>

        <section className="category-section container" id="categorias">
          <div className="section-heading">
            <div><span className="eyebrow">Explore com carinho</span><h2>Um cantinho para cada <span>encanto</span></h2></div>
            <p>Encontre aquele mimo que combina com cada fase.</p>
          </div>
          <div className="category-grid">
            {categories.map((item) => (
              <button key={item.name} className={`category-card ${item.color} ${category === item.name ? "selected" : ""}`} onClick={() => selectCategory(item.name)}>
                <span className="category-emoji">{item.emoji}</span>
                <b>{item.name}</b>
                <span className="category-arrow"><ArrowRight size={15} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="products-section" id="produtos">
          <div className="container">
            <div className="section-heading products-heading" id="novidades">
              <div><span className="eyebrow">Nossa seleção especial</span><h2>Fofuras que dão vontade de <span>abraçar!</span></h2></div>
              <button className="outline-button" onClick={() => { setCategory("Todos"); setSearch(""); }}>Ver todos os produtos <ArrowRight size={16} /></button>
            </div>
            <div className="filter-row">
              <div className="filter-pills">
                {categories.map((item) => <button key={item.name} onClick={() => setCategory(item.name)} className={category === item.name ? "filter-pill active" : "filter-pill"}>{item.name}</button>)}
              </div>
              <span className="product-count">{filtered.length} produtos</span>
            </div>
            {filtered.length ? (
              <div className="product-grid">
                {filtered.map((product) => (
                  <article className="product-card" key={product.id} role="button" tabIndex={0}
                    aria-label={`Ver detalhes de ${product.name}`}
                    onClick={() => { setSelectedProduct(product); setGalleryIndex(0); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { setSelectedProduct(product); setGalleryIndex(0); } }}>
                    <div className={`product-image ${product.color}`}>
                      <img src={product.imageUrl || (product.images && product.images[0]) || `https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=650&q=80`} alt={product.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      <span className="product-tag">{product.tag}</span>
                      <button className={`heart-button ${favorites.includes(product.id) ? "hearted" : ""}`} aria-label={favorites.includes(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}>
                        <Heart size={19} fill={favorites.includes(product.id) ? "currentColor" : "none"} />
                      </button>
                      <span className="product-emoji-fallback">{product.emoji}</span>
                    </div>
                    <div className="product-info">
                      <span className="product-category">{product.category}</span>
                      <h3>{product.name}</h3>
                      <div className="price-line"><strong>{money(product.price)}</strong>{product.oldPrice && <del>{money(product.oldPrice)}</del>}</div>
                      <button className="add-button" onClick={(e) => { e.stopPropagation(); addToCart(product); }}><Plus size={17} /> Adicionar à sacola</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-search"><span>🔎</span><h3>Não encontramos essa fofura...</h3><p>Tente outro nome ou escolha uma categoria diferente.</p><button className="primary-button" onClick={() => { setSearch(""); setCategory("Todos"); }}>Ver todos os produtos</button></div>
            )}
            <p className="demo-note">* Produtos, imagens e preços exibidos são demonstrativos e serão substituídos pelo catálogo real da loja.</p>
          </div>
        </section>

        <section className="gift-banner container" id="ofertas">
          <div className="gift-decoration gift-star">✦</div><div className="gift-decoration gift-heart">♡</div>
          <div className="gift-copy"><span className="eyebrow">Presentear é demonstrar amor</span><h2>Um presente fofo<br />vira uma memória <span>linda.</span></h2><p>Surpreenda alguém especial com um mimo cheio de carinho.</p><button className="primary-button" onClick={() => selectCategory("Presentes")}>Ver ideias para presentear <ArrowRight size={18} /></button></div>
          <div className="gift-art"><div className="gift-circle"></div><span className="gift-box">🎁</span><span className="gift-teddy">🧸</span><span className="gift-flower">🌼</span></div>
        </section>

        <section className="love-note container" id="atendimento">
          <span className="love-icon"><Heart fill="currentColor" /></span>
          <span className="eyebrow">Da nossa loja para sua família</span>
          <h2>Infância passa depressa.<br /><span>Que cada detalhe seja especial.</span></h2>
          <p>Estamos aqui para ajudar você a escolher com carinho. Tem alguma dúvida? É só chamar!</p>
          <a className="whatsapp-link" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá, Capricho Baby! 💗 Gostaria de tirar uma dúvida.")}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Conversar com a gente</a>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <a className="brand footer-brand" href="#inicio"><img className="brand-logo footer-logo" src="/icon_capricho.png" alt="Capricho Baby" /></a>
          <p>Pequenos detalhes, muito amor. <Heart size={14} fill="currentColor" /></p>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="footer-contact"><MessageCircle size={17} /> Fale com a loja</a>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} Capricho Baby. Todos os direitos reservados.</span><span>Feito com carinho <Heart size={12} fill="currentColor" /></span></div>
</footer>

      {selectedProduct && <div className="overlay product-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null); }}>
        <section className="product-modal" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selectedProduct.name}`}>
          <button className="product-modal-close icon-button" onClick={() => setSelectedProduct(null)} aria-label="Fechar detalhes"><X /></button>
          <div className="detail-gallery">
            <div className={`detail-main-image ${selectedProduct.color}`}>
              <img
                src={`https://images.unsplash.com/${[
                  selectedProduct.image,
                  "photo-1519689680058-324335c77eba",
                  "photo-1519238263530-99bdd11df2ea"
                ][galleryIndex]}?auto=format&fit=crop&w=900&q=85`}
                alt={`${selectedProduct.name} — foto ${galleryIndex + 1}`}
              />
              <button className="gallery-arrow gallery-prev" aria-label="Foto anterior" onClick={() => setGalleryIndex((i) => (i + 2) % 3)}><ChevronLeft /></button>
              <button className="gallery-arrow gallery-next" aria-label="Próxima foto" onClick={() => setGalleryIndex((i) => (i + 1) % 3)}><ChevronRight /></button>
              <span className="gallery-counter">{galleryIndex + 1} / 3</span>
            </div>
            <div className="detail-thumbnails">
              {[0, 1, 2].map((index) => (
                <button key={index} className={galleryIndex === index ? "detail-thumb active" : "detail-thumb"} onClick={() => setGalleryIndex(index)} aria-label={`Ver foto ${index + 1}`}>
                  <img src={`https://images.unsplash.com/${[
                    selectedProduct.image,
                    "photo-1519689680058-324335c77eba",
                    "photo-1519238263530-99bdd11df2ea"
                  ][index]}?auto=format&fit=crop&w=180&q=70`} alt="" />
                </button>
              ))}
            </div>
          </div>
          <div className="product-detail-info">
            <span className="eyebrow">{selectedProduct.category} · Capricho Baby</span>
            <h2>{selectedProduct.name}</h2>
            <div className="detail-price">{money(selectedProduct.price)} {selectedProduct.oldPrice && <del>{money(selectedProduct.oldPrice)}</del>}</div>
            <span className="detail-tag"><Sparkles size={14} /> {selectedProduct.tag}</span>
            <p className="detail-description">Um mimo escolhido com carinho para deixar os momentos especiais ainda mais encantadores. Consulte pelo WhatsApp as opções disponíveis, tamanhos, cores e detalhes deste produto.</p>
            <div className="detail-perks">
              <span><PackageCheck size={17} /> Disponibilidade a confirmar</span>
              <span><MessageCircle size={17} /> Atendimento pelo WhatsApp</span>
            </div>
            <div className="detail-actions">
              <button className="primary-button detail-add" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}><ShoppingBag size={18} /> Adicionar à sacola</button>
              <button className={`detail-favorite ${favorites.includes(selectedProduct.id) ? "hearted" : ""}`} onClick={() => toggleFavorite(selectedProduct)} aria-label="Adicionar aos favoritos"><Heart fill={favorites.includes(selectedProduct.id) ? "currentColor" : "none"} /></button>
            </div>
            <button className="detail-whatsapp" onClick={() => {
              const photo = getProductPhoto(selectedProduct);
              const message = [
                "Olá, Capricho Baby! 💗 Tenho interesse neste produto:",
                "",
                `Produto: ${selectedProduct.name}`,
                `Valor: ${money(selectedProduct.price)}`,
                photo ? `Foto do produto: ${photo}` : "",
                "",
                "Poderiam me informar a disponibilidade e as opções de entrega? 🌸"
              ].filter(Boolean).join("\\n");
              window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
            }}><WhatsAppIcon size={19} /> Consultar este produto</button>
            <small className="detail-demo-note">Produto demonstrativo. Fotos, descrição e preço serão atualizados com o catálogo real.</small>
          </div>
        </section>
      </div>}

      {cartOpen && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}>
        <aside className="side-drawer">
          <div className="drawer-header"><div><span className="eyebrow">Sua seleção especial</span><h2>Minha sacola <span>({cartCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Fechar sacola"><X /></button></div>
          {!cart.length ? <div className="drawer-empty"><span className="empty-bag"><ShoppingBag /></span><h3>Sua sacola está esperando!</h3><p>Adicione suas fofuras favoritas para continuar.</p><button className="primary-button" onClick={() => setCartOpen(false)}>Continuar comprando</button></div> :
            <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><div className={`cart-thumb ${item.color}`}><span>{item.emoji}</span></div><div className="cart-item-info"><b>{item.name}</b><strong>{money(item.price)}</strong><div className="qty-control"><button onClick={() => changeQty(item.id, -1)} aria-label="Diminuir quantidade"><Minus size={14} /></button><span>{item.qty}</span><button onClick={() => changeQty(item.id, 1)} aria-label="Aumentar quantidade"><Plus size={14} /></button></div></div><button className="remove-item" onClick={() => setCart((current) => current.filter((p) => p.id !== item.id))} aria-label="Remover produto"><Trash2 size={17} /></button></div>)}</div>
            <div className="drawer-footer"><div className="subtotal"><span>Total dos produtos</span><strong>{money(cartTotal)}</strong></div><p><MessageCircle size={15} /> A entrega será combinada pelo WhatsApp.</p><button className="checkout-button" onClick={checkout}>Finalizar pelo WhatsApp <ArrowRight size={18} /></button><button className="continue-button" onClick={() => setCartOpen(false)}>Continuar comprando</button></div></>}
        </aside>
      </div>}

      {favoritesOpen && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setFavoritesOpen(false); }}>
        <aside className="side-drawer">
          <div className="drawer-header"><div><span className="eyebrow">Seus preferidos</span><h2>Meus favoritos <span>({favorites.length})</span></h2></div><button className="icon-button" onClick={() => setFavoritesOpen(false)} aria-label="Fechar favoritos"><X /></button></div>
          {!favoriteProducts.length ? <div className="drawer-empty"><span className="empty-bag"><Heart /></span><h3>Seu coração ainda não escolheu!</h3><p>Toque no coração dos produtos para guardar seus favoritos aqui.</p><button className="primary-button" onClick={() => setFavoritesOpen(false)}>Explorar produtos</button></div> :
            <div className="cart-items">{favoriteProducts.map((item) => <div className="cart-item" key={item.id}><div className={`cart-thumb ${item.color}`}><span>{item.emoji}</span></div><div className="cart-item-info"><b>{item.name}</b><strong>{money(item.price)}</strong><button className="favorite-add" onClick={() => addToCart(item)}><Plus size={14} /> Adicionar à sacola</button></div><button className="remove-item" onClick={() => toggleFavorite(item)} aria-label="Remover favorito"><Heart size={17} fill="currentColor" /></button></div>)}</div>}
        </aside>
      </div>}

      {toast && <div className="toast"><span>♡</span>{toast}</div>}
      <button className="floating-whatsapp" aria-label="Conversar no WhatsApp" onClick={() => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá, Capricho Baby! 💗")}`, "_blank", "noopener,noreferrer")}><WhatsAppIcon size={24} /><span>Fale com a gente</span></button>
    </div>
  );
}

export default App;
