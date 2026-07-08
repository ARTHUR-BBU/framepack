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
