# -*- coding: utf-8 -*-
"""Guide PDF lead magnet efactureguide.fr. Edition octobre 2026."""
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, PageBreak, KeepTogether, NextPageTemplate,
                                CondPageBreak, Flowable)
from reportlab.platypus.tableofcontents import TableOfContents

OUT = sys.argv[1] if len(sys.argv) > 1 else "guide.pdf"

# ---------- Paramètres marque (modifiable) ----------
SITE = "efactureguide.fr"
SITE_URL = "https://affiliation2027.netlify.app"   # remplacer par https://efactureguide.fr au passage du domaine
EDITION = "Édition octobre 2026"
MAJ = "Informations vérifiées au 15 octobre 2026"

# ---------- Polices ----------
import os
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts") + "/"
for name, file in [("Inter", "Inter-Regular.ttf"), ("Inter-Med", "Inter-Medium.ttf"),
                   ("Inter-Semi", "Inter-SemiBold.ttf"), ("Inter-Bold", "Inter-Bold.ttf"),
                   ("Inter-It", "Inter-Italic.ttf"), ("Disp-Bold", "InterDisplay-Bold.ttf"),
                   ("Disp-Black", "InterDisplay-Black.ttf")]:
    pdfmetrics.registerFont(TTFont(name, F + file))
from reportlab.lib.fonts import addMapping
addMapping("Inter", 0, 0, "Inter"); addMapping("Inter", 1, 0, "Inter-Bold")
addMapping("Inter", 0, 1, "Inter-It"); addMapping("Inter", 1, 1, "Inter-Bold")

# ---------- Couleurs ----------
INK = colors.HexColor("#121411")
DARK = colors.HexColor("#1E2A22")
ACC = colors.HexColor("#1F7A4D")      # vert profond
LIME = colors.HexColor("#B8F35A")     # accent couverture
SOFT = colors.HexColor("#EEF6EF")
LINE = colors.HexColor("#D5DDD6")
GREY = colors.HexColor("#5C665F")
WARN = colors.HexColor("#B4442B")
WARN_BG = colors.HexColor("#FBEDE8")
AMBER_BG = colors.HexColor("#FFF6DD")

# ---------- Styles ----------
S = {}
S["body"] = ParagraphStyle("body", fontName="Inter", fontSize=9.6, leading=14.2, textColor=INK, spaceAfter=6)
S["small"] = ParagraphStyle("small", parent=S["body"], fontSize=8, leading=11, textColor=GREY)
S["h1"] = ParagraphStyle("h1", fontName="Disp-Bold", fontSize=22, leading=26, textColor=INK, spaceAfter=4)
S["kicker"] = ParagraphStyle("kicker", fontName="Inter-Semi", fontSize=8.5, leading=11, textColor=ACC, spaceAfter=2)
S["lead"] = ParagraphStyle("lead", fontName="Inter", fontSize=11, leading=16, textColor=GREY, spaceAfter=12)
S["h2"] = ParagraphStyle("h2", fontName="Inter-Bold", fontSize=12.5, leading=16, textColor=INK, spaceBefore=10, spaceAfter=5)
S["h3"] = ParagraphStyle("h3", fontName="Inter-Semi", fontSize=10.2, leading=14, textColor=ACC, spaceBefore=6, spaceAfter=3)
S["cell"] = ParagraphStyle("cell", fontName="Inter", fontSize=8.6, leading=11.6, textColor=INK)
S["cellb"] = ParagraphStyle("cellb", parent=S["cell"], fontName="Inter-Semi")
S["cellh"] = ParagraphStyle("cellh", parent=S["cell"], fontName="Inter-Semi", textColor=colors.white)
S["bullet"] = ParagraphStyle("bullet", parent=S["body"], leftIndent=13, bulletIndent=2, spaceAfter=3)
S["box"] = ParagraphStyle("box", parent=S["body"], fontSize=9.2, leading=13.4, spaceAfter=3)
S["boxt"] = ParagraphStyle("boxt", fontName="Inter-Bold", fontSize=9.4, leading=13, textColor=ACC, spaceAfter=3)
S["toc1"] = ParagraphStyle("toc1", fontName="Inter-Med", fontSize=10.5, leading=20, textColor=INK)
S["big"] = ParagraphStyle("big", fontName="Disp-Black", fontSize=24, leading=26, textColor=ACC)
S["bigl"] = ParagraphStyle("bigl", fontName="Inter", fontSize=8.3, leading=11, textColor=GREY)

W, H = A4
M = 18 * mm
CW = W - 2 * M


def P(t, s="body"):
    return Paragraph(t, S[s])


def bullets(items, style="bullet"):
    return [Paragraph(i, S[style], bulletText="•") for i in items]


