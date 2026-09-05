#!/usr/bin/env python3
"""Generate architecture/workflow diagrams and UI wireframe screenshots for the NILAM hardware TRS."""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent / "spec-assets"
OUT.mkdir(parents=True, exist_ok=True)

# JP Morgan / consulting palette
NAVY = "#0B2545"
GOLD = "#C4A35A"
SLATE = "#334155"
LIGHT = "#F8FAFC"
BLUE = "#1E40AF"
ORANGE = "#EA580C"
GREEN = "#047857"
WHITE = "#FFFFFF"
MUTED = "#64748B"


def _font(size: int, bold: bool = False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def save_fig(fig, name: str):
    path = OUT / name
    fig.savefig(path, dpi=160, bbox_inches="tight", facecolor=WHITE)
    plt.close(fig)
    print(f"wrote {path}")
    return path


def draw_architecture():
    fig, ax = plt.subplots(figsize=(11, 6.2))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 6.5)
    ax.axis("off")
    ax.set_title(
        "NILAM Field Stack — Three-Layer Architecture",
        fontsize=14,
        fontweight="bold",
        color=NAVY,
        pad=12,
    )

    layers = [
        (0.4, 4.4, 10.2, 1.7, "#DBEAFE", "1. NILAM Mobile App", "Android / iOS (web PhoneFrame prototype)\nDGPS capture · Map paths · Sync · Rover/App Settings · DPR"),
        (0.4, 2.35, 10.2, 1.7, "#FEF3C7", "2. Hardware Mediation Device (THIS VENDOR)", "BLE / USB-C / Wi-Fi bridge · Local encrypted store · Telemetry pipeline\nConfig apply · Path logging · Optional GNSS protocol adapters"),
        (0.4, 0.3, 10.2, 1.7, "#D1FAE5", "3. DGPS Rover / Base / NTRIP Instruments", "Trimble R12 (illustrative) · Base / CORS · NTRIP caster · RTCM corrections\nNMEA 0183 · RTCM 3.x · proprietary receiver protocols"),
    ]
    for x, y, w, h, fill, title, body in layers:
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.15",
                                    facecolor=fill, edgecolor=NAVY, linewidth=1.6))
        ax.text(x + 0.25, y + h - 0.35, title, fontsize=11, fontweight="bold", color=NAVY, va="top")
        ax.text(x + 0.25, y + h - 0.75, body, fontsize=9, color=SLATE, va="top")

    # side arrows
    ax.annotate("", xy=(10.2, 4.25), xytext=(10.2, 4.35),
                arrowprops=dict(arrowstyle="<->", color=GOLD, lw=2))
    ax.text(10.45, 4.0, "App ↔ Device\nGATT / WS", fontsize=7, color=MUTED, ha="left")
    ax.annotate("", xy=(10.2, 2.2), xytext=(10.2, 2.3),
                arrowprops=dict(arrowstyle="<->", color=GOLD, lw=2))
    ax.text(10.45, 1.95, "Device ↔ Rover\nBT / serial", fontsize=7, color=MUTED, ha="left")

    ax.text(0.5, 6.25, "Backend / WebGIS API (sync packets, proposed paths) — App ↔ HTTPS; Device may assist uplink when tethered",
            fontsize=8, color=MUTED, style="italic")
    save_fig(fig, "fig01_architecture.png")


def _box(ax, x, y, w, h, text, fc, ec=NAVY, fs=8):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.08",
                                facecolor=fc, edgecolor=ec, linewidth=1.2))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs, color=NAVY,
            wrap=True, multialignment="center")


