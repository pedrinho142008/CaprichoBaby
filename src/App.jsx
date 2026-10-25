import { useEffect, useMemo, useState } from "react";
import {
  Search, ShoppingBag, Heart, Menu, X, Plus, Minus, Trash2,
  ArrowRight, Sparkles, Star, Truck, ShieldCheck, MessageCircle,
  ChevronRight, ChevronLeft, Baby, Gift, PackageCheck
} from "lucide-react";
import "./App.css";
import { supabase } from "./supabase";

const WHATSAPP = "558494120193";

const DEFAULT_CATEGORIES = [
  { name: "Todos", emoji: "✨", color: "lilac" },
  { name: "Roupinhas", emoji: "👕", color: "pink" },
  { name: "Vestidos", emoji: "🎀", color: "yellow" },
  { name: "Brinquedos", emoji: "🧸", color: "blue" },
  { name: "Acessórios", emoji: "🌈", color: "mint" },
  { name: "Presentes", emoji: "🎁", color: "peach" },
];


const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function InstagramIcon({ size = 21 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 .8A15.1 15.1 0 0 0 3.05 23.66L1 31l7.55-1.98A15.15 15.15 0 1 0 16 .8Zm0 27.55a12.3 12.3 0 0 1-6.27-1.72l-.45-.27-4.48 1.17 1.2-4.36-.3-.47A12.38 12.38 0 1 1 16 28.35Zm6.8-9.27c-.37-.19-2.2-1.09-2.54-1.21-.34-.13-.59-.19-.84.19-.25.37-.97 1.21-1.19 1.46-.22.25-.44.28-.81.09-.37-.19-1.57-.58-2.99-1.85-1.1-.98-1.85-2.19-2.07-2.56-.22-.37-.02-.58.17-.77.17-.17.37-.44.56-.65.19-.22.25-.37.37-.62.13-.25.06-.47-.03-.65-.09-.19-.84-2.02-1.15-2.77-.3-.73-.61-.63-.84-.64h-.72c-.25 0-.65.09-.99.47-.34.37-1.3 1.27-1.3 3.1s1.33 3.6 1.52 3.85c.19.25 2.62 4 6.35 5.61.89.38 1.58.61 2.12.78.89.28 1.7.24 2.34.15.71-.11 2.2-.9 2.51-1.77.31-.87.31-1.61.22-1.77-.09-.15-.34-.25-.71-.44Z"/>
    </svg>
  );
}