def box(title, lines, bg=SOFT, border=ACC, tcolor=None):
    st = ParagraphStyle("bt", parent=S["boxt"], textColor=tcolor or border)
    content = [Paragraph(title, st)] if title else []
    for l in lines:
        content.append(Paragraph(l, S["box"]))
    t = Table([[content]], colWidths=[CW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return KeepTogether([Spacer(1, 4), t, Spacer(1, 8)])


def table(rows, widths, header=True, zebra=True, first_bold=False):
    data = []
    for r_i, row in enumerate(rows):
        cells = []
        for c_i, c in enumerate(row):
            if header and r_i == 0:
                cells.append(Paragraph(c, S["cellh"]))
            elif first_bold and c_i == 0:
                cells.append(Paragraph(c, S["cellb"]))
            else:
                cells.append(Paragraph(c, S["cell"]))
        data.append(cells)
    t = Table(data, colWidths=[w * CW for w in widths], repeatRows=1 if header else 0)
    st = [("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
          ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
          ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE)]
    if header:
        st += [("BACKGROUND", (0, 0), (-1, 0), DARK)]
    if zebra:
        for i in range(1 if header else 0, len(rows)):
            if i % 2 == 0:
                st.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#F6F8F6")))
    t.setStyle(TableStyle(st))
    return t


def stats(items):
    cells = [[Paragraph(v, S["big"]), ] for v, _ in items]
    row1 = [Paragraph(v, S["big"]) for v, _ in items]
    row2 = [Paragraph(l, S["bigl"]) for _, l in items]
    n = len(items)
    t = Table([row1, row2], colWidths=[CW / n] * n)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SOFT),
        ("LINEAFTER", (0, 0), (-2, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 10), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return KeepTogether([t, Spacer(1, 10)])


class Doc(BaseDocTemplate):
    def afterFlowable(self, f):
        if isinstance(f, Paragraph) and f.style.name == "h1":
            txt = f.getPlainText()
            key = "s%d" % id(f)
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(txt, key, level=0)
            self.notify("TOCEntry", (0, txt, self.page, key))


def on_cover(c, d):
    c.saveState()
    c.setFillColor(INK); c.rect(0, 0, W, H, stroke=0, fill=1)
    # motif : lignes de "facture structurée"
    c.setStrokeColor(colors.HexColor("#2A332C")); c.setLineWidth(0.6)
    for i in range(14):
        y = H - 95 * mm - i * 7 * mm
        c.line(W - 78 * mm, y, W - M, y)
    c.setFillColor(LIME); c.rect(W - 78 * mm, H - 95 * mm - 13 * 7 * mm - 2, 22 * mm, 3, stroke=0, fill=1)
    c.setFont("Inter-Semi", 9); c.setFillColor(LIME)
    c.drawString(M, H - 24 * mm, SITE.upper())
    c.setFont("Inter", 9); c.setFillColor(colors.HexColor("#9AA59D"))
    c.drawRightString(W - M, H - 24 * mm, EDITION)
    c.setFillColor(colors.white); c.setFont("Disp-Black", 40)
    y = H - 72 * mm
    for line in ["Facturation", "électronique", "le guide pratique"]:
        c.drawString(M, y, line); y -= 15 * mm
    c.setFillColor(LIME); c.setFont("Disp-Bold", 20)
    c.drawString(M, y - 2 * mm, "2026-2027")
    c.setFillColor(colors.HexColor("#C9D1CB")); c.setFont("Inter", 11.5)
    y -= 20 * mm
    for line in ["Calendrier, obligations, sanctions, e-reporting,",
                 "choix de la plateforme agréée et plan d'action",
                 "pour être prêt au 1er septembre 2027."]:
        c.drawString(M, y, line); y -= 6.5 * mm
    # bandeau bas
    c.setFillColor(LIME); c.rect(M, 38 * mm, 34 * mm, 1.4 * mm, stroke=0, fill=1)
    c.setFillColor(colors.white); c.setFont("Inter-Semi", 10)
    c.drawString(M, 30 * mm, "Pour TPE, PME, indépendants et micro-entrepreneurs")
    c.setFillColor(colors.HexColor("#9AA59D")); c.setFont("Inter", 8.5)
    c.drawString(M, 24 * mm, MAJ + ". Sources officielles citées en fin de guide.")
    c.restoreState()


def on_page(c, d):
    c.saveState()
    c.setStrokeColor(LINE); c.setLineWidth(0.5)
    c.line(M, H - 13 * mm, W - M, H - 13 * mm)
    c.setFont("Inter-Semi", 7.5); c.setFillColor(ACC)
    c.drawString(M, H - 11 * mm, SITE)
    c.setFont("Inter", 7.5); c.setFillColor(GREY)
    c.drawRightString(W - M, H - 11 * mm, "Facturation électronique : le guide pratique 2026-2027")
    c.line(M, 13 * mm, W - M, 13 * mm)
    c.drawString(M, 9 * mm, EDITION + ". Information générale, ne remplace pas le conseil de votre expert-comptable.")
    c.setFont("Inter-Semi", 8); c.setFillColor(INK)
    c.drawRightString(W - M, 9 * mm, str(d.page))
    c.restoreState()


doc = Doc(OUT, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=20 * mm, bottomMargin=19 * mm,
          title="Facturation électronique : le guide pratique 2026-2027", author=SITE,
          subject="Guide gratuit facturation électronique", creator=SITE)
frame = Frame(M, 19 * mm, CW, H - 39 * mm, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
doc.addPageTemplates([PageTemplate(id="cover", frames=[Frame(0, 0, W, H)], onPage=on_cover),
                      PageTemplate(id="page", frames=[frame], onPage=on_page)])

story = [NextPageTemplate("page"), PageBreak()]


def chapter(num, title, lead=None):
    out = [CondPageBreak(60 * mm), Paragraph("CHAPITRE %s" % num, S["kicker"]), Paragraph(title, S["h1"])]
    if lead:
        out.append(Paragraph(lead, S["lead"]))
    return out


# ---------- Sommaire ----------
toc = TableOfContents()
toc.levelStyles = [S["toc1"]]
toc.dotsMinLevel = 0
S["h1n"] = ParagraphStyle("h1n", parent=S["h1"])
story += [Paragraph("SOMMAIRE", S["kicker"]), Paragraph("Ce que contient ce guide", S["h1n"]), Spacer(1, 8), toc,
          Spacer(1, 14),
          box("Comment utiliser ce guide",
              ["Lisez le chapitre 1 en cinq minutes : il donne l'essentiel. Allez ensuite au chapitre 11 pour votre profil, puis suivez le plan d'action du chapitre 12. La checklist du chapitre 13 s'imprime et se coche.",
               "Les montants, dates et seuils viennent des textes et des sites officiels (impots.gouv.fr, economie.gouv.fr, Légifrance). La liste complète des sources figure au chapitre 15."]),
          PageBreak()]

# ---------- 1. L'essentiel ----------
story += chapter("1", "L'essentiel en une page", "Cinq points à retenir si vous ne lisez que cette page.")
ess = [
    ["1", "<b>La réforme est en vigueur depuis le 1er septembre 2026.</b> Toute entreprise assujettie à la TVA établie en France doit pouvoir recevoir des factures électroniques via une plateforme agréée. Micro-entrepreneurs en franchise de TVA compris."],
    ["2", "<b>Votre prochaine échéance est le 1er septembre 2027</b> si vous êtes TPE, PME ou micro-entreprise. À cette date, vous devrez émettre vos factures au format électronique et transmettre vos données de e-reporting."],
    ["3", "<b>Un PDF envoyé par e-mail n'est plus une facture électronique.</b> La facture doit être structurée (Factur-X, UBL ou CII) et passer par une plateforme agréée."],
    ["4", "<b>Aucune sanction n'est appliquée en 2026</b>, mais la tolérance n'est ni un report ni une dispense. L'administration regarde si vous avez engagé une démarche sérieuse. Ensuite, les amendes s'appliquent : 50 € par facture non électronique, jusqu'à 15 000 € par an."],
    ["5", "<b>Votre action prioritaire : choisir une plateforme agréée</b> (ou un logiciel compatible relié à une plateforme), vérifier votre inscription dans l'annuaire et préparer vos fiches clients avec leur SIREN."],
]
t = Table([[Paragraph(n, S["big"]), Paragraph(x, S["body"])] for n, x in ess], colWidths=[14 * mm, CW - 14 * mm])
t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -2), 0.5, LINE),
                       ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                       ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
story += [t, Spacer(1, 10)]
story += [P("Premier bilan officiel du comité de suivi du 8 octobre 2026 :", "h3"),
          stats([("75 %", "des entreprises déclarant de la TVA ont désigné une plateforme de réception"),
                 ("20 M", "de factures électroniques échangées depuis le 1er septembre"),
                 ("70 Md€", "de montants facturés via le nouveau circuit")]),
          P("Source : economie.gouv.fr, actualité du 12 octobre 2026. Une entreprise sur quatre n'a donc pas encore désigné sa plateforme.", "small"),
          PageBreak()]

# ---------- 2. Calendrier ----------
story += chapter("2", "Le calendrier officiel", "Deux obligations distinctes : recevoir et émettre. Elles n'arrivent pas à la même date selon la taille de l'entreprise.")
story += [table([
    ["Catégorie", "Recevoir", "Émettre + e-reporting", "Statut au 15/10/2026"],
    ["Grandes entreprises (GE)", "1er sept. 2026", "1er sept. 2026", "En vigueur"],
    ["Entreprises de taille intermédiaire (ETI)", "1er sept. 2026", "1er sept. 2026", "En vigueur"],
    ["Membres d'un assujetti unique (groupe TVA)", "1er sept. 2026", "1er sept. 2026", "En vigueur"],
    ["PME", "1er sept. 2026", "1er sept. 2027", "Réception en vigueur"],
    ["TPE et micro-entreprises", "1er sept. 2026", "1er sept. 2027", "Réception en vigueur"],
], [0.36, 0.17, 0.22, 0.25], first_bold=True), Spacer(1, 10)]
story += [P("Les seuils des catégories", "h2"),
          P("La catégorie se détermine à partir de l'effectif, du chiffre d'affaires et du total de bilan (décret n° 2008-1354 du 18 décembre 2008)."),
          table([
              ["Catégorie", "Effectif", "Chiffre d'affaires ou bilan"],
              ["Grande entreprise", "5 000 salariés et plus", "Ou CA supérieur à 1,5 Md€ et bilan supérieur à 2 Md€"],
              ["ETI", "250 à 4 999 salariés", "CA jusqu'à 1,5 Md€ ou bilan jusqu'à 2 Md€"],
              ["PME", "Moins de 250 salariés", "CA jusqu'à 50 M€ ou bilan jusqu'à 43 M€"],
              ["Micro-entreprise (TPE)", "Moins de 10 salariés", "CA ou bilan jusqu'à 2 M€"],
          ], [0.25, 0.27, 0.48], first_bold=True), Spacer(1, 6),
          box("Ce qui peut encore bouger",
              ["La loi (article 91 de la loi de finances pour 2024) autorise un décalage par décret de l'échéance 2027 au plus tard au 1er décembre 2027. À la date de ce guide, aucun décalage n'est annoncé. Le gouvernement prépare au contraire l'échéance 2027 avec un comité de suivi qui se réunira de nouveau avant fin 2026.",
               "Conséquence pratique : planifiez sur le 1er septembre 2027. Un éventuel décalage de trois mois ne change pas les étapes à mener."],
              bg=AMBER_BG, border=colors.HexColor("#C99A12"), tcolor=colors.HexColor("#8A6400")),
          P("Les jalons déjà passés", "h2"),
          table([
              ["Date", "Événement"],
              ["26 février 2026", "Lancement du pilote national en conditions réelles"],
              ["19 février 2026", "Loi de finances pour 2026 (article 123) : architecture des plateformes agréées et sanctions renforcées"],
              ["28 juillet 2026", "Décret n° 2026-677 et arrêté du 27 juillet 2026 : cadre réglementaire complet"],
              ["1er septembre 2026", "Entrée en vigueur : réception pour tous, émission pour GE et ETI"],
              ["8 octobre 2026", "Premier comité de suivi : 75 % des déclarants TVA équipés en réception"],
          ], [0.22, 0.78], first_bold=True),
          PageBreak()]

# ---------- 3. Qui est concerné ----------
story += chapter("3", "Êtes-vous concerné ?", "Le critère n'est pas la taille ni le statut juridique. Le critère est l'assujettissement à la TVA et l'établissement en France.")
story += [P("Sont concernés", "h2")]
story += bullets(["Les sociétés commerciales (SAS, SASU, SARL, EURL, SA), quel que soit leur régime fiscal.",
                  "Les entreprises individuelles et les <b>micro-entrepreneurs, y compris en franchise en base de TVA</b>. La franchise dispense de facturer la TVA, pas d'être assujetti.",
                  "Les artisans, commerçants, professions libérales et professions médicales.",
                  "Les SCI, SCP, loueurs meublés (LMP, LMNP) assujettis.",
                  "Les associations qui exercent une activité économique assujettie à la TVA."])
story += [P("Le cas des opérations exonérées", "h2"),
          P("Certaines opérations exonérées de TVA et dispensées de facture (soins médicaux, enseignement, assurance, certaines opérations bancaires ou immobilières) sortent de l'obligation d'émission et du e-reporting. <b>L'entreprise qui les réalise doit quand même pouvoir recevoir les factures électroniques de ses fournisseurs.</b> Un médecin ou un kinésithérapeute doit donc avoir une plateforme de réception."),
          P("Ne sont pas concernés", "h2"),
          P("Les particuliers, les associations sans activité économique et les entreprises non établies en France pour l'échange de factures (ces dernières peuvent avoir des obligations de e-reporting). Un fournisseur ne peut pas imposer une plateforme à une entité non assujettie (DGFiP, 29 septembre 2026)."),
          P("Quelles opérations passent par la facture électronique ?", "h2"),
          table([
              ["Type d'opération", "Facture électronique (e-invoicing)", "Données à l'administration (e-reporting)"],
              ["Vente ou prestation à une entreprise assujettie établie en France (B2B domestique)", "Oui", "Non, la plateforme transmet les données de la facture"],
              ["Vente ou prestation à un particulier (B2C)", "Non, ticket ou facture classique", "Oui, données de transaction"],
              ["Vente à un client étranger ou achat à un fournisseur étranger", "Non", "Oui, données de transaction"],
              ["Encaissement d'une prestation de services (TVA exigible à l'encaissement)", "Statut « Encaissée »", "Oui, données de paiement"],
              ["Vente à une administration (B2G)", "Oui, via Chorus Pro", "Non"],
          ], [0.40, 0.27, 0.33], first_bold=True), Spacer(1, 4),
          P("Vos obligations en 4 questions : questionnaire officiel sur impots.gouv.fr ou simulateur d'échéance sur %s." % SITE, "small"),
          PageBreak()]

# ---------- 4. Facture électronique ----------
story += chapter("4", "Ce qu'est (et n'est pas) une facture électronique",
                 "Le changement de fond : la facture devient une donnée lisible par les logiciels, et non plus un document à regarder.")
story += [table([
    ["Ce n'est PAS une facture électronique", "C'EST une facture électronique"],
    ["Un PDF généré par Word ou Excel et envoyé par e-mail", "Un fichier structuré au format Factur-X, UBL ou CII"],
    ["Une facture papier scannée", "Émis et transmis via une plateforme agréée"],
    ["Une facture téléchargée sur le portail d'un fournisseur", "Avec les mentions obligatoires dans des champs dédiés"],
    ["Une photo de facture envoyée par messagerie", "Suivi par des statuts de cycle de vie"],
], [0.5, 0.5]), Spacer(1, 8),
    P("Les trois formats autorisés", "h2"),
    table([
        ["Format", "Description", "Pour qui"],
        ["Factur-X", "Format mixte : un PDF lisible par un humain avec un fichier XML intégré lisible par les logiciels. Norme franco-allemande.", "Le plus adapté aux TPE et indépendants. Le client voit un PDF classique."],
        ["UBL", "Fichier XML pur, standard international utilisé par le réseau Peppol.", "Entreprises qui échangent avec l'étranger ou de gros volumes."],
        ["CII", "Fichier XML pur, standard des Nations unies (UN/CEFACT).", "Grandes entreprises et échanges industriels."],
    ], [0.15, 0.50, 0.35], first_bold=True), Spacer(1, 6),
    box("En pratique", ["Vous n'avez pas à manipuler ces formats. Votre logiciel ou votre plateforme génère le bon fichier. Votre rôle : vérifier que l'outil choisi produit au minimum du Factur-X et reçoit les trois formats."]),
    P("Ce qui change pour la conservation", "h2"),
    P("Les durées ne changent pas : 6 ans au titre du contrôle fiscal (livre des procédures fiscales, article L102 B) et 10 ans au titre du Code de commerce. Ce qui change : la facture électronique doit être conservée dans son format d'origine. La version XML fait foi, pas une impression. Vérifiez que votre plateforme propose un archivage à valeur probante sur toute cette durée, ou exportez régulièrement vos fichiers."),
    PageBreak()]

# ---------- 5. Circuit ----------
story += chapter("5", "Qui fait quoi : le nouveau circuit", "Les entreprises n'échangent plus leurs factures directement. Une plateforme agréée sert d'intermédiaire obligatoire.")
flow = Table([[Paragraph("<b>Vous</b><br/>logiciel de facturation ou de caisse", S["cell"]), Paragraph("→", S["big"]),
               Paragraph("<b>Votre plateforme agréée</b><br/>contrôle, transmet, archive", S["cell"]), Paragraph("→", S["big"]),
               Paragraph("<b>Plateforme du client</b><br/>trouvée via l'annuaire central", S["cell"]), Paragraph("→", S["big"]),
               Paragraph("<b>Votre client</b><br/>reçoit, accepte ou refuse", S["cell"])],
              [Paragraph("", S["cell"]), "", Paragraph("↓ données fiscales", S["cellb"]), "", "", "", ""],
              [Paragraph("", S["cell"]), "", Paragraph("<b>Administration fiscale</b><br/>concentrateur de données (PPF)", S["cell"]), "", "", "", ""]],
             colWidths=[0.21 * CW, 0.06 * CW, 0.21 * CW, 0.06 * CW, 0.21 * CW, 0.06 * CW, 0.19 * CW])
flow.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, 0), SOFT), ("BACKGROUND", (2, 0), (2, 0), SOFT), ("BACKGROUND", (4, 0), (4, 0), SOFT),
    ("BACKGROUND", (6, 0), (6, 0), SOFT), ("BACKGROUND", (2, 2), (2, 2), AMBER_BG),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (1, 0), (1, 0), "CENTER"),
    ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
