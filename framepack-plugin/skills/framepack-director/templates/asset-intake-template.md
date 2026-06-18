---
# Asset Intake Manifest
# Template — copy this structure for each project. Fill in what the user provides.
# Leave fields as null when the user doesn't have them.
intake_date: ""
video_type: ""  # brand_product_launch | educational | social_teaser | kinetic_type | other
intake_depth: ""  # full | partial | minimal

brand:
  name: ""
  logo:
    path: ""        # relative to project root, e.g. assets/logo.svg
    format: ""      # svg | png | webp | jpg
    transparent: null  # true | false | null (unknown)
    status: ""      # ready | needs_processing | missing
  colors:
    primary: ""     # hex, e.g. "#1a1a2e"
    accent: ""
    background: ""
    surface: ""
    source: ""      # brand_vi | user_provided | agent_matched | null
  fonts:
    heading: ""
    body: ""
    source: ""      # brand_vi | user_provided | agent_matched | null
  slogan: ""
  tagline: ""

products: []
# Each product entry:
# - name: "Product Name"
#   images:
#     - path: "assets/product-01.png"
#       format: "png"
#       transparent: true
#       status: "ready"
#       note: "扣过图，正面展示"
#     - path: "assets/product-lifestyle.jpg"
#       format: "jpg"
#       transparent: false
#       status: "needs_processing"
#       note: "生活方式照，有背景，建议 remove-background"

footage: []
# Each footage entry:
# - path: "assets/clip-01.mp4"
#   duration: ""    # "5s" or "" if unknown
#   resolution: ""  # "1920x1080" or "" if unknown
#   description: "产品使用场景实拍"

text:
  selling_points: []
  product_description: ""
  cta: ""
  brand_story: ""

audio:
  bgm:
    path: ""        # if user has licensed music file
    preference: ""  # style description if no file
  voiceover:
    path: ""        # if user has recorded audio
    script: ""      # if TTS is needed
    voice: ""       # preferred voice style

references: []
# Each reference entry:
# - url: "https://..."
#   note: "喜欢这个光影质感"

missing: []
# List of critical assets the user doesn't have:
# - licensed_bgm
# - product_images
# - voiceover_script
---