function App() {

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [heroPhoto, setHeroPhoto] = useState("");

  useEffect(() => {
    const photos = [...new Set(products.map((product) => {
      const photo = product.imageUrl || product.image_url ||
        product.images?.[0] || product.image || "";
      return typeof photo === "string" && /^https?:\/\//i.test(photo)
        ? photo : "";
    }).filter(Boolean))];

    if (!photos.length) {
      setHeroPhoto("");
      return;
    }

    const choosePhoto = (previous = "") => {
      const alternatives = photos.filter((photo) => photo !== previous);
      const pool = alternatives.length ? alternatives : photos;
      return pool[Math.floor(Math.random() * pool.length)];
    };

    setHeroPhoto((previous) =>
      photos.includes(previous) ? previous : choosePhoto()
    );

    const timer = window.setInterval(() => {
      setHeroPhoto((previous) => choosePhoto(previous));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [products]);



  useEffect(() => {
    let active = true;

    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar catálogo:", error.message);
        if (active) notify("Não foi possível carregar os produtos.");
      } else if (active) {
        setProducts((data || []).map((p) => ({
          ...p,
          imageUrl: p.image_url || p.image || "",
          images: Array.isArray(p.images) ? p.images : [],
          oldPrice: p.old_price ?? null,
          tag: p.tag || "Disponível",
          emoji: p.emoji || "🎀",
          color: p.color || "product-pink",
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
        })));
      }

      if (active) setProductsLoading(false);
    }

    loadProducts();
    return () => { active = false; };
  }, []);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [category, setCategory] = useState("Todos");


  const [categories, setCategories] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("caprichobaby_categories") || "null");
      return Array.isArray(saved) && saved.length
        ? ["Todos", ...saved.filter((name) => name !== "Todos")]
        : DEFAULT_CATEGORIES.map((item) => item.name);
    } catch {
      return DEFAULT_CATEGORIES.map((item) => item.name);
    }
  });
  const availableCategories = useMemo(() => {
      const names = [
        ...categories,
        ...products.map((product) =>
          typeof product.category === "string" ? product.category.trim() : ""
        ),
      ].filter(Boolean);
  
      return ["Todos", ...new Set(names.filter(
        (name) => name.toLocaleLowerCase("pt-BR") !== "todos"
      ))];
    }, [categories, products]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    let active = true;

    async function loadCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("name")
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao carregar categorias:", error.message);
        return;
      }

      if (active && data) {
        const names = data
          .map((item) => item.name)
          .filter((name) => typeof name === "string" && name.trim());

        if (names.length) {
          setCategories(["Todos", ...new Set(names.filter(
            (name) => name.toLocaleLowerCase("pt-BR") !== "todos"
          ))]);
        }
      }
    }

    loadCategories();
    const handleFocus = () => loadCategories();
    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");

  const normalizeText = (value) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLocaleLowerCase("pt-BR");

  const filtered = useMemo(() => {
    const searchText = normalizeText(search);

    return products.filter((product) => {
      const productName = normalizeText(product.name);
      const productCategory = normalizeText(
        typeof product.category === "string"
          ? product.category
          : product.category?.name ?? product.category?.label ?? ""
      );
      const selectedCategory = normalizeText(category);

      const matchesCategory =
        selectedCategory === "todos" ||
        productCategory === selectedCategory ||
        productCategory.includes(selectedCategory) ||
        selectedCategory.includes(productCategory);

      const matchesSearch =
        !searchText ||
        productName.includes(searchText) ||
        productCategory.includes(searchText);

      return matchesCategory && matchesSearch;
    });
  }, [products, category, search]);
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
    const photo = product.imageUrl || product.image_url || product.images?.[0] || product.image || "";
    return typeof photo === "string" && /^https?:\/\//i.test(photo) ? photo : "";
  }

  function checkout() {
    if (!cart.length) return;

    const lines = cart.map((item) => [
      `🛍️ *${item.name}*`,
      `Quantidade: ${item.qty}`,
      `Valor unitário: ${money(item.price)}`,
      `Subtotal: ${money(item.price * item.qty)}`
    ].join("\n"));

    const message = [
      "Olá, Capricho Baby! 💗",
      "Gostaria de fazer este pedido:",
      "",
      ...lines,
      "",
      `*Total dos produtos: ${money(cartTotal)}*`,
      "",
      "Poderiam confirmar a disponibilidade e informar o prazo e o valor da entrega? 🌸"
    ].join("\n");

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
          <a className="nav-link" href="#como-comprar" onClick={() => setMobileMenu(false)}>Como comprar</a>
          <a className="nav-link nav-support" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" onClick={() => setMobileMenu(false)}><WhatsAppIcon size={18} /> Suporte</a>
          <a className="nav-link" href="#ofertas" onClick={() => { setCategory("Todos"); setMobileMenu(false); }}>Presentes</a>
          <a className="nav-link nav-social nav-instagram"
            href="https://www.instagram.com/caprichobabyoficial/"
            target="_blank" rel="noreferrer" onClick={() => setMobileMenu(false)}>
            <InstagramIcon size={18} /> Instagram
          </a>
          <a className="nav-link nav-social nav-support"
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank" rel="noreferrer" onClick={() => setMobileMenu(false)}>
            <WhatsAppIcon size={18} /> WhatsApp
          </a>
        </nav>

        <div className="header-actions">
          <button className="icon-button" aria-label="Ir para pesquisa de produtos" onClick={() => { document.getElementById("product-search")?.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => document.getElementById("product-search")?.focus(), 350); }}>
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
              <div className="hero-product-slideshow" aria-label="Fotos dos produtos da loja">
                {heroPhoto ? (
                  <img key={heroPhoto} src={heroPhoto} alt="Produto da Capricho Baby" />
                ) : (
                  <span className="hero-photo-placeholder">🎀</span>
                )}
              </div>
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
            {categories.map((name, index) => {
              const item = typeof name === "string"
                ? { name, emoji: DEFAULT_CATEGORIES.find((c) => c.name === name)?.emoji || "🧸", color: DEFAULT_CATEGORIES.find((c) => c.name === name)?.color || ["lilac", "pink", "yellow", "blue", "mint", "peach"][index % 6] }
                : name;
              return (
              <button key={item.name} className={`category-card ${item.color} ${category === item.name ? "selected" : ""}`} onClick={() => selectCategory(item.name)}>
                <span className="category-emoji">{item.emoji}</span>
                <b>{item.name}</b>
                <span className="category-arrow"><ArrowRight size={15} /></span>
              </button>
              );
            })}
          </div>
        </section>

        <section className="products-section" id="produtos">
          <div className="container">
            <div className="section-heading products-heading" id="novidades">
              <div><span className="eyebrow">Nossa seleção especial</span><h2>Fofuras que dão vontade de <span>abraçar!</span></h2></div>
              <button className="outline-button" onClick={() => { setCategory("Todos"); setSearch(""); }}>Ver todos os produtos <ArrowRight size={16} /></button>
            </div>
            <div className="product-search-toolbar">
              <div className="product-search-box">
                <Search size={20} aria-hidden="true" />
                <input
                  id="product-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="O que você está procurando?"
                  aria-label="Pesquisar produtos"
                />
                {search && (
                  <button type="button" className="search-clear"
                    onClick={() => setSearch("")} aria-label="Limpar pesquisa">
                    <X size={18} />
                  </button>
                )}
              </div>
              <button type="button" className="product-filter-button"
                aria-expanded={filtersOpen}
                aria-controls="categorias-produtos"
                onClick={() => setFiltersOpen((open) => !open)}>
                <span className="filter-icon" aria-hidden="true">☷</span>
                Filtros {filtersOpen ? "−" : "+"}
              </button>
            </div>
            <div className="filter-row">
              
            </div>
            {filtersOpen && (
              <div className="filter-pills filter-panel" id="categorias-produtos">
                {availableCategories.map((name) => (
                  <button type="button" key={name}
                    onClick={() => { selectCategory(name); setFiltersOpen(false); }}
                    className={category === name ? "filter-pill active" : "filter-pill"}>
                    {name}
                  </button>
                ))}
              </div>
            )}
            {filtered.length ? (
              <div className="product-grid">
                {filtered.map((product) => (
                  <article className="product-card" key={product.id} role="button" tabIndex={0}
                    aria-label={`Ver detalhes de ${product.name}`}
                    onClick={() => { setGalleryIndex(0); setSelectedProduct(product); setGalleryIndex(0); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { setGalleryIndex(0); setSelectedProduct(product); setGalleryIndex(0); } }}>
                    <div className={`product-image ${product.color}`}>
                      <img src={getProductPhoto(product)} alt={product.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
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
            <p className="demo-note"></p>
          </div>
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
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="footer-contact"><WhatsAppIcon size={19} /> Fale com a loja</a>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} Capricho Baby. Todos os direitos reservados.</span><span>Feito com carinho <Heart size={12} fill="currentColor" /></span></div>
</footer>

      {selectedProduct && <div className="overlay product-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null); }}>
        <section className="product-modal" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selectedProduct.name}`}>
          <button className="product-modal-close icon-button" onClick={() => setSelectedProduct(null)} aria-label="Fechar detalhes"><X /></button>
          <div className="detail-gallery">
            {(() => {
              const photos = [
                ...(selectedProduct.images || []),
                selectedProduct.imageUrl || selectedProduct.image_url || selectedProduct.image || ""
              ].filter((photo, index, all) =>
                typeof photo === "string" &&
                /^https?:\/\//i.test(photo) &&
                all.indexOf(photo) === index
              );
              const count = photos.length;
              const index = count ? Math.min(galleryIndex, count - 1) : 0;
              return (
                <>
                  <div className={`detail-main-image ${selectedProduct.color || ""}`}>
                    {count ? (
                      <img src={photos[index]} alt={`${selectedProduct.name} — foto ${index + 1}`} />
                    ) : (
                      <div className="detail-no-image">Foto ainda não cadastrada</div>
                    )}
                    {count > 1 && <>
                      <button className="gallery-arrow gallery-prev" aria-label="Foto anterior"
                        onClick={() => setGalleryIndex((i) => (i - 1 + count) % count)}><ChevronLeft /></button>
                      <button className="gallery-arrow gallery-next" aria-label="Próxima foto"
                        onClick={() => setGalleryIndex((i) => (i + 1) % count)}><ChevronRight /></button>
                      <span className="gallery-counter">{index + 1} / {count}</span>
                    </>}
                  </div>
                  {count > 1 && <div className="detail-thumbnails">
                    {photos.map((photo, i) => (
                      <button key={photo} className={index === i ? "detail-thumb active" : "detail-thumb"}
                        onClick={() => setGalleryIndex(i)} aria-label={`Ver foto ${i + 1}`}>
                        <img src={photo} alt="" />
                      </button>
                    ))}
                  </div>}
                </>
              );
            })()}
          </div>
          <div className="product-detail-info">
            <span className="eyebrow">{selectedProduct.category} · Capricho Baby</span>
            <h2>{selectedProduct.name}</h2>
            <div className="detail-price">{money(selectedProduct.price)} {selectedProduct.oldPrice && <del>{money(selectedProduct.oldPrice)}</del>}</div>
            <span className="detail-tag"><Sparkles size={14} /> {selectedProduct.tag}</span>
            <p className="detail-description">{selectedProduct.description || "Consulte pelo WhatsApp os detalhes e a disponibilidade deste produto."}</p>
            <div className="detail-perks">
              <span><PackageCheck size={17} /> Disponibilidade a confirmar</span>
              <span><MessageCircle size={17} /> Atendimento pelo WhatsApp</span>
            </div>
            <div className="detail-actions">
              <button className="primary-button detail-add" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}><ShoppingBag size={18} /> Adicionar à sacola</button>
              <button className={`detail-favorite ${favorites.includes(selectedProduct.id) ? "hearted" : ""}`} onClick={() => toggleFavorite(selectedProduct)} aria-label="Adicionar aos favoritos"><Heart fill={favorites.includes(selectedProduct.id) ? "currentColor" : "none"} /></button>
            </div>
            <button className="detail-whatsapp" onClick={() => {
              const message = [
                "Olá, Capricho Baby! 💗",
                "Tenho interesse neste produto:",
                "",
                `🛍️ *${selectedProduct.name}*`,
                `Valor: ${money(selectedProduct.price)}`,
                "",
                "Poderiam informar a disponibilidade e as opções de entrega? 🌸"
              ].join("\n");
              window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
            }}><WhatsAppIcon size={19} /> Consultar este produto</button>
          </div>
        </section>
      </div>}

      {cartOpen && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}>
        <aside className="side-drawer">
          <div className="drawer-header"><div><span className="eyebrow">Sua seleção especial</span><h2>Minha sacola <span>({cartCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Fechar sacola"><X /></button></div>
          {!cart.length ? <div className="drawer-empty"><span className="empty-bag"><ShoppingBag /></span><h3>Sua sacola está esperando!</h3><p>Adicione suas fofuras favoritas para continuar.</p><button className="primary-button" onClick={() => setCartOpen(false)}>Continuar comprando</button></div> :
            <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><div className={`cart-thumb ${item.color || ""}`}>
                {getProductPhoto(item)
                  ? <img src={getProductPhoto(item)} alt={item.name} loading="lazy" />
                  : <span>{item.emoji || "🎀"}</span>}
              </div><div className="cart-item-info"><b>{item.name}</b><strong>{money(item.price)}</strong><div className="qty-control"><button onClick={() => changeQty(item.id, -1)} aria-label="Diminuir quantidade"><Minus size={14} /></button><span>{item.qty}</span><button onClick={() => changeQty(item.id, 1)} aria-label="Aumentar quantidade"><Plus size={14} /></button></div></div><button className="remove-item" onClick={() => setCart((current) => current.filter((p) => p.id !== item.id))} aria-label="Remover produto"><Trash2 size={17} /></button></div>)}</div>
            <div className="drawer-footer"><div className="subtotal"><span>Total dos produtos</span><strong>{money(cartTotal)}</strong></div><p><MessageCircle size={15} /> A entrega será combinada pelo WhatsApp.</p><button className="checkout-button" onClick={checkout}>Finalizar pelo WhatsApp <ArrowRight size={18} /></button><button className="continue-button" onClick={() => setCartOpen(false)}>Continuar comprando</button></div></>}
        </aside>
      </div>}

      {favoritesOpen && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setFavoritesOpen(false); }}>
        <aside className="side-drawer">
          <div className="drawer-header"><div><span className="eyebrow">Seus preferidos</span><h2>Meus favoritos <span>({favorites.length})</span></h2></div><button className="icon-button" onClick={() => setFavoritesOpen(false)} aria-label="Fechar favoritos"><X /></button></div>
          {!favoriteProducts.length ? <div className="drawer-empty"><span className="empty-bag"><Heart /></span><h3>Seu coração ainda não escolheu!</h3><p>Toque no coração dos produtos para guardar seus favoritos aqui.</p><button className="primary-button" onClick={() => setFavoritesOpen(false)}>Explorar produtos</button></div> :
            <div className="cart-items">{favoriteProducts.map((item) => <div className="cart-item" key={item.id}><div className={`cart-thumb ${item.color || ""}`}>
                {getProductPhoto(item)
                  ? <img src={getProductPhoto(item)} alt={item.name} loading="lazy" />
                  : <span>{item.emoji || "🎀"}</span>}
              </div><div className="cart-item-info"><b>{item.name}</b><strong>{money(item.price)}</strong><button className="favorite-add" onClick={() => addToCart(item)}><Plus size={14} /> Adicionar à sacola</button></div><button className="remove-item" onClick={() => toggleFavorite(item)} aria-label="Remover favorito"><Heart size={17} fill="currentColor" /></button></div>)}</div>}
        </aside>
      </div>}

      {toast && <div className="toast"><span>♡</span>{toast}</div>}
      <button className="floating-whatsapp" aria-label="Conversar no WhatsApp" onClick={() => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá, Capricho Baby! 💗")}`, "_blank", "noopener,noreferrer")}><WhatsAppIcon size={24} /><span>Fale com a gente</span></button>
    </div>
  );
}

export default App;
