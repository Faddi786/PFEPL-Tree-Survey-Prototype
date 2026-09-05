#!/usr/bin/env python3
"""
NILAM Field Hardware Device — Technical Requirements Specification (DOCX)
JP Morgan / consulting formal style. V1.0 draft for OEM vendor response.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn, nsmap
from docx.shared import Cm, Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "spec-assets"
OUT_PRIMARY = ROOT / "NILAM_Hardware_Device_Technical_Specification.docx"
OUT_DESKTOP = Path(r"C:\Users\Fahad\Desktop\NILAM_Hardware_Device_Technical_Specification.docx")

NAVY = RGBColor(0x0B, 0x25, 0x45)
GOLD = RGBColor(0xC4, 0xA3, 0x5A)
MUTED = RGBColor(0x47, 0x55, 0x69)
BLACK = RGBColor(0x1A, 0x1A, 0x1A)


def set_cell_shading(cell, hex_color: str):
    tc = cell._tePr if hasattr(cell, "_tePr") else cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def shade_header_row(row, hex_color="0B2545"):
    for cell in row.cells:
        set_cell_shading(cell, hex_color)
        for p in cell.paragraphs:
            for run in p.runs:
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                run.font.bold = True
                run.font.size = Pt(9)
                run.font.name = "Calibri"


def set_narrow_margins(section):
    section.top_margin = Cm(1.8)
    section.bottom_margin = Cm(1.8)
    section.left_margin = Cm(2.0)
    section.right_margin = Cm(2.0)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fldChar1 = OxmlElement("w:fldChar")
    fldChar1.set(qn("w:fldCharType"), "begin")
    instrText = OxmlElement("w:instrText")
    instrText.set(qn("xml:space"), "preserve")
    instrText.text = " PAGE "
    fldChar2 = OxmlElement("w:fldChar")
    fldChar2.set(qn("w:fldCharType"), "end")
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)


def setup_header_footer(doc: Document):
    section = doc.sections[0]
    set_narrow_margins(section)
    header = section.header
    header.is_linked_to_previous = False
    hp = header.paragraphs[0]
    hp.text = ""
    r = hp.add_run("NILAM Field Hardware Device — Technical Requirements Specification  |  V1.0  |  CONFIDENTIAL — Vendor Restricted")
    r.font.size = Pt(8)
    r.font.color.rgb = MUTED
    r.font.name = "Calibri"

    footer = section.footer
    footer.is_linked_to_previous = False
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = fp.add_run("© 2026 Software / Platform Team (DoSLR / NILAM context) · Draft for OEM response · Page ")
    r1.font.size = Pt(8)
    r1.font.color.rgb = MUTED
    add_page_number(fp)
    r2 = fp.add_run("")
    r2.font.size = Pt(8)


def style_doc(doc: Document):
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = BLACK
    pf = normal.paragraph_format
    pf.space_after = Pt(6)
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE

    for level, size in [(1, 16), (2, 13), (3, 11)]:
        h = styles[f"Heading {level}"]
        h.font.name = "Calibri"
        h.font.bold = True
        h.font.color.rgb = NAVY
        h.font.size = Pt(size)
        h.paragraph_format.space_before = Pt(14 if level == 1 else 10)
        h.paragraph_format.space_after = Pt(6)


def p(doc, text, *, bold=False, italic=False, size=10.5, color=None, align=None, space_after=6):
    para = doc.add_paragraph()
    if align is not None:
        para.alignment = align
    para.paragraph_format.space_after = Pt(space_after)
    run = para.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color
    return para


def bullets(doc, items, level=0):
    for item in items:
        para = doc.add_paragraph(item, style="List Bullet")
        para.paragraph_format.left_indent = Cm(0.5 + level * 0.4)
        for run in para.runs:
            run.font.name = "Calibri"
            run.font.size = Pt(10.5)


def numbered(doc, items):
    for item in items:
        para = doc.add_paragraph(item, style="List Number")
        for run in para.runs:
            run.font.name = "Calibri"
            run.font.size = Pt(10.5)


def mono(doc, text):
    para = doc.add_paragraph()
    para.paragraph_format.space_before = Pt(4)
    para.paragraph_format.space_after = Pt(8)
    para.paragraph_format.left_indent = Cm(0.3)
    run = para.add_run(text)
    run.font.name = "Consolas"
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    # light bg via shading on paragraph is complex; keep monospace clean
    return para


def add_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0]
    for i, h in enumerate(headers):
        hdr.cells[i].text = h
    shade_header_row(hdr)
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            cell = table.rows[ri + 1].cells[ci]
            cell.text = str(val)
            for para in cell.paragraphs:
                for run in para.runs:
                    run.font.name = "Calibri"
                    run.font.size = Pt(9)
            if ri % 2 == 1:
                set_cell_shading(cell, "F1F5F9")
    if col_widths:
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = w
    doc.add_paragraph()
    return table


def add_figure(doc, filename: str, caption: str, width_in=5.8):
    path = ASSETS / filename
    if not path.exists():
        p(doc, f"[Missing figure: {filename}]", italic=True, color=MUTED)
        return
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = para.add_run()
    run.add_picture(str(path), width=Inches(width_in))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(12)
    r = cap.add_run(caption)
    r.italic = True
    r.font.size = Pt(9)
    r.font.color.rgb = MUTED
    r.font.name = "Calibri"


def shall_block(doc, title: str, shall: list[str], should: list[str] | None = None, may: list[str] | None = None,
                pre: str = "", post: str = "", fail: str = "", ac: list[str] | None = None):
    doc.add_heading(title, level=3)
    if pre:
        p(doc, f"Preconditions: {pre}")
    for s in shall:
        bullets(doc, [f"Hardware SHALL {s}"])
    if should:
        for s in should:
            bullets(doc, [f"Hardware SHOULD {s}"])
    if may:
        for s in may:
            bullets(doc, [f"Hardware MAY {s}"])
    if post:
        p(doc, f"Postconditions: {post}")
    if fail:
        p(doc, f"Failure modes: {fail}")
    if ac:
        p(doc, "Acceptance criteria:", bold=True, space_after=2)
        bullets(doc, ac)


def cover_page(doc: Document):
    for _ in range(2):
        p(doc, "", space_after=0)
    p(doc, "CONFIDENTIAL — VENDOR RESTRICTED", bold=True, size=11, color=GOLD,
      align=WD_ALIGN_PARAGRAPH.CENTER, space_after=18)
    p(doc, "NILAM Field Hardware Device", bold=True, size=26, color=NAVY,
      align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    p(doc, "Technical Requirements Specification", bold=True, size=18, color=NAVY,
      align=WD_ALIGN_PARAGRAPH.CENTER, space_after=14)
    p(doc, "Hardware Interface & Responsibility Spec for OEM / Device Manufacturer",
      size=12, color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=28)
    p(doc, "Document Type: Requirements Specification (Draft)", align=WD_ALIGN_PARAGRAPH.CENTER)
    p(doc, "Version: 1.0", align=WD_ALIGN_PARAGRAPH.CENTER)
    p(doc, "Date: 2026-07-08", align=WD_ALIGN_PARAGRAPH.CENTER)
    p(doc, "Classification: Confidential — Vendor Restricted", align=WD_ALIGN_PARAGRAPH.CENTER, space_after=22)
    p(doc, "Prepared for: Hardware OEM / Device Manufacturer", align=WD_ALIGN_PARAGRAPH.CENTER)
    p(doc, "Prepared by: Software / Platform Team", align=WD_ALIGN_PARAGRAPH.CENTER)
    p(doc, "(DoSLR WebGIS / GeoNilam / NILAM mobile field context)", italic=True,
      color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=28)
    p(doc, "This document defines roles, interfaces, latency, offline behaviour, use cases, and acceptance criteria "
           "for a hardware mediation device between the NILAM mobile field application and DGPS rover instruments. "
           "It is a V1.0 draft for vendor technical response and does not constitute a binding procurement contract "
           "or legal warranty statement.",
      size=9, color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=18)

    p(doc, "Document Control", bold=True, size=12, color=NAVY, space_after=6)
    add_table(
        doc,
        ["Version", "Date", "Author", "Status", "Notes"],
        [
            ["0.9", "2026-07-01", "Platform Team", "Internal draft", "Screen inventory from mobile prototype"],
            ["1.0", "2026-07-08", "Platform Team", "Vendor draft", "Full TRS for OEM response"],
        ],
    )
    doc.add_page_break()


def toc_placeholder(doc):
    doc.add_heading("Table of Contents", level=1)
    p(doc, "Sections are numbered 1–14 with Appendices A–B. Figures and tables are referenced inline. "
          "Update automated TOC fields in Microsoft Word if desired (References → Table of Contents).",
      italic=True, color=MUTED)
    sections = [
        "1. Executive Summary",
        "2. Scope & Non-Goals",
        "3. System Architecture",
        "4. Roles & Responsibilities (RACI)",
        "5. Functional Requirements",
        "6. Non-Functional Requirements",
        "7. Interfaces & Protocols",
        "8. Data Model",
        "9. Use Cases & Scenarios",
        "10. Workflow Charts",
        "11. Acceptance Test Plan",
        "12. Deliverables from Hardware Vendor",
        "13. Open Questions / Assumptions",
        "14. Glossary",
        "Appendix A — Mapping to NILAM Mobile Screens",
        "Appendix B — Attribute Dictionary",
    ]
    for s in sections:
        p(doc, s, space_after=2)
    doc.add_page_break()


def section_1(doc):
    doc.add_heading("1. Executive Summary", level=1)
    p(doc,
      "NILAM field operations require centimetre-to-decimetre accurate cadastral control-point collection using "
      "Differential GPS (DGPS) / Real-Time Kinematic (RTK) instruments, resilient offline survey packets, and "
      "transparent compliance evidence that a surveyor followed (or justifiably diverged from) a proposed field path. "
      "The NILAM mobile application — presently demonstrated as a web PhoneFrame prototype within the DoSLR WebGIS "
      "platform — owns surveyor UX, packet lifecycle, DPR reporting, emergency alerting, and backend synchronisation.")
    p(doc,
      "The hardware mediation device specified herein sits between the mobile application and the DGPS rover (and, "
      "where applicable, base / NTRIP correction sources). Software configures the rover through the phone; the device "
      "executes transport, protocol adaptation, durable offline storage of GNSS epochs and track samples, and "
      "deterministic acknowledgement of capture and sync operations.")
    p(doc, "Business outcomes enabled by compliant hardware:", bold=True, space_after=2)
    bullets(doc, [
        "Reliable live telemetry for the six on-screen GNSS boxes: Latitude, Longitude, Accuracy (m), Satellite Count, HDOP, VDOP.",
        "Editable Point ID (illustrative pattern GCP-KHT-##) stamped into each captured control point before commit.",
        "Offline durability for village packets such as pkt-khutal-042 (Khutal) and pkt-khutal-011 (Khutal Bangla).",
        "Actual path logging with direction and timestamp to support Proposed (blue dashed) vs Actual (orange) map storytelling.",
        "Pass-through of Rover Settings and guarded App Settings (API URL, bearer token) without exposing instrument vendor lock-in to the app layer.",
    ])
    p(doc,
      "Illustrative demo values used throughout (labelled demo / illustrative where relevant): surveyor K. Murugesan "
      "(TN-SRV-1042); rover Trimble R12 · Bluetooth name TRMBLE_R12_88421; live Lat 19.29352 / Lng 73.52641 / Accuracy "
      "0.09 m / 14 satellites / HDOP 0.8 / VDOP 1.2; API base https://api.nilam.tn.gov.in/v2/field; NILAM Mobile v2.4.1.")


def section_2(doc):
    doc.add_heading("2. Scope & Non-Goals", level=1)
    doc.add_heading("2.1 In Scope (Hardware Vendor)", level=2)
    bullets(doc, [
        "Physical device design suitable for Tamil Nadu / Puducherry / Karaikal field conditions.",
        "Wireless and/or wired bridging: BLE 5.x (preferred), USB-C serial, optional Wi-Fi AP / client.",
        "Protocol adapters for NMEA 0183, RTCM 3.x, and extensible proprietary receiver SDKs.",
        "Local encrypted-at-rest storage for points, path samples, configs, and sync queues.",
        "Telemetry streaming, capture ACK, offline queue, sync resume, path ingest/logging, diagnostics, OTA firmware.",
        "Interface Control Document (ICD), sample SDK, test harness logs, and acceptance evidence.",
    ])
    doc.add_heading("2.2 Out of Scope", level=2)
    bullets(doc, [
        "Mobile UI/UX design and DPR screens — owned by Software (Home DPR charts, parcel overlays, island notifications).",
        "DGPS instrument firmware and NTRIP caster operations — owned by instrument OEM / network operator unless explicitly subcontracted.",
        "Backend WebGIS business rules, conflict resolution policy finals, and cadastral legal sealing.",
        "Emergency district alert cascade (mail / phone / call) — primarily Software/Backend; hardware panic button is optional (MAY).",
        "Surveyor training content and administrative HR workflows.",
    ])
    doc.add_heading("2.3 Related Software Surfaces (Context Only)", level=2)
    p(doc, "Mobile tabs and overlays observed in the prototype: Home, Map, Emergency, Capture (DGPS / GNSS), Sync; "
          "overlays Profile, Settings, App Settings, Rover Settings, DPR date/parcel. Hardware must honour API contracts "
          "that back Connect, Capture control point, Sync now, Download for offline, and Rover Settings apply.")


def section_3(doc):
    doc.add_heading("3. System Architecture", level=1)
    p(doc, "The field stack comprises three layers with clear ownership boundaries.")
    numbered(doc, [
        "NILAM Mobile App (Android/iOS targets; current demonstration is a web PhoneFrame prototype) — UI, permissions, API auth UX, map rendering, DPR, emergency UI.",
        "Hardware mediation device (THIS VENDOR) — BLE/USB/Wi-Fi bridge, local store, optional GNSS link stack, telemetry and path logging engine.",
        "DGPS Rover / Base / NTRIP / RTK instruments — produce fixes and corrections (e.g., illustrative Trimble R12, Trimble NetR9, caster ntrip.tn.gov.in:2101, mount point TN-GNSS-RTK).",
    ])
    p(doc, "Data planes:", bold=True, space_after=2)
    bullets(doc, [
        "App ↔ Hardware Device: control and telemetry (JSON over BLE GATT notifications / indications or WebSocket-serial).",
        "Hardware Device ↔ Rover: Bluetooth SPP/GATT or USB serial; NMEA/RTCM or vendor SDK.",
        "App ↔ Backend API: HTTPS sync of packets and proposed paths; Device MAY assist uplink when phone tethering is weak but Software remains policy owner.",
    ])
    add_figure(doc, "fig01_architecture.png",
               "Figure 1. Three-layer NILAM field architecture (App · Hardware Device · Rover / NTRIP).")
    p(doc, "Reference sequence for a captured point: Surveyor taps Connect → Device pairs and streams telemetry.live → "
          "six UI boxes populate → Surveyor edits Point ID → Capture control point → Device freezes epoch, persists, "
          "returns ACK → point appears Pending until Sync now → Backend marks Synced.")


def section_4(doc):
    doc.add_heading("4. Roles & Responsibilities (RACI-style)", level=1)
    p(doc, "R = Responsible, A = Accountable, C = Consulted, I = Informed. Primary owner is bolded in notes.")
    add_table(
        doc,
        ["Activity", "Hardware", "Software (App)", "Surveyor", "Backend"],
        [
            ["Device pairing / discovery", "R/A", "C", "C", "I"],
            ["Rover RF/serial connect", "R/A", "C (Connect UX)", "C", "I"],
            ["Live telemetry framing", "R/A", "R (render)", "I", "I"],
            ["Point ID propose / edit", "C (accept rename)", "R/A (UX)", "R (edit)", "I"],
            ["Point capture stamp", "R/A (store)", "R (request)", "R (trigger)", "I"],
            ["Offline queue durability", "R/A", "C", "I", "I"],
            ["Sync upload transport", "R (if device uplink) / C", "R/A", "R (Sync now)", "R (ingest)"],
            ["Conflict policy", "C", "C", "I", "R/A"],
            ["Rover config apply", "R (apply)", "R/A (settings UI)", "C", "I"],
            ["API token storage UI unlock", "C (secure element optional)", "R/A", "C (admin)", "C"],
            ["Proposed path ingest", "R (store/track)", "R (download UI)", "I", "R/A (author)"],
            ["Actual path logging", "R/A", "R (map display)", "C", "C"],
            ["Clock discipline", "R/A", "C", "I", "C (NTP ref)"],
            ["Emergency alert cascade", "MAY button", "R/A", "R", "R"],
            ["DPR aggregation UI", "I (feeds points)", "R/A", "I", "C"],
            ["Instrument firmware", "C", "I", "I", "I (instrument OEM A)"],
        ],
    )
    p(doc, "Boundary summary: Hardware owns truthful sensor time-series and durable offline artefacts; Software owns "
          "human workflow and presentation; Backend owns cadastral system of record; Surveyor owns field decisions; "
          "Instrument OEM owns receiver internals.")


def section_5(doc):
    doc.add_heading("5. Functional Requirements", level=1)
    p(doc, "Requirements use RFC 2119 language: SHALL (mandatory), SHOULD (strongly recommended), MAY (optional). "
          "Demo names (GCP-KHT-06, Khutal, Trimble R12) are illustrative.")

    shall_block(
        doc, "5.1 Device Discovery & Pairing",
        shall=[
            "advertise a stable BLE name and service UUID documented in the ICD.",
            "support first-time pairing with PIN or numeric comparison within 30 seconds under nominal RF conditions.",
            "persist bonding keys so Auto-reconnect rover (App toggle) can restore the session on launch.",
            "reject unpaired hosts from reading stored credentials or offline points.",
        ],
        should=["support USB-C fallback discovery when BLE is congested."],
        may=["expose a Wi-Fi SoftAP mode for lab diagnostics."],
        pre="Device powered; surveyor within ~10 m; phone Bluetooth enabled.",
        post="Paired bond stored; App can request Connect.",
        fail="Bonding timeout; spoofed advertisement (see Scenario 16); insufficient battery.",
        ac=["Pairing success rate ≥ 95% in open field RF tests; unpaired device cannot dump points via GATT without auth."],
    )

    shall_block(
        doc, "5.2 Session / Connect to Rover (Connect Button Equivalent)",
        shall=[
            "on App connectGnss / Connect, attempt rover link using configured Bluetooth name (e.g., TRMBLE_R12_88421).",
            "establish a usable session within ≤ 15 seconds typical; hard timeout ≤ 30 seconds with typed error.",
            "publish connection state events matching App island notifications: Searching for rover… → Trimble R12 connected / failure.",
            "honour Disconnect by cleanly closing rover and NTRIP sockets and stopping telemetry.live.",
        ],
        should=["auto-start NTRIP when Auto NTRIP on connect is enabled in Rover Settings."],
        pre="Pairing complete; Rover Settings populated; rover powered.",
        post="gnssConnected equivalent true; telemetry flowing or explicit degraded state.",
        fail="Rover out of range; wrong Bluetooth name; RTK corrections unavailable (still MAY stream autonomous fix with quality flags).",
        ac=["Connect → live telemetry within 15 s median; timeout emits error code ROVER_CONNECT_TIMEOUT."],
    )

    shall_block(
        doc, "5.3 Live Telemetry Stream (Six Attributes Minimum)",
        shall=[
            "stream Latitude, Longitude, Accuracy (horizontal, metres), Satellite Count, HDOP, and VDOP at ≥ 1 Hz when a fix is available.",
            "deliver end-to-end App UI update within 200–500 ms after a fix becomes available on the device bus.",
            "mark fields null/unknown when disconnected so the App can hide metric boxes (matching prototype behaviour).",
            "include a monotonic sequence number and device UTC timestamp on each telemetry.live message.",
        ],
        should=[
            "also stream optional fixType (NONE/GPS/DGPS/FLOAT/FIX/RTK), PDOP, mean SNR, rover battery %, GPS week/TOW.",
            "apply antenna height from config when reporting ground-referenced height if/when vertical displayed.",
        ],
        pre="Rover connected; corrections optional.",
        post="App boxes show values such as Lat 19.29352, Lng 73.52641, Accuracy 0.09 m, Satellites 14, HDOP 0.8, VDOP 1.2 (illustrative).",
        fail="Bus congestion; malformed NMEA — Device SHALL drop bad sentences and raise DIAG_PARSE_ERROR counters.",
        ac=["All six fields update continuously while connected; latency SLA met under lab load test."],
    )

    shall_block(
        doc, "5.4 Point ID / Name Generation & Edit Before Capture",
        shall=[
            "accept an App-proposed Point ID (e.g., GCP-KHT-06) via point.capture.request and use that label at stamp time.",
            "accept a rename (point.update / pre-capture setNextPointId) issued before commit; last App value wins.",
            "support Auto-increment sequences consistent with App pattern GCP-KHT-## when App delegates generation.",
        ],
        should=["validate uniqueness within the active packet on-device and warn on duplicates."],
        may=["propose a provisional ID if App sends empty string."],
        pre="Connected session; active field packet downloaded.",
        post="Captured record.label equals edited Point ID.",
        fail="Empty ID after trim — Device SHALL reject with POINT_ID_REQUIRED unless App confirms auto-name.",
        ac=["Edit GCP-KHT-06 then capture → stored label is GCP-KHT-06."],
    )

    shall_block(
        doc, "5.5 Point Capture / Collect",
        shall=[
            "on Capture control point, freeze one epoch containing all six core attributes plus quality flags.",
            "return point.capture.response ACK within ≤ 1 second under normal flash write conditions.",
            "persist source channel (bluetooth | ntrip | file) analogous to CapturedGnssPoint.source.",
            "default reject or warn when quality below Min accuracy threshold (±0.15 m · RTK Fixed required) if Rover Settings enforce it — final UX gate may be App-owned but Device MUST supply quality.",
        ],
        should=["store optional raw NMEA/RTCM sentence dump or RINEX observation handle when Store raw observations is on."],
        pre="gnssConnected; Point ID set; surveyor triggers capture.",
        post="Point listed with synced=false (Pending); durable on power-cycle.",
        fail="Flash full; mid-write power loss (see 5.7); float fix when fixed required.",
        ac=["Power-cycle after capture retains point; ACK ≤ 1 s p95."],
    )

    shall_block(
        doc, "5.6 Edit / Delete / Re-measure Points Offline",
        shall=[
            "allow App to update label/metadata of Pending points offline via point.update.",
            "allow delete of Pending points with tombstone until sync.",
            "allow re-measure: new epoch supersedes prior geometry while retaining audit trail of prior measurement.",
        ],
        should=["forbid silent mutation of already Synced points without backend-coordinated revision token."],
        pre="Points exist in local store.",
        post="Queue reflects edits; sync carries net intent.",
        fail="Edit during active sync chunk — Device SHALL serialize with transaction lock.",
        ac=["Offline delete of Pending point removes it from subsequent sync.upload."],
    )

    shall_block(
        doc, "5.7 Offline Storage Persistence",
        shall=[
            "survive unexpected power loss without corrupting the points database (dual-buffer / transactional write).",
            "retain data for ≥ 14 days without wipe under ambient storage temperatures in scope.",
            "encrypt at rest preferred (AES-128+); if deferred, document residual risk — encryption SHOULD be default for OEM bid.",
            "report storage used / free via diagnostics so App can warn before Storage full scenario.",
        ],
        may=["offer secure element for tokens."],
        pre="N/A continuous.",
        post="No torn writes after crash-recovery boot.",
        fail="Filesystem journal replay failure → enter safe mode, refuse capture, emit STORAGE_CORRUPT.",
        ac=["Pull battery mid-write 50×; ≤ 1 point lost; never silent corruption."],
    )

    shall_block(
        doc, "5.8 Sync / Connect to Software & Backend",
        shall=[
            "serve sync.upload for pending GNSS points and path batches for the active packet (e.g., pkt-khutal-042).",
            "support resume from byte/record offset after partial failure.",
            "emit progress events suitable for the Sync UI progress bar (prototype animates ~62% → 100% in steps).",
            "cooperate with App notifications: Looking for internet… → Connected → Uploading field data… → Sync complete.",
        ],
        should=["compress payloads when Compress uploads is enabled in App Settings."],
        pre="Connectivity available; bearer token valid if Device participates in HTTPS; Pending > 0.",
        post="Points marked Synced; packet status synced when complete.",
        fail="Wrong token (Scenario 7); mid-upload disconnect — resume without duplicate commits (idempotent point IDs).",
        ac=["Kill network at 40%; resume completes without duplicates; progress events ≥ 2 Hz during transfer."],
    )

    shall_block(
        doc, "5.9 Rover Configuration from App Settings / Rover Settings",
        shall=[
            "accept config.rover.apply including: rover model/serial/Bluetooth name; base model/serial/IP; mount point; caster URL; NTRIP username/password (secure); antenna height (m); receiver type; min accuracy; store-raw flag; Auto-reconnect; Bluetooth priority.",
            "apply configs to the link layer and return typed ACK/NACK.",
            "not require the App to embed vendor SDKs beyond the ICD.",
        ],
        should=["validate caster reachability when Test path is requested; separate from App Test Connection (API)."],
        pre="Paired; admin/surveyor edited Rover Settings (Trimble R12, antenna 1.85 m, caster ntrip.tn.gov.in:2101, mount TN-GNSS-RTK, user tn_field_1042 — illustrative).",
        post="Subsequent Connect uses new settings.",
        fail="Invalid mount point; auth fail at caster → NTRIP_AUTH_FAILED.",
        ac=["Change antenna height 1.85→2.00 → ACK; next capture metadata reflects 2.00."],
    )
    p(doc, "Note: App Settings Database Configuration (API URL, Bearer token, API key, Environment Production/Staging/Development, "
          "Test Connection) is primarily Software↔Backend. Hardware MAY cache link status or hold tokens in secure storage "
          "only when product architecture selects device-mediated sync; otherwise Device SHALL treat tokens as optional.")

    shall_block(
        doc, "5.10 Proposed Path Ingest & Actual Path Logging",
        shall=[
            "accept path.proposed.set polylines/waypoints from App/server for the active packet.",
            "continuously log actual track samples with WGS84 position, heading/direction, and timestamp.",
            "default sample at 1 Hz, configurable 0.2–5 Hz.",
            "retain mid-route excursions (e.g., tea-stall detour story in demo routes) without snapping away legitimate deviations.",
            "batch upload via path.actual.batch compatible with Map legend: Proposed (blue dashed) vs Actual (orange) with direction arrows and waypoint timestamps.",
        ],
        should=["tag samples with packetId and surveyorId (e.g., surveyor.tn.1042)."],
        pre="Proposed path downloaded with offline packet.",
        post="Map can render compliance narrative: start on path, excursion, return.",
        fail="GPS outage — continue logging with gap flags rather than inventing geometry.",
        ac=["Detour retained; timestamps monotonic; arrows reflect headingRad semantics."],
    )

    shall_block(
        doc, "5.11 Time Sync / Clock Discipline",
        shall=[
            "synchronise device clock to GNSS time when fix available; fallback to phone NTP via App time sync message.",
            "stamp captures with UTC; document local offset handling.",
            "detect drift > 2 s versus GNSS and self-correct, emitting CLOCK_CORRECTED events.",
        ],
        pre="Power on.",
        post="Capture timestamps comparable to App displayed capturedAt (e.g., 2026-06-10 09:14).",
        fail="No GNSS and no phone time — refuse capture or mark TIME_UNTRUSTED.",
        ac=["After 24 h offline, drift residual < 500 ms once GNSS returns."],
    )

    shall_block(
        doc, "5.12 Firmware Update Capability",
        shall=[
            "support signed OTA packages delivered via App or USB.",
            "A/B or fail-safe rollback if boot fails.",
            "report firmware version string to App About/diagnostics.",
        ],
        should=["allow staged updates without wiping offline points."],
        ac=["Interrupted OTA recovers to last known good."],
    )

    shall_block(
        doc, "5.13 Diagnostics & Health",
        shall=[
            "expose DeviceHealth: battery, storage, temperature, BLE RSSI, rover link state, NTRIP state, error counters.",
            "retain a ring-buffer diagnostic log exportable for vendor support.",
        ],
        may=["use status LEDs: power, pair, rover, error."],
        ac=["ICD health message maps to App debug overlay or support export."],
    )

    shall_block(
        doc, "5.14 Security / Credentials",
        shall=[
            "never emit NTRIP passwords or bearer tokens in plaintext logs.",
            "require pairing auth before sensitive GATT characteristics are readable.",
            "support remote/local wipe of credentials on command from authenticated App admin session.",
        ],
        should=["lock out after N failed pairing attempts (configurable) and require physical confirm."],
        may=["store API tokens only when device-mediated sync is selected."],
        fail="Spoofed BLE — see Scenario 16.",
        ac=["Static analysis / review of firmware shows secrets not in world-readable storage."],
    )


def section_6(doc):
    doc.add_heading("6. Non-Functional Requirements", level=1)

    doc.add_heading("6.1 Latency / Timing", level=2)
    add_table(
        doc,
        ["Metric", "Target", "Timeout / Bound", "Notes"],
        [
            ["Telemetry → App UI", "≤ 200–500 ms E2E after fix", "Watchdog 2 s stale", "Six-box refresh"],
            ["Point capture ACK", "≤ 1 s p95", "Hard fail 3 s", "Includes durable write"],
            ["Connect to rover", "≤ 10–15 s typical", "30 s timeout", "Includes NTRIP start if enabled"],
            ["Path sample interval", "1 Hz default", "Configurable 0.2–5 Hz", "Jitter < 20%"],
            ["Sync progress events", "≥ 2 Hz while transferring", "—", "Matches Sync now UX"],
            ["Offline sync throughput", "≥ 0.5 MB/s Wi-Fi; ≥ 50 KB/s cellular assist", "—", "Depends on phone uplink"],
            ["Config apply ACK", "≤ 5 s", "15 s", "Excludes long NTRIP auth"],
        ],
    )

    doc.add_heading("6.2 Reliability", level=2)
    add_table(
        doc,
        ["Metric", "Requirement"],
        [
            ["MTBF guidance", "≥ 5,000 field hours electronics; document test basis"],
            ["Offline durability", "≥ 14 days retention without wipe"],
            ["Write integrity", "Dual-buffer / transactional point commits"],
            ["Crash recovery", "Boot self-check ≤ 10 s; refuse capture if corrupt"],
            ["Queue durability", "No silent loss of Pending points on power cycle"],
        ],
    )

    doc.add_heading("6.3 Environmental", level=2)
    add_table(
        doc,
        ["Aspect", "Expectation"],
        [
            ["Ingress protection", "IP54 minimum; IP65 recommended for monsoon dust/rain"],
            ["Temperature", "Operating −5 °C to +55 °C (TN / coastal heat), storage −20 °C to +70 °C"],
            ["Humidity", "10–95% RH non-condensing; conformal coat preferred"],
            ["Vibration / drop", "Survive motorcycle pannier transport; 1.2 m drop to packed soil (sample units)"],
            ["Battery life", "≥ 10 hours active survey day with 1 Hz telemetry + path logging"],
            ["Charging", "USB-C; field chargeable midday"],
        ],
    )

    doc.add_heading("6.4 Capacity", level=2)
    add_table(
        doc,
        ["Artefact", "Minimum Capacity"],
        [
            ["Offline control points", "≥ 10,000 points"],
            ["Track samples", "≥ 2,000,000 samples (~23 days @ 1 Hz)"],
            ["Field packets concurrent", "≥ 20 packets metadata"],
            ["Diagnostic log", "≥ 64 MB ring"],
            ["Firmware slot", "≥ 2 images (A/B)"],
        ],
    )

    doc.add_heading("6.5 Interoperability", level=2)
    bullets(doc, [
        "BLE 5.x GATT with documented UUIDs; USB-C CDC-ACM or vendor serial; optional Wi-Fi.",
        "NMEA 0183 parser; RTCM 3.x pass-through / decode as needed; proprietary adapters behind a plugin interface.",
        "Illustrative instruments: Trimble R12/R10, Leica GS18, South Galaxy G7; bases Trimble NetR9, Leica GR30, Septentrio Mosaic, Custom CORS.",
    ])

    doc.add_heading("6.6 Security & Compliance", level=2)
    bullets(doc, [
        "TLS 1.2+ for any device-originated HTTPS to backend.",
        "Pairing PIN / numeric compare; optional wipe-after-N-failures policy.",
        "No weak hardcoded debug backdoors in production firmware.",
        "Align credential handling with App unlock Administration → Update Database Configuration (admin key gated).",
    ])

    doc.add_heading("6.7 Accessibility / UX Constraints Hardware Imposes", level=2)
    bullets(doc, [
        "Status LEDs SHOULD map to colour-blind-safe patterns (shape/blink, not colour alone).",
        "Optional hardware capture button MAY debounce ≥ 300 ms and mirror App Capture control point.",
        "Haptic feedback remains App-owned; Device SHOULD not inject duplicate confirms unless App requests.",
    ])


def section_7(doc):
    doc.add_heading("7. Interfaces & Protocols", level=1)
    p(doc, "Recommended transport: JSON messages over BLE GATT (notify/write) or length-prefixed WebSocket/serial for USB. "
          "All messages include schemaVersion, messageType, messageId, and tsUtc.")

    doc.add_heading("7.1 Message Catalogue", level=2)
    add_table(
        doc,
        ["messageType", "Direction", "Purpose"],
        [
            ["telemetry.live", "Device → App", "1 Hz+ fix stream"],
            ["point.capture.request", "App → Device", "Capture with Point ID"],
            ["point.capture.response", "Device → App", "ACK/NACK + record"],
            ["point.update", "App → Device", "Rename / delete / remeasure"],
            ["config.rover.apply", "App → Device", "Rover/base/NTRIP/antenna"],
            ["config.rover.ack", "Device → App", "Apply result"],
            ["path.proposed.set", "App → Device", "Ingest planned polyline"],
            ["path.actual.batch", "Device → App", "Track samples upload to App"],
            ["sync.upload", "App ↔ Device", "Chunked pending artefact upload"],
            ["device.health", "Device → App", "Diagnostics"],
            ["error", "Either", "Typed failure"],
        ],
    )

    doc.add_heading("7.2 Example Payloads", level=2)
    p(doc, "telemetry.live (illustrative):", bold=True, space_after=2)
    mono(doc, """{
  "schemaVersion": "1.0",
  "messageType": "telemetry.live",
  "messageId": "tel-88421-10042",
  "tsUtc": "2026-07-08T09:14:03.210Z",
  "seq": 10042,
  "lat": 19.29352,
  "lon": 73.52641,
  "accuracyM": 0.09,
  "satelliteCount": 14,
  "hdop": 0.8,
  "vdop": 1.2,
  "fixType": "RTK_FIXED",
  "roverId": "TRMBLE_R12_88421"
}""")

    p(doc, "point.capture.request / response:", bold=True, space_after=2)
    mono(doc, """{
  "messageType": "point.capture.request",
  "pointId": "GCP-KHT-06",
  "packetId": "pkt-khutal-042",
  "requireFixed": true,
  "maxAccuracyM": 0.15
}
— —
{
  "messageType": "point.capture.response",
  "status": "OK",
  "record": {
    "id": "gnss-006",
    "label": "GCP-KHT-06",
    "lat": 10.92580,
    "lng": 79.83690,
    "accuracyM": 0.08,
    "satelliteCount": 14,
    "hdop": 0.8,
    "vdop": 1.2,
    "source": "bluetooth",
    "capturedAt": "2026-06-10 09:14",
    "synced": false
  }
}""")

    p(doc, "config.rover.apply (subset):", bold=True, space_after=2)
    mono(doc, """{
  "messageType": "config.rover.apply",
  "rover": {"model": "Trimble R12", "serial": "R12-88421", "btName": "TRMBLE_R12_88421"},
  "base": {"model": "Trimble NetR9", "ip": "192.168.1.50", "mountPoint": "TN-GNSS-RTK"},
  "ntrip": {"caster": "ntrip.tn.gov.in:2101", "username": "tn_field_1042", "password": "***"},
  "antennaHeightM": 1.85,
  "autoNtripOnConnect": true,
  "bluetoothPriority": true
}""")

    p(doc, "path.actual.batch sample:", bold=True, space_after=2)
    mono(doc, """{
  "messageType": "path.actual.batch",
  "packetId": "pkt-khutal-042",
  "samples": [
    {"lon": 79.83690, "lat": 10.92580, "headingRad": 1.02, "ts": "2026-06-10T09:14:00Z", "kind": "actual"},
    {"lon": 79.83710, "lat": 10.92595, "headingRad": 1.10, "ts": "2026-06-10T09:14:01Z", "kind": "actual"}
  ]
}""")

    doc.add_heading("7.3 Error Code Registry (Initial)", level=2)
    add_table(
        doc,
        ["Code", "Meaning"],
        [
            ["ROVER_CONNECT_TIMEOUT", "Connect exceeded 30 s"],
            ["ROVER_NOT_FOUND", "Bluetooth name not seen"],
            ["QUALITY_BELOW_THRESHOLD", "Accuracy/fix not meeting policy"],
            ["POINT_ID_REQUIRED", "Empty Point ID"],
            ["STORAGE_FULL", "Cannot persist"],
            ["STORAGE_CORRUPT", "Safe mode"],
            ["NTRIP_AUTH_FAILED", "Caster rejected credentials"],
            ["SYNC_AUTH_FAILED", "API token rejected"],
            ["SYNC_RESUME_REQUIRED", "Partial upload; retry with offset"],
            ["CLOCK_UNTRUSTED", "Refuse capture"],
            ["PAIRING_LOCKED", "Too many failed attempts"],
            ["OTA_SIGNATURE_INVALID", "Reject firmware"],
        ],
    )


def section_8(doc):
    doc.add_heading("8. Data Model", level=1)
    doc.add_heading("8.1 Point Record (aligns to CapturedGnssPoint + extensions)", level=2)
    add_table(
        doc,
        ["Field", "Type", "Notes"],
        [
            ["id", "string", "Stable UUID / gnss-###"],
            ["label", "string", "Point ID e.g. GCP-KHT-12"],
            ["lat / lng", "float64", "WGS84 degrees"],
            ["accuracyM", "float", "Horizontal metres"],
            ["satelliteCount", "int", "Core UI"],
            ["hdop / vdop", "float", "Core UI"],
            ["fixType", "enum", "Optional extension"],
            ["source", "enum", "bluetooth | ntrip | file"],
            ["capturedAt", "string/ISO", "Display + audit"],
            ["synced", "bool", "Pending vs Synced"],
            ["packetId", "string", "pkt-khutal-042"],
            ["antennaHeightM", "float", "From config"],
            ["rawRef", "string?", "Optional dump handle"],
            ["qualityFlags", "object", "requireFixed result etc."],
        ],
    )
    doc.add_heading("8.2 Field Packet", level=2)
    p(doc, "Mirrors FieldPacket: id, village (Khutal / Khutal Bangla), parcelCount, status "
          "(assigned | downloaded | in-progress | synced), dueDate, progressPct.")
    doc.add_heading("8.3 PathSegment / Route", level=2)
    p(doc, "SurveyorDemoRoute analogue: id, label, proposed[], actual[], arrows[] with lon, lat, headingRad, timestamp, kind.")
    doc.add_heading("8.4 DeviceHealth", level=2)
    p(doc, "batteryPct, storageFreeMb, temperatureC, bleRssi, roverLink, ntripState, firmwareVersion, lastErrorCode, uptimeSec.")


def section_9(doc):
    doc.add_heading("9. Use Cases & Scenarios", level=1)
    p(doc, "Each scenario lists Actors, Preconditions, Steps, Expected hardware behaviour, and Failure handling.")

    scenarios = [
        ("9.1 First-time pairing",
         "Surveyor, App, Device",
         "Device factory-reset; phone BT on.",
         "1) App scans. 2) Surveyor confirms PIN. 3) Bond stored.",
         "Advertise ICD UUID; complete bond ≤ 30 s; lock sensitive chars.",
         "On fail: PAIRING_LOCKED after N tries; clear instruction to reset."),
        ("9.2 Connect → six boxes populate",
         "Surveyor, App, Device, Rover",
         "Paired; Rover Settings set to Trimble R12.",
         "1) Tap Connect. 2) Searching… 3) Connected. 4) Lat/Lng/Accuracy/Sats/HDOP/VDOP update.",
         "Open rover link; stream telemetry.live ≥ 1 Hz; latency ≤ 500 ms.",
         "Timeout 30 s → ROVER_CONNECT_TIMEOUT; App shows No rover connected."),
        ("9.3 Edit Point ID GCP-KHT-06 → capture",
         "Surveyor, App, Device",
         "Connected; nextPointId editable.",
         "1) Pencil edit → GCP-KHT-06. 2) Capture control point.",
         "Stamp label exactly; ACK ≤ 1 s; Pending in store.",
         "Reject empty ID; if quality poor and policy on → QUALITY_BELOW_THRESHOLD."),
        ("9.4 Lose RTK fix mid-capture",
         "Surveyor, App, Device, Rover, NTRIP",
         "Was RTK_FIXED; corrections drop.",
         "1) Capture pressed during FLOAT.",
         "Supply fixType FLOAT; enforce threshold; prefer warn/reject over silent cm claim.",
         "App may override with explicit confirm — Device still records true quality."),
        ("9.5 Offline all day then Sync Now",
         "Surveyor, App, Device, Backend",
         "Khutal packet downloaded; cellular spotty all day.",
         "1) Capture many points. 2) Evening Sync now. 3) Progress 62→100. 4) Sync complete.",
         "Durable queue; chunked sync.upload; mark Synced only after ACK.",
         "If offline persists: keep Pending; do not wipe."),
        ("9.6 Partial sync failure resume",
         "App, Device, Backend",
         "Upload interrupted at ~40%.",
         "1) Retry Sync now. 2) Resume offset.",
         "Idempotent records; SYNC_RESUME_REQUIRED then continue.",
         "Never duplicate GCP labels on server."),
        ("9.7 Wrong API token / Test Connection failed",
         "Admin, App, Backend (± Device)",
         "Update Database Configuration unlocked; bad token.",
         "1) Test Connection. 2) Failure: Check URL and token.",
         "If Device holds token for uplink, return SYNC_AUTH_FAILED; do not retry storm.",
         "App remains source of UX; Device must not log token."),
        ("9.8 Rover config change via App → Device ACK",
         "Surveyor, App, Device, Rover",
         "Connected or idle.",
         "1) Change caster/mount/antenna. 2) Apply. 3) Reconnect.",
         "config.rover.apply → hardware applies → config.rover.ack.",
         "NTRIP_AUTH_FAILED surfaces; retain last good config."),
        ("9.9 Proposed path; tea-stall detour; actual path logged",
         "Surveyor, App, Device, Map",
         "path.proposed.set loaded.",
         "1) Start along proposed. 2) Mid-route excursion. 3) Return. 4) Map shows orange actual + arrows + timestamps.",
         "Log 1 Hz actual with heading/ts; no destructive snap-to-proposed.",
         "GPS gaps flagged; continuity restored on reacquire."),
        ("9.10 Power loss mid-write",
         "Field environment, Device",
         "Capture in progress write.",
         "1) Battery pull. 2) Reboot. 3) Inspect store.",
         "Transactional commit: either full point or none; journal replay.",
         "If corrupt → STORAGE_CORRUPT safe mode."),
        ("9.11 Multi-surveyor / multi-device same packet",
         "Two surveyors, Apps, Devices, Backend",
         "Same pkt-khutal-042 assigned (policy permitting).",
         "1) Both capture. 2) Sync.",
         "Namespace points with deviceId + label; Backend conflict rules final.",
         "Device SHALL NOT assume global uniqueness across devices without backend."),
        ("9.12 Clock drift correction",
         "Device, GNSS, App",
         "Device free-running overnight.",
         "1) Acquire GNSS. 2) Correct clock. 3) Emit CLOCK_CORRECTED.",
         "Align to GNSS time; subsequent stamps trustworthy.",
         "If unsynced → CLOCK_UNTRUSTED on capture."),
        ("9.13 Dual base failover",
         "Device, Base IP, NTRIP",
         "Primary base IP unreachable; caster available.",
         "1) Detect base fail. 2) Fail over to NTRIP mount TN-GNSS-RTK.",
         "SHOULD switch per Rover Settings toggles; emit health event.",
         "If both fail → continue autonomous with QUALITY flags."),
        ("9.14 Emergency (software-primary)",
         "Surveyor, App, Backend",
         "Threat event.",
         "1) Slide to activate on Emergency tab. 2) Mail/phone/call cascade.",
         "Hardware typically idle; MAY send last GPS ping if panic button implemented.",
         "Do not block soft emergency on device offline."),
        ("9.15 Storage full",
         "Surveyor, App, Device",
         "Capacity nearing limit.",
         "1) Health warns. 2) Capture attempted.",
         "Return STORAGE_FULL; refuse new captures; allow sync to free (after server ACK delete policy).",
         "Never overwrite unsynced points silently."),
        ("9.16 Spoofed BLE",
         "Attacker, App, Device",
         "Malicious advertisement mimicking name.",
         "1) App attempts pair to impostor.",
         "Numeric compare / bonded identity; refuse secrets to unknown host.",
         "Log security event; PAIRING_LOCKED escalation."),
        ("9.17 Download for offline then go dark",
         "Surveyor, App, Backend, Device",
         "pkt-khutal-011 Assigned.",
         "1) Download for offline → Downloaded. 2) Enter RF-dark zone.",
         "Device retains proposed path + empty point set; operates offline.",
         "If download incomplete, do not mark downloaded."),
        ("9.18 File import source points",
         "Surveyor, App, Device",
         "Legacy GNSS file available.",
         "1) Import path via App. 2) Device stores source=file.",
         "Accept validated imports per ICD; quality may be unknown.",
         "Reject malformed files with PARSE_ERROR."),
    ]

    for title, actors, pre, steps, expected, fail in scenarios:
        doc.add_heading(title, level=3)
        p(doc, f"Actors: {actors}", space_after=2)
        p(doc, f"Preconditions: {pre}", space_after=2)
        p(doc, f"Steps: {steps}", space_after=2)
        p(doc, f"Expected hardware behaviour: {expected}", space_after=2)
        p(doc, f"Failure handling: {fail}", space_after=8)


def section_10(doc):
    doc.add_heading("10. Workflow Charts", level=1)
    p(doc, "The following figures define sequence and swimlane expectations for OEM implementation and Software integration testing.")
    add_figure(doc, "fig02_survey_day_swimlane.png",
               "Figure 2. End-to-end survey day swimlane (Surveyor · App · Hardware · Rover · Backend).")
    add_figure(doc, "fig03_point_capture_sequence.png",
               "Figure 3. Point capture sequence.")
    add_figure(doc, "fig04_offline_sync_sequence.png",
               "Figure 4. Offline → Sync Now sequence.")
    add_figure(doc, "fig05_path_compliance_sequence.png",
               "Figure 5. Path compliance logging sequence.")
    add_figure(doc, "fig06_rover_config_sequence.png",
               "Figure 6. Rover configuration apply sequence.")


def section_11(doc):
    doc.add_heading("11. Acceptance Test Plan", level=1)
    p(doc, "Vendor must pass the following checklist before Software integration sign-off. Evidence: logs, timing traces, and sample unit results.")
    add_table(
        doc,
        ["ID", "Test", "Pass criteria"],
        [
            ["AT-01", "BLE pair + reconnect", "Bond persists across App relaunch"],
            ["AT-02", "Connect latency", "Median ≤ 15 s; timeout ≤ 30 s"],
            ["AT-03", "Six-box telemetry", "All fields stream; E2E ≤ 500 ms"],
            ["AT-04", "Capture ACK", "p95 ≤ 1 s; durable after power cycle"],
            ["AT-05", "Point ID edit", "GCP-KHT-06 stamped correctly"],
            ["AT-06", "Quality gate", "FLOAT rejected/warned when Fixed required"],
            ["AT-07", "Offline retain 14d", "Points intact after simulated delay"],
            ["AT-08", "Sync resume", "No duplicates after 40% interrupt"],
            ["AT-09", "Config apply", "NTRIP fields applied with ACK"],
            ["AT-10", "Path 1 Hz logging", "Detour retained; headings present"],
            ["AT-11", "Clock discipline", "Drift corrected; stamps valid"],
            ["AT-12", "OTA signed update", "Bad signature rejected; rollback works"],
            ["AT-13", "Storage full", "STORAGE_FULL; no silent wipe"],
            ["AT-14", "Security pairing", "Impostor cannot read points"],
            ["AT-15", "Env soak", "IP & temp profile report from lab"],
            ["AT-16", "ICD conformance", "Golden JSON fixtures pass parser"],
        ],
    )


def section_12(doc):
    doc.add_heading("12. Deliverables from Hardware Vendor", level=1)
    bullets(doc, [
        "Production-intent firmware images (signed) and OTA packages with release notes.",
        "Mobile/reference SDK or stub implementing the ICD message set.",
        "Interface Control Document (ICD) synchronized to this TRS V1.0.",
        "Sample hardware units (quantity peri procurement). ",
        "Factory test reports: RF, environmental, battery, storage endurance.",
        "Diagnostic log samples for AT-01…AT-16.",
        "Bill of materials summary for supportability (high-level, non-IP-abusive).",
        "Security statement: encryption-at-rest status, pairing model, vulnerability disclosure contact.",
    ])


def section_13(doc):
    doc.add_heading("13. Open Questions / Assumptions", level=1)
    p(doc, "Assumptions:", bold=True, space_after=2)
    bullets(doc, [
        "Android is the primary field OS; iOS is a secondary target; current demo is web PhoneFrame.",
        "BLE is the preferred phone↔device link; USB-C is mandatory fallback for labs/support.",
        "Instrument OEM protocols may require commercial SDKs licensed by the hardware vendor.",
        "Emergency remains software-owned unless OEM offers an optional panic accessory.",
        "Illustrative demo data (Khutal, GCP-KHT-##, Trimble R12, api.nilam.tn.gov.in) may differ in production tenants.",
        "Backend conflict policy is authoritative for multi-device packet merges.",
    ])
    p(doc, "Open questions for vendor response:", bold=True, space_after=2)
    bullets(doc, [
        "Will the device perform HTTPS sync directly or only bridge to the phone?",
        "Preferred secure element for NTRIP/API secrets?",
        "Which proprietary receivers are day-1 vs roadmap?",
        "Can path sampling raise to 5 Hz without thermal throttle in +50 °C sun?",
        "Lead time for IP65 sealed enclosure variants?",
    ])


def section_14(doc):
    doc.add_heading("14. Glossary", level=1)
    add_table(
        doc,
        ["Term", "Definition"],
        [
            ["NILAM", "Field/mobile cadastral survey application context within DoSLR / GeoNilam demos"],
            ["DoSLR", "Directorate / department WebGIS demonstration programme (platform README)"],
            ["DGPS", "Differential GPS — positioning with correction sources"],
            ["RTK", "Real-Time Kinematic centimetre-level GNSS technique"],
            ["NTRIP", "Networked Transport of RTCM via Internet Protocol"],
            ["HDOP / VDOP / PDOP", "Horizontal / Vertical / Position Dilution of Precision"],
            ["NMEA 0183", "Standard ASCII GNSS sentence protocol"],
            ["RTCM 3.x", "Binary GNSS correction message standard"],
            ["FMB", "Field Measurement Book — cadastral extract artefact in broader platform"],
            ["ULPIN", "Unique Land Parcel Identification Number (parcel search key in mobile data)"],
            ["DPR", "Daily Progress Report screens in NILAM Home"],
            ["GCP", "Ground Control Point (Point ID prefix GCP-KHT-##)"],
            ["ICD", "Interface Control Document"],
            ["OTA", "Over-the-Air firmware update"],
            ["SHALL / SHOULD / MAY", "RFC 2119 requirement levels"],
        ],
    )


def appendix_a(doc):
    doc.add_heading("Appendix A — Mapping to NILAM Mobile Screens", level=1)
    p(doc, "UI references below are Illustrative UI Reference wireframes derived from the PhoneFrame prototype feature set "
          "(not production screenshots of a physical device session).")
    add_figure(doc, "ui_home_dpr.png", "Figure A1. Home / DPR (illustrative) — DPR counts fed by synced GNSS points; hardware has no direct DPR UI role.")
    add_figure(doc, "ui_map_paths.png", "Figure A2. Map with Proposed (blue) vs Actual (orange) paths, direction, timestamps.")
    add_figure(doc, "ui_gnss_capture.png", "Figure A3. DGPS / GNSS capture — six telemetry boxes + editable Point ID + Capture control point.")
    add_figure(doc, "ui_field_sync.png", "Figure A4. Field sync — Sync now, Download for offline, Khutal packets.")
    add_figure(doc, "ui_rover_settings.png", "Figure A5. Rover Settings — model, base, NTRIP, antenna height.")
    add_figure(doc, "ui_app_settings.png", "Figure A6. App Settings — Database API URL, Bearer token, Test Connection.")
    add_figure(doc, "ui_emergency.png", "Figure A7. Emergency — software cascade; optional hardware panic note.")

    add_table(
        doc,
        ["UI control / screen", "Hardware API / behaviour"],
        [
            ["Connect / Disconnect (Capture)", "Rover session open/close; telemetry.live start/stop"],
            ["Six metric boxes", "telemetry.live fields"],
            ["Point ID pencil edit", "Pre-capture pointId on request / point.update"],
            ["Capture control point", "point.capture.request/response"],
            ["Synced / Pending badges", "synced flag after sync.upload ACK"],
            ["Sync now", "sync.upload + progress events"],
            ["Download for offline", "App/Backend primarily; Device stores proposed path + packet context"],
            ["Rover Settings Save/Apply", "config.rover.apply"],
            ["App Settings Test Connection", "Software↔API; Device only if uplink mediated"],
            ["Map path legend", "path.proposed.set + path.actual.batch"],
            ["Emergency slide", "No mandatory hardware call; optional GPS ping"],
            ["DPR Home chart", "Indirect — uses captured point counts post-sync"],
            ["Auto-increment Point IDs toggle", "Device/App collaborate on GCP-KHT-##"],
            ["Min accuracy ±0.15 m RTK Fixed", "Quality gate in capture path"],
        ],
    )


def appendix_b(doc):
    doc.add_heading("Appendix B — Attribute Dictionary (6+ Fields)", level=1)
    add_table(
        doc,
        ["Attribute", "Unit", "Typical range", "Precision (display)", "Update rate"],
        [
            ["Latitude", "decimal degrees", "−90…90 (TN ~8–13°N)", "5+ decimals (app shows 5)", "≥ 1 Hz"],
            ["Longitude", "decimal degrees", "−180…180 (TN ~76–80°E)", "5+ decimals", "≥ 1 Hz"],
            ["Accuracy", "metres (horizontal)", "0.01…30+", "0.01 m", "≥ 1 Hz"],
            ["Satellite Count", "count", "0…60+", "integer", "≥ 1 Hz"],
            ["HDOP", "dimensionless", "0.5…20+", "0.1", "≥ 1 Hz"],
            ["VDOP", "dimensionless", "0.5…20+", "0.1", "≥ 1 Hz"],
            ["fix type (opt.)", "enum", "NONE…RTK_FIXED", "—", "≥ 1 Hz"],
            ["PDOP (opt.)", "dimensionless", "0.5…20+", "0.1", "≥ 1 Hz"],
            ["SNR mean (opt.)", "dB-Hz", "20…55", "0.1", "≥ 1 Hz"],
            ["Rover battery (opt.)", "%", "0–100", "1", "0.2 Hz"],
            ["GPS week / TOW (opt.)", "week / s", "GNSS time", "ms", "≥ 1 Hz"],
            ["Antenna height", "m", "0–5", "0.01", "on config"],
            ["Path heading", "radians", "−π…π", "1e-3", "path rate"],
            ["Path timestamp", "UTC ISO", "—", "1 s", "path rate"],
        ],
    )
    p(doc, "Illustrative connected snapshot from Capture screen prototype: Lat 19.29352, Lng 73.52641, Accuracy 0.09 m, "
          "Satellite Count 14, HDOP 0.8, VDOP 1.2. Field packets may alternatively show coordinates near 10.92°N, 79.83°E "
          "(Thanjavur / coastal demo points GCP-KHT-12…16).")
    p(doc, "— End of Document —", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    p(doc, "NILAM Field Hardware Device Technical Requirements Specification V1.0 · 2026-07-08 · Confidential — Vendor Restricted",
      size=9, color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER)


def build():
    doc = Document()
    style_doc(doc)
    setup_header_footer(doc)
    cover_page(doc)
    toc_placeholder(doc)
    section_1(doc)
    section_2(doc)
    section_3(doc)
    section_4(doc)
    section_5(doc)
    section_6(doc)
    section_7(doc)
    section_8(doc)
    section_9(doc)
    section_10(doc)
    section_11(doc)
    section_12(doc)
    section_13(doc)
    section_14(doc)
    appendix_a(doc)
    appendix_b(doc)

    doc.save(str(OUT_PRIMARY))
    print(f"Wrote {OUT_PRIMARY} ({OUT_PRIMARY.stat().st_size} bytes)")
    try:
        shutil.copy2(OUT_PRIMARY, OUT_DESKTOP)
        print(f"Copied {OUT_DESKTOP} ({OUT_DESKTOP.stat().st_size} bytes)")
    except Exception as e:
        print(f"Desktop copy failed: {e}")


if __name__ == "__main__":
    build()
