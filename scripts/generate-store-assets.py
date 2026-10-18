import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_store_assets():
    icon_path = 'assets/images/icon.png'
    store_dir = 'assets/store'
    os.makedirs(store_dir, exist_ok=True)

    if not os.path.exists(icon_path):
        print(f"Error: {icon_path} not found.")
        return

    # 1. Generate 512x512 High-Res Icon from original icon.png
    print("Processing 512x512 High-Res App Icon from original logo...")
    original_icon = Image.open(icon_path).convert('RGBA')
    icon_512 = original_icon.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(os.path.join(store_dir, 'icon_512.png'), 'PNG', optimize=True)
    
    # Also save JPG version with white/cream background for compatibility
    icon_512_rgb = Image.new('RGB', (512, 512), (247, 245, 240))
    icon_512_rgb.paste(icon_512, (0, 0), icon_512)
    icon_512_rgb.save(os.path.join(store_dir, 'icon_512.jpg'), 'JPEG', quality=95)
    print("[OK] Created assets/store/icon_512.png and icon_512.jpg")

    # 2. Generate 1024x500 Feature Graphic using the original logo
    print("Creating 1024x500 Feature Graphic Banner using original logo...")
    banner_w, banner_h = 1024, 500
    banner = Image.new('RGB', (banner_w, banner_h), (13, 15, 23)) # Deep navy background #0D0F17
    draw = ImageDraw.Draw(banner)

    # Add subtle luxury background gradient / lighting
    # Subtle warm radial glow in the center-left
    for r in range(350, 0, -5):
        alpha = int(18 * (1 - r / 350))
        glow_color = (25 + int(alpha * 1.5), 22 + int(alpha * 1.2), 30 + alpha)
        draw.ellipse([260 - r, 250 - r, 260 + r, 250 + r], fill=glow_color)

    # Scale the original logo to fit cleanly on the left (e.g. 340x340)
    logo_size = 320
    logo_scaled = original_icon.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

    # Subtle drop shadow for the logo
    shadow = Image.new('RGBA', (logo_size + 40, logo_size + 40), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle([20, 20, logo_size + 20, logo_size + 20], radius=50, fill=(0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(15))

    # Paste shadow and logo at (90, 90)
    logo_x = 90
    logo_y = 90
    banner.paste(shadow, (logo_x - 20, logo_y - 10), shadow)
    banner.paste(logo_scaled, (logo_x, logo_y), logo_scaled)

    # Typography on the right side
    # Try to load high quality serif font or fallback to default
    font_title = None
    font_subtitle = None
    font_tag = None

    # Check available fonts in assets/fonts/
    cera_bold = 'assets/fonts/CeraPro-Bold.otf'
    cera_medium = 'assets/fonts/CeraPro-Medium.otf'

    try:
        if os.path.exists(cera_bold):
            font_title = ImageFont.truetype(cera_bold, 64)
            font_subtitle = ImageFont.truetype(cera_medium, 22)
            font_tag = ImageFont.truetype(cera_medium, 16)
        else:
            font_title = ImageFont.load_default()
            font_subtitle = ImageFont.load_default()
            font_tag = ImageFont.load_default()
    except Exception:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_tag = ImageFont.load_default()

    # Draw Title "LITERA" in luxury gold #D4AF7A
    text_x = 480
    draw.text((text_x, 110), "LITERA", fill=(212, 175, 122), font=font_title)

    # Draw Subtitle "Read Classic Literature & Master Languages"
    draw.text((text_x, 195), "Read Classic Literature & Master Languages", fill=(241, 245, 249), font=font_subtitle)

    # Secondary description
    draw.text((text_x, 235), "Offline dictionary • Instant translation • Interactive vocabulary", fill=(148, 163, 184), font=font_tag)

    # Feature badges / pills
    badges = [
        ("• 1,500+ Classic Books", 480, 310),
        ("• 11,000+ Offline Words", 720, 310),
        ("• 7 Target Languages", 480, 370),
        ("• Gamified Leagues", 720, 370)
    ]

    for label, bx, by in badges:
        # Draw rounded badge background
        bw, bh = 210, 42
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=21, fill=(26, 32, 48), outline=(212, 175, 122, 60), width=1)
        draw.text((bx + 18, by + 12), label, fill=(226, 232, 240), font=font_tag)

    # Save Feature Graphic
    feature_png = os.path.join(store_dir, 'feature_graphic.png')
    feature_jpg = os.path.join(store_dir, 'feature_graphic.jpg')
    banner.save(feature_png, 'PNG', optimize=True)
    banner.save(feature_jpg, 'JPEG', quality=95)
    print("[OK] Created assets/store/feature_graphic.png and feature_graphic.jpg (1024x500)")
    print("\nAll Play Store graphics generated using the authentic original logo!")

if __name__ == '__main__':
    create_store_assets()