story += [flow, Spacer(1, 12),
          table([
              ["Acteur", "Rôle", "Ce que vous devez savoir"],
              ["Plateforme agréée (PA)", "Seul intermédiaire habilité à émettre, recevoir et transmettre les données à l'administration. Anciennement appelée PDP.", "Immatriculée par la DGFiP pour 3 ans renouvelables, auditée, certifiée ISO 27001, données hébergées dans l'UE. Liste officielle sur impots.gouv.fr."],
              ["Solution compatible", "Logiciel de facturation, de caisse, de gestion ou de comptabilité qui se connecte à une PA.", "Elle n'est pas immatriculée. Elle doit obligatoirement passer par une PA. Demandez à votre éditeur laquelle."],
              ["Annuaire central", "Répertoire géré par l'État qui indique, pour chaque SIREN, sa plateforme de réception.", "Votre plateforme vous y inscrit. Votre expert-comptable peut le faire par mandat."],
              ["Portail public de facturation (PPF)", "Recentré sur l'annuaire et la collecte des données fiscales.", "Il ne propose plus de portail gratuit d'émission ou de réception de factures."],
              ["Chorus Pro", "Plateforme du secteur public.", "Reste le canal pour facturer l'État et les collectivités (B2G)."],
          ], [0.22, 0.38, 0.40], first_bold=True), Spacer(1, 6),
          box("Chiffre clé", ["Environ 140 à 170 plateformes sont immatriculées selon les décomptes de l'été 2026. Beaucoup d'offres grand public (banques en ligne, logiciels de facturation) s'appuient en marque blanche sur une quinzaine de plateformes « infrastructure »."]),
          PageBreak()]