def draw_swimlane():
    fig, ax = plt.subplots(figsize=(12, 7))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7.2)
    ax.axis("off")
    ax.set_title("End-to-End Survey Day — Swimlane (Illustrative)", fontsize=13, fontweight="bold", color=NAVY)

    lanes = [
        (6.0, "Surveyor", "#F1F5F9"),
        (4.7, "NILAM App", "#DBEAFE"),
        (3.4, "Hardware Device", "#FEF3C7"),
        (2.1, "DGPS Rover", "#D1FAE5"),
        (0.8, "Backend API", "#EDE9FE"),
    ]
    for y, name, fc in lanes:
        ax.add_patch(Rectangle((1.6, y), 10.2, 1.15, facecolor=fc, edgecolor="#CBD5E1", linewidth=0.8))
        ax.text(0.15, y + 0.55, name, fontsize=9, fontweight="bold", color=NAVY, va="center")

    steps = [
        (1.8, 6.25, "Arrive site\nopen packet"),
        (3.3, 4.95, "Download\noffline"),
        (4.8, 4.95, "Connect\nrover"),
        (6.3, 3.65, "Pair &\nstream"),
        (7.8, 2.35, "RTK fix\nNTRIP"),
        (9.2, 4.95, "Capture\nGCP points"),
        (10.5, 3.65, "Store\noffline"),
        (3.3, 1.05, "Sync Now\nupload"),
        (6.3, 1.05, "ACK &\nconflict"),
        (9.2, 6.25, "Path\ncompliance"),
    ]
    for x, y, t in steps:
        _box(ax, x, y, 1.25, 0.7, t, WHITE, fs=7)

    # flow arrows along mid
    for x0, x1 in [(3.1, 4.7), (6.1, 7.7), (9.1, 10.4)]:
        ax.annotate("", xy=(x1, 5.3), xytext=(x0, 5.3),
                    arrowprops=dict(arrowstyle="->", color=GOLD, lw=1.4))

    ax.text(1.8, 0.25, "Sequence: Assign → Offline download → Connect → Capture/log paths → Sync to WebGIS",
            fontsize=8, color=MUTED, style="italic")
    save_fig(fig, "fig02_survey_day_swimlane.png")


def draw_capture_sequence():
    fig, ax = plt.subplots(figsize=(10, 5.5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5.8)
    ax.axis("off")
    ax.set_title("Point Capture Sequence", fontsize=13, fontweight="bold", color=NAVY)

    actors = [("App", 1.2), ("Device", 5.0), ("Rover", 8.5)]
    for name, x in actors:
        ax.text(x, 5.4, name, ha="center", fontweight="bold", color=NAVY, fontsize=10)
        ax.plot([x, x], [0.4, 5.1], color="#CBD5E1", lw=1.2, ls="--")

    msgs = [
        (1.2, 4.7, 5.0, "1. point.capture.request\n{pointId: GCP-KHT-06}"),
        (5.0, 4.1, 8.5, "2. Snapshot fix + quality"),
        (8.5, 3.5, 5.0, "3. Epoch + NMEA/quality"),
        (5.0, 2.9, 1.2, "4. point.capture.response\nACK ≤ 1s"),
        (1.2, 2.2, 5.0, "5. Optional rename before stamp"),
        (5.0, 1.5, 1.2, "6. Persist offline (Pending)"),
    ]
    for x0, y, x1, label in msgs:
        ax.annotate("", xy=(x1, y), xytext=(x0, y),
                    arrowprops=dict(arrowstyle="->", color=BLUE if x1 > x0 else GREEN, lw=1.5))
        mid = (x0 + x1) / 2
        ax.text(mid, y + 0.18, label, ha="center", fontsize=7.5, color=SLATE)
    save_fig(fig, "fig03_point_capture_sequence.png")


def draw_sync_sequence():
    fig, ax = plt.subplots(figsize=(10, 5.2))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5.5)
    ax.axis("off")
    ax.set_title("Offline → Sync Now Sequence", fontsize=13, fontweight="bold", color=NAVY)

    actors = [("App", 1.0), ("Device", 4.0), ("Backend", 7.5)]
    for name, x in actors:
        ax.text(x, 5.1, name, ha="center", fontweight="bold", color=NAVY, fontsize=10)
        ax.plot([x, x], [0.35, 4.85], color="#CBD5E1", lw=1.2, ls="--")

    msgs = [
        (1.0, 4.5, 4.0, "Sync now (pkt-khutal-042)"),
        (4.0, 3.9, 7.5, "sync.upload chunks + checksum"),
        (7.5, 3.3, 4.0, "Partial ACK / resume offset"),
        (4.0, 2.7, 1.0, "progressPct 62→100"),
        (1.0, 2.1, 4.0, "Mark GNSS points Synced"),
        (4.0, 1.5, 7.5, "Final commit & conflict report"),
        (7.5, 0.9, 1.0, "Island: Sync complete"),
    ]
    for x0, y, x1, label in msgs:
        ax.annotate("", xy=(x1, y), xytext=(x0, y),
                    arrowprops=dict(arrowstyle="->", color=ORANGE if "progress" in label else BLUE, lw=1.4))
        ax.text((x0 + x1) / 2, y + 0.15, label, ha="center", fontsize=7.5, color=SLATE)
    save_fig(fig, "fig04_offline_sync_sequence.png")


