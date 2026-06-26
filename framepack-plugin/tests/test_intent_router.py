import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.intent_router import route_intent


def test_routes_product_launch_from_product_url():
    route = route_intent("Make a 30s product launch video for https://example.com")
    assert route.workflow == "product-launch-video"
    assert route.confidence == "high"
    assert "logo" in route.likely_assets
    assert "product screenshots" in route.likely_assets
    assert route.user_choices == [
        "provide_assets",
        "generate_programmatic_visuals",
        "continue_without_assets",
    ]


def test_routes_general_website_tour():
    route = route_intent("Turn this portfolio website into a homepage tour video: https://studio.example")
    assert route.workflow == "website-to-video"
    assert "website screenshots" in route.likely_assets
    assert "capture" in route.hyperframes_role.lower()


def test_routes_faceless_explainer_for_topic():
    route = route_intent("做一个解释 DNS 工作原理的科普视频")
    assert route.workflow == "faceless-explainer"
    assert "topic notes" in route.likely_assets
    assert any("generic" in risk.lower() or "抽象" in risk for risk in route.handoff_risks)


def test_routes_github_pr_to_pr_video():
    route = route_intent("Turn github.com/org/repo/pull/123 into a changelog video")
    assert route.workflow == "pr-to-video"
    assert "PR link" in route.likely_assets


def test_routes_embedded_captions_for_plain_subtitles():
    route = route_intent("给这个 talking-head MP4 加字幕，不要改原视频")
    assert route.workflow == "embedded-captions"
    assert "source video" in route.likely_assets
    assert "transcript" in route.likely_assets


def test_routes_graphic_overlays_for_talking_head_packaging():
    route = route_intent("给这个访谈视频加 lower-thirds、数据卡片和 graphic overlays")
    assert route.workflow == "graphic-overlays"
    assert "overlay copy" in route.likely_assets


def test_routes_motion_graphics_for_short_logo_or_stat():
    route = route_intent("做一个 8 秒 logo sting，透明背景 lower-third 也可以")
    assert route.workflow == "motion-graphics"
    assert "logo" in route.likely_assets


def test_routes_template_reuse_path_for_noema():
    route = route_intent("用 NOEMA scroll video template 改成我的品牌视频")
    assert route.workflow == "framepack-template-reuse"
    assert route.framepack_role.startswith("template")
    assert "template variables" in route.likely_assets


def test_routes_template_menu_when_user_asks_for_video_template_reference():
    route = route_intent("方向B确定，30秒发布视频。你有视频模版给我参考吗？")
    assert route.workflow == "framepack-template-reuse"
    assert route.confidence == "high"
    assert "template menu" in route.framepack_role.lower()


def test_routes_template_menu_for_builtin_template_starter_request():
    route = route_intent("有没有内置模板？给我一个模板起步")
    assert route.workflow == "framepack-template-reuse"
    assert "template menu" in route.framepack_role.lower()


def test_routes_reference_extraction_path():
    route = route_intent("参考这个动态网页/视频，把它提炼成可复用模板")
    assert route.workflow == "framepack-reference-extraction"
    assert "reference video or URL" in route.likely_assets


def test_unclear_custom_defaults_to_general_video():
    route = route_intent("帮我做个有感觉的视频")
    assert route.workflow == "general-video"
    assert route.confidence in {"low", "medium"}
    assert "creative brief" in route.likely_assets


def test_route_can_render_as_dict_for_hooks_and_manifest():
    route = route_intent("product promo for my SaaS")
    data = route.to_dict()
    assert data["workflow"] == "product-launch-video"
    assert isinstance(data["likely_assets"], list)
    assert data["user_choices"][-1] == "continue_without_assets"