# ---------- 6. Mentions ----------
story += chapter("6", "Les mentions obligatoires", "Les règles de fond de la facture ne changent pas. Quatre mentions s'ajoutent pour les factures émises dans le cadre de la réforme.")
story += [P("Les 4 nouvelles mentions", "h2"),
          table([
              ["Nouvelle mention", "Quand", "Exemple"],
              ["Numéro SIREN du client", "Toujours, pour un client assujetti", "SIREN 123 456 789"],
              ["Catégorie de l'opération", "Toujours", "Livraison de biens, prestation de services, ou les deux"],
              ["Option pour le paiement de la TVA d'après les débits", "Seulement si vous avez opté", "« Option pour le paiement de la taxe d'après les débits »"],
              ["Adresse de livraison", "Seulement si elle diffère de l'adresse de facturation", "Livraison : chantier, 12 rue des Lilas, 52000 Chaumont"],
          ], [0.33, 0.30, 0.37], first_bold=True), Spacer(1, 8),
          P("Les mentions qui restent obligatoires", "h2"),
          table([
              ["Bloc", "Mentions"],
              ["Identification", "Date d'émission, numéro unique et chronologique, date de la vente ou de la prestation"],
              ["Vendeur", "Dénomination ou nom, adresse, SIREN, numéro de TVA intracommunautaire (sauf franchise), forme juridique et capital pour une société"],
              ["Client", "Nom ou dénomination, adresse de facturation, numéro de TVA intracommunautaire si professionnel"],
              ["Détail", "Désignation, quantité, prix unitaire HT, taux de TVA, réductions éventuelles"],
              ["Montants", "Total HT, montant de TVA par taux, total TTC"],
              ["Paiement", "Date d'échéance, pénalités de retard, indemnité forfaitaire de 40 € pour frais de recouvrement, conditions d'escompte"],
              ["Cas particuliers", "« TVA non applicable, article 293 B du CGI » en franchise, « Autoliquidation » en sous-traitance BTP, mentions d'assurance décennale pour les artisans du bâtiment"],
          ], [0.22, 0.78], first_bold=True), Spacer(1, 6),
          box("Attention", ["Une mention manquante ou erronée reste sanctionnée de 15 € par mention, dans la limite du quart du montant de la facture (article 1737 du CGI). Avec la facture structurée, la plateforme bloque souvent la facture incomplète : vous perdez du temps et de la trésorerie avant même toute amende."],
              bg=WARN_BG, border=WARN),
          box("Action immédiate", ["Collectez dès maintenant le SIREN de tous vos clients professionnels. C'est la tâche la plus longue pour une TPE et elle conditionne l'acheminement de vos factures. L'annuaire des entreprises (annuaire-entreprises.data.gouv.fr) permet de retrouver un SIREN à partir d'un nom."]),
          PageBreak()]

