import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def prepare_all_store_and_app_assets():
    print("--- 1. Fixing Android Adaptive Icon & Splash Screen ---")
    icon_path = 'assets/images/icon.png'
    orig = Image.open(icon_path).convert('RGBA')

    # 1.1 Android Adaptive Icon Foreground:
    # 1024x1024 canvas, logo resized to 680x680 centered (66% safe zone)
    fg_canvas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    logo_680 = orig.resize((680, 680), Image.Resampling.LANCZOS)
    fg_canvas.paste(logo_680, (172, 172), logo_680)
    fg_canvas.save('assets/images/android-icon-foreground.png', 'PNG', optimize=True)
    print("[OK] assets/images/android-icon-foreground.png (Centered 66% safe zone)")

    # 1.2 Android Adaptive Icon Background:
    # Clean solid cream #F7F5F0
    bg_canvas = Image.new('RGBA', (1024, 1024), (247, 245, 240, 255))
    bg_canvas.save('assets/images/android-icon-background.png', 'PNG', optimize=True)
    print("[OK] assets/images/android-icon-background.png (Clean #F7F5F0)")

    # 1.3 Splash Icon:
    # Clean centered logo on transparent canvas for #0d0f17 background
    splash_canvas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    logo_480 = orig.resize((480, 480), Image.Resampling.LANCZOS)
    splash_canvas.paste(logo_480, (272, 272), logo_480)
    splash_canvas.save('assets/images/splash-icon.png', 'PNG', optimize=True)
    print("[OK] assets/images/splash-icon.png (Transparent floating logo)")

    print("\n--- 2. Generating 1080x1920 Google Play Store Screenshots ---")
    store_dir = 'assets/store'
    os.makedirs(store_dir, exist_ok=True)

    cera_bold = 'assets/fonts/CeraPro-Bold.otf'
    cera_medium = 'assets/fonts/CeraPro-Medium.otf'

    try:
        font_header = ImageFont.truetype(cera_bold, 62)
        font_sub = ImageFont.truetype(cera_medium, 36)
        font_badge = ImageFont.truetype(cera_bold, 28)
        font_card_title = ImageFont.truetype(cera_bold, 40)
        font_card_desc = ImageFont.truetype(cera_medium, 28)
    except Exception:
        font_header = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_badge = ImageFont.load_default()
        font_card_title = ImageFont.load_default()
        font_card_desc = ImageFont.load_default()

    screens_data = [
        {
            "filename": "screenshot_1_library.png",
            "tag": "DÜNYA ƏDƏBİYYATI",
            "title": "Klassik Əsərləri Orijinalda Oxuyun",
            "subtitle": "1,500+ dünya incisi, müəllif kolleksiyaları və oflayn oxu",
            "accent": (212, 175, 122),
            "feature_items": [
                ("Moby Dick, Qürur və Qərəz, Şerlok Holms və yüzlərlə şah əsər", "📚"),
                ("Oflayn oxuma rejimi — internet olmadan da oxuyun", "✈️"),
                ("Fərdi oxu statistikası və gündəlik hədəflər", "🎯")
            ]
        },
        {
            "filename": "screenshot_2_reading.png",
            "tag": "İNTERAKTİV OXU",
            "title": "Sözə Toxunun — Dərhal Tərcümə Alın",
            "subtitle": "11,000+ oflayn lüğət bazası, fonetika və cümlə tərcüməsi",
            "accent": (59, 130, 246),
            "feature_items": [
                ("Mətndəki naməlum sözləri 1 toxunuşla dərhal öyrənin", "👆"),
                ("Səsli tələffüz və beynəlxalq fonetik transkripsiya", "🔊"),
                ("13 xarici dilə cümlə və abzas tərcüməsi", "🌐")
            ]
        },
        {
            "filename": "screenshot_3_vocabulary.png",
            "tag": "SÖZ EHTİYATI",
            "title": "Ağıllı SRS Metodu ilə Sözləri Unutmayın",
            "subtitle": "Yadda saxlama intervalları ilə uzunmüddətli yaddaşa köçürün",
            "accent": (16, 185, 129),
            "feature_items": [
                ("3D Flashcard sistemi ilə gündəlik təkrar", "🗂️"),
                ("Avtomatik səviyyə təyini və öyrənilən sözlər bazası", "⭐"),
                ("Bulud sinxronizasiyası — sözləriniz həmişə qorunur", "☁️")
            ]
        },
        {
            "filename": "screenshot_4_games.png",
            "tag": "OYUNLAR VƏ LİQALAR",
            "title": "Oyunlarla Öyrənin, Liqalarda Yarışın",
            "subtitle": "Cütləri tap, Sürətli söz kvizi və həftəlik rəqabət",
            "accent": (245, 158, 11),
            "feature_items": [
                ("Zamana qarşı Cütləri Tap oyunu ilə refleksləri gücləndirin", "⏱️"),
                ("Həftəlik Qlobal Liqada Top 10 dərəcəsi qazanın", "🏆"),
                ("Gündəlik oxu seriyası (Streak) ilə vərdiş yaradın", "🔥")
            ]
        }
    ]

    for item in screens_data:
        canvas = Image.new('RGB', (1080, 1920), (13, 15, 23)) # Deep navy background #0D0F17
        draw = ImageDraw.Draw(canvas)

        # Top decorative glow
        for r in range(400, 0, -8):
            alpha = int(22 * (1 - r / 400))
            col = (int(item["accent"][0] * 0.15), int(item["accent"][1] * 0.15), int(item["accent"][2] * 0.18))
            draw.ellipse([540 - r, 300 - r, 540 + r, 300 + r], fill=col)

        # Header Badge
        badge_text = f"  {item['tag']}  "
        bw = draw.textlength(badge_text, font=font_badge) + 30
        bx = (1080 - bw) / 2
        draw.rounded_rectangle([bx, 90, bx + bw, 145], radius=28, fill=(26, 32, 48), outline=item["accent"], width=2)
        draw.text((bx + 15, 102), badge_text, fill=item["accent"], font=font_badge)

        # Main Title (centered, 2-line wrapped)
        words = item["title"].split(' ')
        lines = []
        cur = ""
        for w in words:
            if len(cur + ' ' + w) > 24:
                lines.append(cur)
                cur = w
            else:
                cur = (cur + ' ' + w).strip()
        if cur: lines.append(cur)

        ty = 180
        for l in lines:
            lw = draw.textlength(l, font=font_header)
            draw.text(((1080 - lw) / 2, ty), l, fill=(255, 255, 255), font=font_header)
            ty += 76

        # Subtitle
        sub_w = draw.textlength(item["subtitle"], font=font_sub)
        draw.text(((1080 - sub_w) / 2, ty + 10), item["subtitle"], fill=(148, 163, 184), font=font_sub)

        # Realistic Device Card Container in the lower half (simulating luxury mobile screen)
        card_x1, card_y1 = 80, 480
        card_x2, card_y2 = 1000, 1840
        draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=44, fill=(20, 24, 38), outline=(51, 65, 85), width=2)

        # Inner Top Bar / Header of simulated phone
        draw.rounded_rectangle([card_x1 + 4, card_y1 + 4, card_x2 - 4, card_y1 + 120], radius=40, fill=(26, 32, 48))
        draw.text((card_x1 + 50, card_y1 + 38), "Litera", fill=item["accent"], font=font_card_title)
        draw.text((card_x2 - 160, card_y1 + 44), "⚡ 100", fill=(212, 175, 122), font=font_card_desc)

        # Feature Highlights Cards inside the simulated phone
        cy = card_y1 + 180
        for text, icon in item["feature_items"]:
            draw.rounded_rectangle([card_x1 + 40, cy, card_x2 - 40, cy + 220], radius=24, fill=(30, 38, 58), outline=(212, 175, 122, 50), width=1)
            draw.text((card_x1 + 75, cy + 45), icon, font=font_header)
            
            # Text wrapping
            feat_words = text.split(' ')
            flines = []
            fcur = ""
            for fw in feat_words:
                if len(fcur + ' ' + fw) > 28:
                    flines.append(fcur)
                    fcur = fw
                else:
                    fcur = (fcur + ' ' + fw).strip()
            if fcur: flines.append(fcur)
            
            fty = cy + 45
            for fl in flines:
                draw.text((card_x1 + 165, fty), fl, fill=(241, 245, 249), font=font_card_desc)
                fty += 42
            cy += 260

        # Footer CTA inside phone
        cta_y = card_y2 - 180
        draw.rounded_rectangle([card_x1 + 60, cta_y, card_x2 - 60, cta_y + 100], radius=50, fill=item["accent"])
        cta_text = "İndi Kəşf Et ➔"
        cw = draw.textlength(cta_text, font=font_card_title)
        draw.text(((1080 - cw) / 2, cta_y + 24), cta_text, fill=(13, 15, 23), font=font_card_title)

        out_path = os.path.join(store_dir, item["filename"])
        canvas.save(out_path, 'PNG', optimize=True)
        print(f"[OK] Generated {out_path} (1080x1920)")

    print("\nAll assets and screenshots generated successfully!")

if __name__ == '__main__':
    prepare_all_store_and_app_assets()