def draw_path_sequence():
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5.2)
    ax.axis("off")
    ax.set_title("Path Compliance Logging Sequence", fontsize=13, fontweight="bold", color=NAVY)

    actors = [("Backend/App", 1.2), ("Device", 5.0), ("Map UI", 8.5)]
    for name, x in actors:
        ax.text(x, 4.8, name, ha="center", fontweight="bold", color=NAVY, fontsize=10)
        ax.plot([x, x], [0.3, 4.55], color="#CBD5E1", lw=1.2, ls="--")

    msgs = [
        (1.2, 4.2, 5.0, "path.proposed.set (polyline)"),
        (5.0, 3.5, 5.0, "Log actual @ 1 Hz\n+ heading + timestamp"),
        (5.0, 2.6, 8.5, "path.actual.batch"),
        (8.5, 1.9, 8.5, "Blue dashed = Proposed\nOrange = Actual + arrows"),
        (5.0, 1.1, 1.2, "Detour (tea stall) samples retained"),
    ]
    for x0, y, x1, label in msgs:
        if abs(x0 - x1) < 0.01:
            ax.text(x0 + 0.15, y, label, fontsize=7.5, color=SLATE, va="center")
            ax.plot([x0], [y], "o", color=GOLD, ms=6)
        else:
            ax.annotate("", xy=(x1, y), xytext=(x0, y),
                        arrowprops=dict(arrowstyle="->", color=BLUE, lw=1.4))
            ax.text((x0 + x1) / 2, y + 0.15, label, ha="center", fontsize=7.5, color=SLATE)
    save_fig(fig, "fig05_path_compliance_sequence.png")