# ---------- 7. Cycle de vie ----------
story += chapter("7", "Le cycle de vie d'une facture", "Chaque facture électronique porte des statuts. Ils vous disent en temps réel où en est votre facture.")
story += [table([
    ["Statut", "Signification", "Obligatoire"],
    ["Déposée", "La facture a été déposée sur la plateforme et a passé les contrôles", "Oui"],
    ["Rejetée", "Incident technique ou de format détecté par une plateforme. La facture n'est pas arrivée.", "Oui"],
    ["Refusée", "Le client refuse la facture pour un motif métier. Le refus doit être motivé.", "Oui"],
    ["Encaissée", "Le paiement est reçu. Sert de donnée de paiement pour les prestations de services.", "Oui"],
    ["Reçue, mise à disposition, prise en charge, approuvée, litige, paiement transmis...", "Statuts de suivi intermédiaires", "Facultatifs selon les plateformes"],
], [0.28, 0.55, 0.17], first_bold=True), Spacer(1, 8),
    P("Rejet ou refus : deux réactions différentes", "h2"),
    table([
        ["", "Rejet", "Refus"],
        ["Origine", "Technique : format, donnée manquante, routage", "Métier : prix, quantité, commande inexistante"],
        ["Qui le déclenche", "Une plateforme", "Votre client"],
        ["Votre réaction", "Corriger la cause et retransmettre la facture", "Échanger avec le client, puis émettre un avoir et une nouvelle facture si nécessaire"],
    ], [0.2, 0.4, 0.4], first_bold=True), Spacer(1, 8),
    box("En cas de blocage technique (guide pratique DGFiP)",
        ["Une facture reçue par e-mail, en PDF ou sur papier à cause d'un incident reste payable et peut ouvrir droit à déduction de TVA si l'opération est réelle et la facture complète.",
         "Vous pouvez transmettre un double par un autre canal en le marquant « duplicata » ou « copie de continuité » et en le rattachant à la facture d'origine.",
         "Une même facture ne doit jamais être payée, comptabilisée, déduite ou déclarée deux fois."]),
    PageBreak()]

# ---------- 8. E-reporting ----------
story += chapter("8", "Le e-reporting, l'obligation méconnue",
                 "Ce qui ne passe pas par une facture électronique doit quand même remonter à l'administration. C'est le e-reporting.")
story += [P("Deux types de données", "h2"),
          table([
              ["Données", "Concerne", "Contenu"],
              ["Données de transaction", "Ventes à des particuliers (B2C) et opérations avec l'étranger (ventes et achats)", "Montants HT et TVA par taux, agrégés par jour pour le B2C, catégorie d'opération"],
              ["Données de paiement", "Prestations de services dont la TVA est exigible à l'encaissement", "Date et montant encaissé, par taux. En B2B, le statut « Encaissée » sur la facture suffit."],
          ], [0.22, 0.38, 0.40], first_bold=True), Spacer(1, 8),
          P("À quel rythme transmettre", "h2"),
          P("Contrairement aux factures, qui circulent au fil de l'eau, le e-reporting suit un rythme fixé par votre régime de TVA (décret n° 2022-1299 du 7 octobre 2022, modifié)."),
          table([
              ["Régime de TVA", "Données de transaction", "Données de paiement"],
              ["Réel normal mensuel", "Par décade (3 fois par mois)", "Mensuelle"],
              ["Réel normal trimestriel", "Mensuelle", "Mensuelle"],
              ["Réel simplifié", "Mensuelle", "Mensuelle"],
              ["Franchise en base (micro-entrepreneurs)", "Tous les 2 mois", "Tous les 2 mois"],
          ], [0.4, 0.3, 0.3], first_bold=True), Spacer(1, 4),
          P("Le rythme exact des dates limites dépend du régime. Votre plateforme les gère pour vous si elle est bien paramétrée. Une évolution des régimes de TVA est annoncée pour 2027 : vérifiez votre régime avec votre expert-comptable avant septembre 2027.", "small"),
          box("Simplifications obtenues en 2025",
              ["Pas de e-reporting « à blanc » quand il n'y a rien à déclarer.",
               "Plus de nombre de transactions à transmettre pour le B2C.",
               "Plus de détail ligne par ligne pour les acquisitions internationales.",
               "Méthode simplifiée de calcul de la TVA sur marge pour le B2C."]),
          box("Pour les commerçants avec caisse",
              ["Vos ventes au comptoir relèvent du e-reporting B2C. Les données agrégées de votre logiciel de caisse certifié (tickets Z) servent de base. Vérifiez que votre caisse est reliée à une plateforme agréée ou exporte un fichier que votre plateforme sait lire."]),
          PageBreak()]

