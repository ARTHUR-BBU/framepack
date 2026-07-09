from core.taste_html_detectors import detect_html_taste_issues


def codes_for(html: str) -> set[str]:
    return {issue.code for issue in detect_html_taste_issues(html)}


def test_detects_fake_product_ui_divs_when_product_cards_are_div_built():
    html = """
    <main class="product-dashboard mockup">
      <div class="browser-bar"></div>
      <div class="sidebar"></div>
      <div class="chart-card"></div>
      <div class="metric-card">42%</div>
    </main>
    """

    assert "fake_product_ui_divs" in codes_for(html)


def test_does_not_flag_real_image_or_video_product_preview():
    html = """
    <section class="product-hero">
      <img src="assets/dashboard.png" alt="Real product dashboard screenshot">
      <video src="assets/demo.mp4"></video>
    </section>
    """

    assert "fake_product_ui_divs" not in codes_for(html)


def test_detects_raw_scroll_listener_without_supported_scroll_system():
    html = """
    <script>
      window.addEventListener('scroll', () => {
        hero.style.transform = `translateY(${window.scrollY * 0.2}px)`;
      });
    </script>
    """

    assert "raw_scroll_listener" in codes_for(html)


def test_allows_intersection_observer_or_scrolltrigger():
    html = """
    <script>
      const observer = new IntersectionObserver(() => {});
      gsap.to('.card', { scrollTrigger: { trigger: '.card' }, y: 20 });
    </script>
    """

    assert "raw_scroll_listener" not in codes_for(html)


def test_detects_motion_without_reduced_motion_fallback():
    html = """
    <style>.card { animation: float 2s infinite; }</style>
    <script>gsap.to('.card', { y: 20, duration: 1 });</script>
    """

    assert "missing_reduced_motion" in codes_for(html)


def test_allows_reduced_motion_fallback():
    html = """
    <style>
      .card { animation: float 2s infinite; }
      @media (prefers-reduced-motion: reduce) { .card { animation: none; } }
    </style>
    """

    assert "missing_reduced_motion" not in codes_for(html)


def test_detects_decorative_generated_surface_without_story_role():
    html = """
    <div class="ambient-grid glow crosshair stripe-field"></div>
    <div class="hero-copy">AI operating layer</div>
    """

    assert "decorative_generated_surface" in codes_for(html)


def test_allows_grid_when_it_has_product_or_data_role():
    html = """
    <div class="data-grid product-architecture" aria-label="Real product data topology"></div>
    """

    assert "decorative_generated_surface" not in codes_for(html)


# ── Phase 4 gap detectors ──

def test_detects_gradient_text_slop():
    html = """
    <style>
      .hero-title {
        background: linear-gradient(135deg, #6366f1, #a855f7);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    </style>
    <h1 class="hero-title">AI Operating Layer</h1>
    """

    assert "gradient_text_slop" in codes_for(html)


def test_allows_solid_color_text():
    html = """
    <style>
      .hero-title { color: #1a1a2e; background: #f5f5f5; }
    </style>
    <h1 class="hero-title">AI Operating Layer</h1>
    """

    assert "gradient_text_slop" not in codes_for(html)


def test_detects_bounce_or_elastic_easing():
    html = """
    <script>
      gsap.to('.card', { y: -20, ease: 'elastic.out(1, 0.3)' });
      gsap.to('.title', { scale: 1, ease: 'bounce.out' });
    </script>
    """

    assert "bounce_or_elastic_easing" in codes_for(html)


def test_allows_power_easing():
    html = """
    <script>
      gsap.to('.card', { y: -20, ease: 'power2.out' });
    </script>
    """

    assert "bounce_or_elastic_easing" not in codes_for(html)


def test_detects_over_rounded_codex_cards():
    html = """
    <style>
      .card { border-radius: 48px; }
    </style>
    <div class="card">Content</div>
    """

    assert "over_rounded_codex_cards" in codes_for(html)


def test_allows_moderate_radius():
    html = """
    <style>
      .card { border-radius: 12px; }
    </style>
    <div class="card">Content</div>
    """

    assert "over_rounded_codex_cards" not in codes_for(html)


def test_detects_ghost_card_shadow_border():
    html = """
    <style>
      .card {
        border: 1px solid rgba(0,0,0,0.1);
        box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      }
    </style>
    <div class="card">Content</div>
    """

    assert "ghost_card_shadow_border" in codes_for(html)


def test_allows_shadow_only_without_border():
    html = """
    <style>
      .card { box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    </style>
    <div class="card">Content</div>
    """

    assert "ghost_card_shadow_border" not in codes_for(html)