def draw_config_sequence():
    fig, ax = plt.subplots(figsize=(10, 4.8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis("off")
    ax.set_title("Rover Config Apply Sequence (App Settings → Device → Instrument)", fontsize=12, fontweight="bold", color=NAVY)

    actors = [("App Settings", 1.2), ("Device", 5.0), ("Rover/NTRIP", 8.5)]
    for name, x in actors:
        ax.text(x, 4.6, name, ha="center", fontweight="bold", color=NAVY, fontsize=10)
        ax.plot([x, x], [0.35, 4.35], color="#CBD5E1", lw=1.2, ls="--")

    msgs = [
        (1.2, 4.0, 5.0, "config.rover.apply\n(model, NTRIP, antenna ht)"),
        (5.0, 3.3, 8.5, "Open link / set mountpoint"),
        (8.5, 2.6, 5.0, "ACK or error code"),
        (5.0, 1.9, 1.2, "UI: Connected / failed"),
        (1.2, 1.2, 5.0, "Test Connection (API token)"),
    ]
    for x0, y, x1, label in msgs:
        ax.annotate("", xy=(x1, y), xytext=(x0, y),
                    arrowprops=dict(arrowstyle="->", color=GREEN, lw=1.4))
        ax.text((x0 + x1) / 2, y + 0.18, label, ha="center", fontsize=7.5, color=SLATE)
    save_fig(fig, "fig06_rover_config_sequence.png")


# ---------- UI wireframes (PhoneFrame style) ----------

def phone_frame(w=420, h=820):
    img = Image.new("RGB", (w + 80, h + 100), "#E2E8F0")
    d = ImageDraw.Draw(img)
    # bezel
    d.rounded_rectangle([30, 40, 30 + w, 40 + h], radius=36, fill="#0F172A")
    d.rounded_rectangle([40, 50, 20 + w, 30 + h], radius=28, fill=WHITE)
    # notch
    d.rounded_rectangle([w // 2 - 40, 55, w // 2 + 100, 72], radius=10, fill="#0F172A")
    return img, d, 50, 80  # content origin


def label_banner(d, ox, oy, w, title, subtitle, banner=True):
    if banner:
        d.rectangle([ox, oy, ox + w, oy + 28], fill="#FEF3C7")
        d.text((ox + 8, oy + 6), "Illustrative UI Reference — NILAM Mobile PhoneFrame", fill="#92400E", font=_font(11, True))
        oy += 28
    d.rectangle([ox, oy, ox + w, oy + 52], fill=WHITE, outline="#E2E8F0")
    d.text((ox + 14, oy + 10), title, fill=NAVY, font=_font(16, True))
    d.text((ox + 14, oy + 32), subtitle, fill=MUTED, font=_font(11))
    return oy + 52


def ui_capture():
    img, d, ox, oy = phone_frame()
    cw = 360
    oy = label_banner(d, ox, oy, cw, "DGPS / GNSS capture", "Bluetooth · NTRIP · file import")
    # status card
    d.rounded_rectangle([ox + 12, oy + 12, ox + cw - 12, oy + 250], radius=16, fill="#ECFDF5", outline="#A7F3D0")
    d.text((ox + 28, oy + 24), "Rover connected", fill=NAVY, font=_font(14, True))
    d.text((ox + 28, oy + 44), "Trimble R12 · Bluetooth", fill=MUTED, font=_font(11))
    d.rounded_rectangle([ox + 250, oy + 24, ox + cw - 24, oy + 48], radius=12, fill=WHITE, outline="#CBD5E1")
    d.text((ox + 262, oy + 30), "Disconnect", fill=SLATE, font=_font(10))

    metrics = [
        ("Lat", "19.29352"), ("Lng", "73.52641"), ("Accuracy", "0.09 m"),
        ("Satellite Count", "14"), ("HDOP", "0.8"), ("VDOP", "1.2"),
    ]
    for i, (lab, val) in enumerate(metrics):
        r, c = divmod(i, 3)
        x0 = ox + 20 + c * 110
        y0 = oy + 70 + r * 58
        d.rounded_rectangle([x0, y0, x0 + 100, y0 + 50], radius=8, fill=WHITE)
        d.text((x0 + 8, y0 + 8), lab, fill=MUTED, font=_font(10))
        d.text((x0 + 8, y0 + 24), val, fill=NAVY, font=_font(13, True))

    d.rounded_rectangle([ox + 20, oy + 190, ox + cw - 20, oy + 235], radius=8, fill=WHITE)
    d.text((ox + 28, oy + 198), "Point ID", fill=MUTED, font=_font(10))
    d.text((ox + 28, oy + 214), "GCP-KHT-06", fill=NAVY, font=_font(13, True))
    d.text((ox + cw - 70, oy + 208), "✎ Edit", fill=MUTED, font=_font(11))

    d.rounded_rectangle([ox + 12, oy + 265, ox + cw - 12, oy + 310], radius=20, fill=NAVY)
    d.text((ox + 95, oy + 280), "Capture control point", fill=WHITE, font=_font(13, True))

    d.text((ox + 12, oy + 325), "Captured points (5)", fill=MUTED, font=_font(10, True))
    for i, (lab, st) in enumerate([("GCP-KHT-12", "Synced"), ("GCP-KHT-13", "Pending"), ("GCP-KHT-14", "Synced")]):
        y = oy + 345 + i * 55
        d.rounded_rectangle([ox + 12, y, ox + cw - 12, y + 48], radius=12, fill=WHITE, outline="#E2E8F0")
        d.text((ox + 24, y + 10), lab, fill=NAVY, font=_font(12, True))
        d.text((ox + 24, y + 28), "10.92580, 79.83690 · ±0.08m · bluetooth", fill=MUTED, font=_font(9))
        color = "#047857" if st == "Synced" else "#B45309"
        bg = "#D1FAE5" if st == "Synced" else "#FEF3C7"
        d.rounded_rectangle([ox + cw - 90, y + 14, ox + cw - 24, y + 34], radius=10, fill=bg)
        d.text((ox + cw - 80, y + 17), st, fill=color, font=_font(10))

    path = OUT / "ui_gnss_capture.png"
    img.save(path, "PNG")
    print(f"wrote {path}")


def ui_sync():
    img, d, ox, oy = phone_frame()
    cw = 360
    oy = label_banner(d, ox, oy, cw, "Field sync", "Offline packets · GNSS upload to WebGIS")
    d.rounded_rectangle([ox + 12, oy + 16, ox + cw - 12, oy + 100], radius=16, fill=WHITE, outline="#E2E8F0")
    d.text((ox + 24, oy + 28), "Upload queue", fill=NAVY, font=_font(14, True))
    d.text((ox + 24, oy + 50), "3 GNSS points pending", fill=MUTED, font=_font(11))
    d.rounded_rectangle([ox + 230, oy + 40, ox + cw - 24, oy + 68], radius=14, fill=NAVY)
    d.text((ox + 248, oy + 47), "Sync now", fill=WHITE, font=_font(11, True))

    d.text((ox + 16, oy + 118), "FIELD PACKETS", fill=MUTED, font=_font(10, True))
    packets = [
        ("Khutal", "48 parcels · due 18 Jun 2026", "In progress", 62, False),
        ("Khutal Bangla", "32 parcels · due 25 Jun 2026", "Assigned", 0, True),
    ]
    y = oy + 140
    for village, meta, status, pct, dl in packets:
        d.rounded_rectangle([ox + 12, y, ox + cw - 12, y + 95], radius=12, fill=WHITE, outline="#E2E8F0")
        d.text((ox + 24, y + 12), village, fill=NAVY, font=_font(13, True))
        d.text((ox + 24, y + 34), meta, fill=MUTED, font=_font(10))
        d.rounded_rectangle([ox + cw - 100, y + 12, ox + cw - 24, y + 32], radius=10, fill="#F1F5F9")
        d.text((ox + cw - 92, y + 15), status, fill=SLATE, font=_font(9))
        # progress
        d.rounded_rectangle([ox + 24, y + 55, ox + cw - 24, y + 62], radius=4, fill="#F1F5F9")
        if pct:
            d.rounded_rectangle([ox + 24, y + 55, ox + 24 + int((cw - 48) * pct / 100), y + 62], radius=4, fill=NAVY)
        if dl:
            d.text((ox + 24, y + 72), "⬇ Download for offline", fill="#0369A1", font=_font(11))
        y += 110

    path = OUT / "ui_field_sync.png"
    img.save(path, "PNG")
    print(f"wrote {path}")


def ui_map():
    img, d, ox, oy = phone_frame()
    cw = 360
    oy = label_banner(d, ox, oy, cw, "Map · Surveyor paths", "Proposed vs Actual · direction arrows · timestamps")
    # fake map area
    d.rectangle([ox, oy, ox + cw, oy + 520], fill="#DCFCE7")
    # parcels
    for box in [(60, 120, 160, 220), (150, 180, 280, 300), (80, 280, 200, 400)]:
        d.polygon([(ox + box[0], oy + box[1] - oy), (ox + box[2], oy + box[1] - oy),
                   (ox + box[2], oy + box[3] - oy), (ox + box[0], oy + box[3] - oy)],
                  outline="#334155", fill="#BBF7D0")
    # re-draw properly with absolute
    d.rectangle([ox, oy, ox + cw, oy + 520], fill="#ECFDF5")
    parcels = [
        [(70, 100), (180, 90), (200, 210), (60, 220)],
        [(190, 140), (310, 160), (300, 280), (170, 260)],
        [(80, 250), (200, 270), (190, 400), (50, 380)],
    ]
    for poly in parcels:
        pts = [(ox + p[0], oy + p[1]) for p in poly]
        d.polygon(pts, outline="#1E293B", fill="#A7F3D0")

    # proposed (blue dashed approximation as segments)
    prop = [(90, 130), (140, 170), (190, 220), (160, 300), (120, 360)]
    for a, b in zip(prop, prop[1:]):
        d.line([ox + a[0], oy + a[1], ox + b[0], oy + b[1]], fill="#2563EB", width=3)
    # actual with detour
    act = [(90, 130), (140, 170), (220, 190), (250, 230), (230, 270), (160, 300), (120, 360)]
    for a, b in zip(act, act[1:]):
        d.line([ox + a[0], oy + a[1], ox + b[0], oy + b[1]], fill="#EA580C", width=3)

    # arrows + timestamps
    d.polygon([(ox + 145, oy + 165), (ox + 155, oy + 180), (ox + 135, oy + 178)], fill="#2563EB")
    d.text((ox + 160, oy + 155), "09:14 Proposed", fill="#1E40AF", font=_font(9))
    d.polygon([(ox + 248, oy + 225), (ox + 258, oy + 240), (ox + 238, oy + 238)], fill="#EA580C")
    d.text((ox + 200, oy + 245), "09:28 Actual (tea stall)", fill="#9A3412", font=_font(9))

    # legend
    d.rounded_rectangle([ox + 12, oy + 450, ox + cw - 12, oy + 505], radius=10, fill=WHITE)
    d.line([ox + 28, oy + 470, ox + 70, oy + 470], fill="#2563EB", width=3)
    d.text((ox + 80, oy + 462), "Proposed path", fill=NAVY, font=_font(11))
    d.line([ox + 28, oy + 492, ox + 70, oy + 492], fill="#EA580C", width=3)
    d.text((ox + 80, oy + 484), "Actual path + direction", fill=NAVY, font=_font(11))

    path = OUT / "ui_map_paths.png"
    img.save(path, "PNG")
    print(f"wrote {path}")


def ui_rover_settings():
    img, d, ox, oy = phone_frame()
    cw = 360
    oy = label_banner(d, ox, oy, cw, "Rover Settings", "DGPS / GNSS device configuration")
    d.rounded_rectangle([ox + 12, oy + 12, ox + cw - 12, oy + 55], radius=10, fill="#ECFDF5", outline="#A7F3D0")
    d.text((ox + 24, oy + 20), "Device set · Demo", fill=NAVY, font=_font(12, True))
    d.text((ox + 24, oy + 38), "Configure rover, base & corrections", fill=MUTED, font=_font(10))

    sections = [
        ("ROVER", [("Model", "Trimble R12"), ("Serial", "R12-88421"), ("Bluetooth name", "TRMBLE_R12_88421")]),
        ("BASE STATION", [("Model", "Trimble NetR9"), ("Mount point", "TN-GNSS-RTK"), ("IP", "192.168.1.50")]),
        ("NTRIP / CORRECTIONS", [("Caster URL", "ntrip.tn.gov.in:2101"), ("Username", "tn_field_1042"), ("Antenna ht", "1.85 m")]),
    ]
    y = oy + 70
    for title, rows in sections:
        d.text((ox + 16, y), title, fill=MUTED, font=_font(10, True))
        y += 18
        for lab, val in rows:
            d.rounded_rectangle([ox + 12, y, ox + cw - 12, y + 42], radius=10, fill=WHITE, outline="#F1F5F9")
            d.text((ox + 24, y + 8), lab, fill=MUTED, font=_font(10))
            d.text((ox + 24, y + 22), val, fill=NAVY, font=_font(12, True))
            y += 48
        y += 8

    path = OUT / "ui_rover_settings.png"
    img.save(path, "PNG")
    print(f"wrote {path}")


def ui_app_settings():
    img, d, ox, oy = phone_frame()
    cw = 360
    oy = label_banner(d, ox, oy, cw, "App Settings", "NILAM mobile preferences")
    d.rounded_rectangle([ox + 12, oy + 12, ox + cw - 12, oy + 55], radius=10, fill="#FFFBEB", outline="#FDE68A")
    d.text((ox + 24, oy + 20), "Update Database Configuration", fill=NAVY, font=_font(12, True))
    d.text((ox + 24, oy + 38), "API endpoint, token & environment", fill=MUTED, font=_font(10))

    fields = [
        ("Database API URL", "https://api.nilam.tn.gov.in/v2/field"),
        ("Bearer token", "••••••••••••••••"),
        ("API key", "••••••••"),
        ("Environment", "Production"),
        ("Sync interval", "Every 15 min"),
    ]
    y = oy + 75
    for lab, val in fields:
        d.rounded_rectangle([ox + 12, y, ox + cw - 12, y + 48], radius=10, fill=WHITE, outline="#F1F5F9")
        d.text((ox + 24, y + 8), lab, fill=MUTED, font=_font(10))
        d.text((ox + 24, y + 26), val, fill=NAVY, font=_font(11, True))
        y += 54

    d.rounded_rectangle([ox + 12, y, ox + 170, y + 40], radius=10, fill=NAVY)
    d.text((ox + 70, y + 12), "Save", fill=WHITE, font=_font(12, True))
    d.rounded_rectangle([ox + 185, y, ox + cw - 12, y + 40], radius=10, fill=WHITE, outline="#CBD5E1")
    d.text((ox + 210, y + 12), "Test Connection", fill=NAVY, font=_font(11, True))

    d.text((ox + 16, y + 60), "NILAM Mobile v2.4.1 · Build 2026.07.08", fill=MUTED, font=_font(10))

    path = OUT / "ui_app_settings.png"
    img.save(path, "PNG")
    print(f"wrote {path}")


def ui_emergency():
    img, d, ox, oy = phone_frame()
    cw = 360
    oy = label_banner(d, ox, oy, cw, "Emergency", "Software-managed district alert (typical)")
    d.rectangle([ox, oy, ox + cw, oy + 280], fill="#FEE2E2")
    d.text((ox + 24, oy + 40), "⚠ Field Emergency", fill="#991B1B", font=_font(18, True))
    d.text((ox + 24, oy + 75), "Slide to alert stations", fill="#7F1D1D", font=_font(12))
    d.text((ox + 24, oy + 110), "Mail · Phone · Call cascade", fill=MUTED, font=_font(11))
    # slider
    d.rounded_rectangle([ox + 24, oy + 160, ox + cw - 24, oy + 210], radius=24, fill="#FECACA")
    d.ellipse([ox + 30, oy + 165, ox + 75, oy + 205], fill="#DC2626")
    d.text((ox + 95, oy + 175), "Slide to activate →", fill="#991B1B", font=_font(12, True))

    d.rounded_rectangle([ox + 12, oy + 300, ox + cw - 12, oy + 400], radius=12, fill="#FFF7ED", outline="#FDBA74")
    d.text((ox + 24, oy + 315), "Hardware role (optional)", fill=NAVY, font=_font(12, True))
    d.text((ox + 24, oy + 340), "Emergency is primarily App → Backend.", fill=SLATE, font=_font(11))
    d.text((ox + 24, oy + 360), "Device MAY offer panic button or GPS", fill=SLATE, font=_font(11))
    d.text((ox + 24, oy + 378), "ping assist — not required for V1.", fill=SLATE, font=_font(11))

    path = OUT / "ui_emergency.png"
    img.save(path, "PNG")
    print(f"wrote {path}")


def ui_home_dpr():
    img, d, ox, oy = phone_frame()
    cw = 360
    oy = label_banner(d, ox, oy, cw, "Home · DPR", "Daily progress · points collected")
    d.text((ox + 16, oy + 16), "K. Murugesan · TN-SRV-1042", fill=NAVY, font=_font(13, True))
    d.text((ox + 16, oy + 36), "Khutal · Thanjavur (illustrative)", fill=MUTED, font=_font(11))
    d.text((ox + 16, oy + 70), "June 2026 — Points chart", fill=NAVY, font=_font(12, True))
    # mini bars
    for i, hgt in enumerate([18, 32, 24, 40, 28, 36, 22, 45, 30, 38, 20, 42]):
        x = ox + 30 + i * 26
        d.rectangle([x, oy + 220 - hgt, x + 16, oy + 220], fill="#10B981" if i % 3 else "#FDA4AF")
        d.text((x + 2, oy + 225), str(i + 1), fill=MUTED, font=_font(8))
    d.text((ox + 16, oy + 260), "DPR detail / parcel points are software UI.", fill=MUTED, font=_font(11))
    d.text((ox + 16, oy + 280), "Hardware supplies GNSS points powering DPR counts.", fill=MUTED, font=_font(11))

    path = OUT / "ui_home_dpr.png"
    img.save(path, "PNG")
    print(f"wrote {path}")


if __name__ == "__main__":
    draw_architecture()
    draw_swimlane()
    draw_capture_sequence()
    draw_sync_sequence()
    draw_path_sequence()
    draw_config_sequence()
    ui_capture()
    ui_sync()
    ui_map()
    ui_rover_settings()
    ui_app_settings()
    ui_emergency()
    ui_home_dpr()
    print("All assets generated in", OUT)