# ---------- 9. Sanctions ----------
story += chapter("9", "Les sanctions et la période de tolérance", "Le régime a été durci par la loi de finances pour 2026 (article 123). Son application démarre progressivement.")
story += [table([
    ["Manquement", "Sanction", "Base légale"],
    ["Pas de plateforme agréée pour recevoir", "Mise en demeure de 3 mois, puis 500 €. Nouvelle mise en demeure de 3 mois, puis 1 000 €, renouvelable tous les 3 mois.", "CGI, art. 1737, IV bis"],
    ["Facture non émise au format électronique", "50 € par facture, plafond 15 000 € par année civile", "CGI, art. 1737, III"],
    ["Données de e-reporting non transmises", "500 € par transmission jusqu'au 31/12/2026, puis 250 € dès 2027. Plafond 15 000 € par an et par type de données.", "CGI, art. 1788 D"],
    ["Mention obligatoire manquante ou erronée", "15 € par mention, plafond 25 % du montant de la facture", "CGI, art. 1737"],
], [0.30, 0.50, 0.20], first_bold=True), Spacer(1, 8),
    P("Le droit à l'erreur", "h2"),
    P("Pour l'émission et le e-reporting, l'amende ne s'applique pas à la première infraction de l'année en cours et des trois années précédentes si vous la corrigez spontanément ou dans les 30 jours suivant la première demande de l'administration. Cette dispense ne couvre pas l'amende liée à la réception."),
    P("La tolérance 2026", "h2"),
    P("Le gouvernement l'a confirmé le 1er septembre puis le 8 octobre 2026 : <b>aucune sanction ne sera prononcée avant la fin de l'année 2026.</b> L'administration contacte d'abord l'entreprise, examine sa trajectoire, puis seulement envisage une mise en demeure."),
    box("Ce que la tolérance n'est pas",
        ["Ce n'est ni un report ni une suspension de l'obligation. L'administration distingue la bonne foi documentée (plateforme choisie, échanges avec l'éditeur ou le comptable, tests, régularisations) de l'inertie ou du refus.",
         "Conservez la trace de vos démarches : contrat ou souscription à une plateforme, e-mails avec votre éditeur, comptes rendus de tests. Certaines plateformes délivrent une attestation qui retrace vos démarches."],
        bg=WARN_BG, border=WARN),
    P("Combien coûte l'inaction ?", "h2"),
    P("Exemple : un artisan qui émet 40 factures B2B par mois sans facture électronique à partir de septembre 2027. Sur 4 mois (septembre à décembre 2027) : 160 factures x 50 € = 8 000 € d'amende potentielle, avant plafond. Sur une année pleine, le plafond de 15 000 € est atteint. Un abonnement à une plateforme coûte de 0 à quelques dizaines d'euros par mois."),
    PageBreak()]

# ---------- 10. Choisir sa PA ----------
story += chapter("10", "Choisir sa plateforme agréée", "C'est la décision la plus structurante. Une bonne plateforme fait le travail technique à votre place.")
story += [P("Les trois options", "h2"),
          table([
              ["Option", "Pour qui", "Avantage", "Point de vigilance"],
              ["Logiciel de facturation ou de gestion compatible, relié à une PA", "Indépendants, TPE qui facturent déjà avec un outil", "Rien ne change dans vos habitudes", "Vérifier le nom de la PA partenaire et la date de mise en service de l'émission"],
              ["Banque ou néobanque pro avec facturation intégrée", "Micro-entrepreneurs et petites structures", "Rapprochement automatique paiement et facture, souvent inclus dans l'abonnement", "Dépendance à la banque si vous changez de compte"],
              ["Plateforme agréée en direct", "PME avec volume, ERP ou plusieurs logiciels", "Contrôle complet des flux et des connecteurs", "Coût et paramétrage plus lourds"],
          ], [0.25, 0.22, 0.25, 0.28], first_bold=True), Spacer(1, 8),
          P("La grille de choix en 10 critères", "h2"),
          table([
              ["#", "Critère", "Question à poser à l'éditeur"],
              ["1", "Immatriculation", "Êtes-vous plateforme agréée ou solution compatible ? Avec quelle PA travaillez-vous ?"],
              ["2", "Périmètre complet", "Gérez-vous réception, émission, e-reporting de transaction et de paiement ?"],
              ["3", "Formats", "Produisez-vous du Factur-X ? Recevez-vous Factur-X, UBL et CII ?"],
              ["4", "Votre métier", "Gérez-vous mes cas : acomptes, situations de travaux, autoliquidation, TVA sur marge, sous-traitance, multi-taux ?"],
              ["5", "Intégration", "Se connecte-t-elle à mon logiciel de caisse, ma banque, mon outil comptable ?"],
              ["6", "Expert-comptable", "Mon comptable peut-il accéder automatiquement à mes factures ?"],
              ["7", "Archivage", "Archivez-vous à valeur probante pendant 10 ans ? Puis-je tout exporter ?"],
              ["8", "Tarif réel", "Quel prix par mois et par facture au-delà du forfait ? Frais de mise en service ?"],
              ["9", "Réversibilité", "Durée d'engagement ? Comment je récupère mes données si je pars ?"],
              ["10", "Support", "Support en français, par téléphone, avec quels délais ?"],
          ], [0.05, 0.2, 0.75]), Spacer(1, 6),
          box("Vous pouvez changer de plateforme",
              ["Vous pouvez à tout moment désigner une nouvelle plateforme dans l'annuaire. L'ancienne doit maintenir la gestion des statuts pendant un an et vous fournir sous 5 jours ouvrés les informations utiles. Vos conditions contractuelles de résiliation restent applicables : lisez-les avant de signer."]),
          box("Gagnez du temps",
              ["Le quiz de %s compare les logiciels selon votre métier, votre statut et votre volume de factures, en 5 questions. Le registre officiel des plateformes agréées est consultable sur impots.gouv.fr." % SITE]),
          PageBreak()]

# ---------- 11. Profils ----------
story += chapter("11", "Ce qui change selon votre profil", "Repérez votre situation et ses points d'attention.")
profils = [
    ("Micro-entrepreneur en franchise de TVA",
     ["Recevoir : obligatoire depuis le 1er septembre 2026.", "Émettre : 1er septembre 2027 pour vos clients professionnels.",
      "E-reporting : tous les 2 mois pour vos ventes aux particuliers et à l'étranger.",
      "Gardez la mention « TVA non applicable, article 293 B du CGI ». Un logiciel de facturation gratuit relié à une PA suffit souvent."]),
    ("Artisan du bâtiment",
     ["Factures d'acompte et de situation de travaux à prévoir dans votre outil.",
      "Autoliquidation en sous-traitance : la mention doit apparaître dans un champ structuré.",
      "Adresse du chantier = adresse de livraison si elle diffère de l'adresse de facturation. Mention obligatoire.",
      "Vos fournisseurs de matériaux (négoces, grandes enseignes) vous envoient déjà des factures électroniques."]),
    ("Commerçant avec boutique",
     ["Vos ventes au comptoir à des particuliers relèvent du e-reporting, pas de la facture électronique.",
      "Vos ventes à des professionnels (entreprises, associations assujetties) passent par la facture électronique dès 2027.",
      "Vérifiez la liaison entre votre caisse certifiée et une plateforme agréée."]),
    ("E-commerçant",
     ["Ventes B2C : e-reporting. Ventes B2B en France : facture électronique. Ventes à l'étranger : e-reporting.",
      "Votre CMS doit distinguer client particulier et client professionnel, et collecter le SIREN au checkout pour les pros.",
      "Les ventes via marketplace suivent des règles spécifiques : interrogez votre comptable."]),
    ("Profession de santé ou d'enseignement exonérée",
     ["Pas d'émission électronique ni de e-reporting pour vos actes exonérés.",
      "Réception obligatoire : vous devez désigner une plateforme pour recevoir les factures de vos fournisseurs (loyer professionnel, matériel, logiciels).",
      "L'administration a mené des corrections de masse de l'annuaire pour ces professions. Vérifiez votre inscription."]),
    ("Profession libérale ou consultant",
     ["Prestations de services : TVA exigible à l'encaissement. Le statut « Encaissée » ou les données de paiement deviennent obligatoires.",
      "Clients étrangers fréquents : e-reporting des opérations internationales.",
      "Demandez à votre outil de marquer automatiquement les factures encaissées lors du rapprochement bancaire."]),
    ("PME avec ERP ou plusieurs logiciels",
     ["Cartographiez tous les flux de facturation : ventes, achats, notes de frais, refacturations internes.",
      "Choisissez une PA avec connecteurs ou API vers votre ERP. Prévoyez 3 à 6 mois de projet.",
      "Testez en émission avant l'échéance : les rejets en production coûtent cher en trésorerie."]),
]
for title, lines in profils:
    story.append(box(title, lines))
story.append(PageBreak())

# ---------- 12. Plan d'action ----------
story += chapter("12", "Votre plan d'action jusqu'au 1er septembre 2027", "Pour une TPE, une PME ou un indépendant. Comptez quelques heures réparties sur plusieurs mois.")
plan = [
    ["Quand", "Action", "Livrable"],
    ["Avant le 31/12/2026", "Choisir une plateforme agréée ou un logiciel compatible. Vérifier votre inscription et votre adresse de réception dans l'annuaire.", "Contrat ou compte actif, preuve d'inscription"],
    ["Avant le 31/12/2026", "Recevoir vos premières factures fournisseurs électroniques et les retrouver dans votre outil.", "Une facture reçue et traitée"],
    ["Janvier à mars 2027", "Collecter le SIREN de tous vos clients professionnels. Distinguer clients pros et particuliers dans votre fichier.", "Fichier clients à jour"],
    ["Janvier à mars 2027", "Faire l'inventaire de vos cas de facturation : acomptes, avoirs, autoliquidation, multi-taux, ventes à l'étranger.", "Liste de vos cas d'usage"],
    ["Avril à mai 2027", "Mettre à jour vos modèles de facture avec les 4 nouvelles mentions. Vérifier votre régime de TVA et votre option sur les débits avec votre comptable.", "Modèle de facture conforme"],
    ["Mai à juin 2027", "Paramétrer le e-reporting (B2C, international, encaissements) et la transmission à l'expert-comptable.", "Paramétrage validé"],
    ["Juin à juillet 2027", "Émettre des factures électroniques test ou réelles à des clients volontaires. Traiter les rejets.", "Première facture émise acceptée"],
    ["Août 2027", "Informer vos clients professionnels. Former la personne qui facture. Archiver la trace de vos démarches.", "Process prêt, preuves conservées"],
    ["1er septembre 2027", "Émission électronique de toutes vos factures B2B domestiques et e-reporting actif.", "Conformité complète"],
]
story += [table(plan, [0.2, 0.55, 0.25], first_bold=True), Spacer(1, 8),
          box("Le conseil qui fait gagner du temps",
              ["N'attendez pas l'été 2027. Les plateformes et les experts-comptables seront saturés, comme en août 2026. Une entreprise qui émet dès le printemps 2027 traite ses rejets à froid, sans pression sur la trésorerie."]),
          PageBreak()]

# ---------- 13. Checklist ----------
story += chapter("13", "La checklist à imprimer", "Cochez chaque ligne. Toutes cochées : vous êtes prêt.")


def checklist(title, items):
    class Cb(Flowable):
        def wrap(self, aw, ah): return (10, 11)
        def draw(self):
            self.canv.setStrokeColor(ACC); self.canv.setLineWidth(1); self.canv.roundRect(0, 0, 9, 9, 1.5)
    rows = [[Cb(), Paragraph(i, S["cell"])] for i in items]
    t = Table(rows, colWidths=[8 * mm, CW - 8 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
                           ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                           ("LEFTPADDING", (0, 0), (-1, -1), 2)]))
    return KeepTogether([Paragraph(title, S["h3"]), t, Spacer(1, 6)])


story += [checklist("Réception (obligatoire depuis le 1er septembre 2026)", [
    "J'ai choisi une plateforme agréée ou un logiciel compatible relié à une plateforme agréée",
    "Mon entreprise figure dans l'annuaire avec une adresse de réception active",
    "Je sais où retrouver les factures fournisseurs reçues et les statuts associés",
    "Mon expert-comptable reçoit automatiquement mes factures d'achat"]),
    checklist("Données et documents", [
        "J'ai le SIREN de tous mes clients professionnels",
        "Mon fichier clients distingue particuliers, professionnels français et clients étrangers",
        "Mon modèle de facture intègre les 4 nouvelles mentions",
        "Je connais mon régime de TVA et ma situation sur l'option pour les débits"]),
    checklist("Émission et e-reporting (1er septembre 2027 pour les TPE-PME)", [
        "Mon outil produit des factures au format Factur-X, UBL ou CII",
        "Mes cas particuliers sont gérés : acomptes, avoirs, autoliquidation, multi-taux",
        "Le e-reporting B2C, international et encaissements est paramétré",
        "J'ai émis au moins une facture électronique acceptée avant l'échéance",
        "Je sais distinguer un rejet d'un refus et je sais comment réagir"]),
    checklist("Sécurité et preuves", [
        "L'archivage à valeur probante est assuré pendant 10 ans",
        "J'ai lu les conditions de résiliation et de récupération de mes données",
        "J'ai conservé la trace de mes démarches (contrats, e-mails, tests)"]),
    PageBreak()]

# ---------- 14. Idées reçues ----------
story += chapter("14", "Idées reçues et erreurs fréquentes")
idees = [
    ["Idée reçue", "Réalité"],
    ["« Je suis micro-entrepreneur, je ne suis pas concerné. »", "Faux. La franchise de TVA ne supprime pas l'assujettissement. Réception depuis 2026, émission en 2027."],
    ["« Mon PDF envoyé par e-mail suffit. »", "Faux. Seul un fichier structuré transmis par une plateforme agréée est conforme à partir de votre date d'émission."],
    ["« L'État fournit une plateforme gratuite. »", "Faux. Le portail public a été recentré sur l'annuaire et les données fiscales. Des offres gratuites existent chez des acteurs privés."],
    ["« Je ne vends qu'à des particuliers, rien ne change. »", "Faux. Vous devez recevoir les factures de vos fournisseurs et transmettre vos données de vente en e-reporting."],
    ["« Pas de sanction en 2026, j'attends. »", "Risqué. La tolérance récompense une démarche engagée et documentée. Elle ne protège pas l'inertie."],
    ["« Je dois choisir une plateforme pour la vie. »", "Faux. Vous pouvez changer de plateforme. Vérifiez seulement la réversibilité contractuelle."],
    ["« Une facture reçue en PDF n'est plus déductible. »", "Faux. En cas d'incident, elle reste payable et ouvre droit à déduction si l'opération est réelle et la facture complète."],
    ["« Mon comptable s'occupe de tout. »", "En partie. Il peut vous inscrire dans l'annuaire par mandat et vous conseiller. C'est vous qui émettez vos factures."],
]
story += [table(idees, [0.38, 0.62]), PageBreak()]

# ---------- 15. Glossaire + sources ----------
story += chapter("15", "Glossaire, ressources et sources")
gl = [
    ["Terme", "Définition"],
    ["Assujetti", "Personne qui exerce une activité économique de manière indépendante, au sens de l'article 256 A du CGI, même si elle ne facture pas la TVA."],
    ["Annuaire central", "Répertoire de l'État qui associe chaque SIREN à sa plateforme de réception."],
    ["B2B, B2C, B2G", "Entre entreprises, vers des particuliers, vers le secteur public."],
    ["Cycle de vie", "Suite des statuts d'une facture : déposée, rejetée, refusée, encaissée..."],
    ["E-invoicing", "Émission et réception de factures électroniques entre entreprises via des plateformes agréées."],
    ["E-reporting", "Transmission à l'administration des données de transaction et de paiement qui ne passent pas par la facture électronique."],
    ["Factur-X", "Format mixte PDF + XML, lisible par un humain et par un logiciel."],
    ["PA (plateforme agréée)", "Prestataire immatriculé par la DGFiP, seul habilité à échanger les factures et à transmettre les données. Ancien nom : PDP."],
    ["Peppol", "Réseau international d'échange de documents électroniques utilisé par les plateformes."],
    ["PPF", "Portail public de facturation, recentré sur l'annuaire et la collecte des données fiscales."],
    ["Solution compatible", "Logiciel non immatriculé qui se connecte à une plateforme agréée."],
    ["TVA sur les débits", "Option qui rend la TVA exigible à la facturation plutôt qu'à l'encaissement pour les prestations de services."],
]
story += [table(gl, [0.25, 0.75], first_bold=True), Spacer(1, 10),
          P("Ressources officielles", "h2"),
          table([
              ["Ressource", "Adresse"],
              ["Numéro national d'assistance", "0 806 807 807"],
              ["Rubrique officielle de la réforme", "impots.gouv.fr/professionnel/je-passe-la-facturation-electronique"],
              ["Liste des plateformes agréées", "impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees"],
              ["Page ministérielle et guide pratique de démarrage", "economie.gouv.fr/tout-savoir-sur-la-facturation-electronique-pour-les-entreprises"],
              ["Guide CNOEC « Bien choisir sa Plateforme Agréée »", "mafacture-monexpert.fr"],
              ["Recherche de SIREN", "annuaire-entreprises.data.gouv.fr"],
              ["Facturer le secteur public", "chorus-pro.gouv.fr"],
          ], [0.45, 0.55], first_bold=True), PageBreak(),
          P("Textes et sources utilisés", "h2")]
story += bullets([
    "Loi n° 2023-1322 du 29 décembre 2023 de finances pour 2024, article 91 (calendrier).",
    "Loi n° 2026-103 du 19 février 2026 de finances pour 2026, article 123 (plateformes agréées, annuaire, sanctions).",
    "Décret n° 2022-1299 du 7 octobre 2022, décret n° 2024-266 du 25 mars 2024, décret n° 2026-677 et arrêté du 27 juillet 2026.",
    "Code général des impôts, articles 289 bis, 1737 et 1788 D.",
    "economie.gouv.fr : « Facturation électronique : trois entreprises sur quatre déjà engagées dans la réforme », 12 octobre 2026.",
    "DGFiP : guide pratique de démarrage de la facturation électronique, juillet 2026 (mise à jour annoncée fin octobre 2026).",
    "Compta Online : dossier « Facturation électronique : calendrier, obligations et sanctions », mis à jour le 5 octobre 2026.",
], "bullet")
story += [Spacer(1, 12),
          box("Restez à jour",
              ["La réforme évolue : guide pratique mis à jour, comité de suivi avant fin 2026, préparation de l'échéance 2027. Vous recevrez les changements importants par notre newsletter.",
               "Pour trouver le logiciel adapté à votre métier : %s/outils/quiz" % SITE_URL]),
          Spacer(1, 6),
          P("Ce guide fournit une information générale à jour au 15 octobre 2026. Il ne constitue pas un conseil juridique ou fiscal. Pour votre situation précise, consultez votre expert-comptable. %s est financé par des commissions d'affiliation qui n'influencent pas le contenu de ce guide." % SITE, "small")]

doc.multiBuild(story)
print("OK", OUT)
